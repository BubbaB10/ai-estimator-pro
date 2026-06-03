import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function generateEstimateNumber(): string {
  const prefix = 'EST'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

function getTradeIcon(trade: string): string {
  const icons: Record<string, string> = {
    'Plumbing': '🔧',
    'Electrical': '⚡',
    'HVAC': '❄️',
    'Roofing': '🏠',
    'General Contractor': '🔨',
    'Painting': '🎨',
    'Carpentry': '🪵',
    'Flooring': '🪟',
    'Landscaping': '🌿',
    'Other': '🛠️',
  }
  return icons[trade] || '🛠️'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      jobDescription,
      tradeType,
      location,
      planImageBase64,
      isPlanUpload = false,
    } = body

    const tradeIcon = getTradeIcon(tradeType)

    const systemPrompt = `You are an expert ${tradeType} contractor estimator with 25+ years of field experience. You specialize in helping small 1-5 person contractor shops price jobs correctly so they never undercharge.

CRITICAL RULE: Always output a LOW / MID / HIGH range. Never give a single price. The contractor needs to protect themselves from undercharging.

Your job:
1. Analyze the job described
2. Determine how much detail was provided (confidence level)
3. Output a complete JSON estimate with three price tiers
4. List ALL assumptions you made
5. List what would change the price

Confidence levels:
- "low" = very vague description, minimal detail → wide range (40-60% spread), strong warning
- "medium" = some detail but missing key info → moderate range (20-35% spread)
- "high" = detailed description or plan sheet → tight range (10-20% spread)

Labor rate guidelines:
- Plumbing: $85–$125/hr
- Electrical: $90–$135/hr
- HVAC: $90–$130/hr
- Roofing: $60–$100/hr
- General Contractor: $65–$105/hr
- Painting: $50–$85/hr
- Carpentry: $65–$110/hr
- Other trades: $55–$100/hr

ALWAYS respond with ONLY valid JSON in this exact structure:
{
  "confidence": "low" | "medium" | "high",
  "confidenceMissing": ["list of items that would improve confidence if provided"],
  "jobSummary": "One sentence description of the job",
  "conservative": number,
  "mostLikely": number,
  "fullScope": number,
  "lineItems": [
    {
      "description": "string",
      "lowCost": number,
      "highCost": number,
      "category": "Labor" | "Materials" | "Equipment" | "Permits" | "Other"
    }
  ],
  "laborHoursLow": number,
  "laborHoursHigh": number,
  "laborRateLow": number,
  "laborRateHigh": number,
  "assumptions": ["assumption 1", "assumption 2", "assumption 3"],
  "changeFactors": [
    {"condition": "description of what could change price", "delta": "$X–$X,XXX"},
    {"condition": "...", "delta": "..."}
  ],
  "notes": "Any important notes, permit requirements, warnings"
}`

    const userMessage = isPlanUpload
      ? `Trade type: ${tradeType}${location ? `\nLocation/Region: ${location}` : ''}

A plan sheet or drawing has been uploaded. Analyze it carefully and extract:
- Dimensions and square footage
- Room counts or fixture counts
- Linear footage of any runs
- Scope of work visible in the drawing

Generate a plan-based estimate. Since this is from a plan sheet, use HIGH confidence unless the drawing is incomplete.

Job description (if any): ${jobDescription || 'See uploaded plan sheet'}`
      : `Trade type: ${tradeType}${location ? `\nLocation/Region: ${location}` : ''}

Job description: ${jobDescription}

Generate a complete Low/Mid/High estimate for this job.`

    let messages: OpenAI.Chat.ChatCompletionMessageParam[]

    if (planImageBase64 && isPlanUpload) {
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userMessage },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${planImageBase64}`,
                detail: 'high',
              }
            }
          ]
        }
      ]
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2500,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from OpenAI')

    const aiResult = JSON.parse(content)

    const lineItems = (aiResult.lineItems || []).map((item: {
      description?: string;
      lowCost?: number;
      highCost?: number;
      category?: string;
    }) => ({
      description: String(item.description || ''),
      lowCost: Number(item.lowCost) || 0,
      highCost: Number(item.highCost) || 0,
      category: item.category || 'Other',
    }))

    return NextResponse.json({
      tradeIcon,
      tradeType,
      location: location || null,
      jobSummary: aiResult.jobSummary || jobDescription,
      confidence: aiResult.confidence || 'medium',
      confidenceMissing: aiResult.confidenceMissing || [],
      conservative: Math.round(Number(aiResult.conservative) || 0),
      mostLikely: Math.round(Number(aiResult.mostLikely) || 0),
      fullScope: Math.round(Number(aiResult.fullScope) || 0),
      lineItems,
      laborHoursLow: Number(aiResult.laborHoursLow) || 0,
      laborHoursHigh: Number(aiResult.laborHoursHigh) || 0,
      laborRateLow: Number(aiResult.laborRateLow) || 0,
      laborRateHigh: Number(aiResult.laborRateHigh) || 0,
      assumptions: aiResult.assumptions || [],
      changeFactors: aiResult.changeFactors || [],
      notes: aiResult.notes || '',
      estimateNumber: generateEstimateNumber(),
      isPlanBased: isPlanUpload && !!planImageBase64,
    })

  } catch (error: unknown) {
    console.error('Estimate API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
