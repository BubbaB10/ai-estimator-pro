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
      isMultiScope = false,
    } = body

    const tradeIcon = getTradeIcon(tradeType)

    const multiScopeInstruction = isMultiScope
      ? `

MULTI-SCOPE JOB: The job description contains multiple scopes labeled "Scope 1", "Scope 2", etc. You MUST:
- Break out line items per scope section — clearly label each group in the lineItems descriptions using the format "[Scope name] description" (e.g. "[Foundation slab] Concrete pour", "[HVAC system] Unit installation")
- Provide a combined Low/Mid/High across all scopes in the top-level conservative/mostLikely/fullScope fields
- Your jobSummary should mention the total number of scopes and primary trades involved
- The assumptions array should include scope-level assumptions where relevant, prefixed with the scope name
- If a scope specifies square footage, use it for that scope's material and labor calculations`
      : ''

    const systemPrompt = `You are an expert ${tradeType} contractor estimator with 25+ years of field experience. You specialize in helping small 1-5 person contractor shops price jobs correctly so they never undercharge.

CRITICAL RULE: Always output a LOW / MID / HIGH range. Never give a single price. The contractor needs to protect themselves from undercharging.

Your job:
1. Analyze the job described
2. Determine how much detail was provided (confidence level)
3. Output a complete JSON estimate with all required fields
4. Break down the estimate into structured line item categories
5. Identify and list the key assumptions you made
6. Generate 3 What-If scenarios: budget, premium, and phased
7. List what would change the price

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
  "workbenchLineItems": {
    "materials": number,
    "labor": number,
    "equipment": number,
    "permitsAndFees": number,
    "overhead": number,
    "profitMargin": number
  },
  "marginPercent": number,
  "laborHoursLow": number,
  "laborHoursHigh": number,
  "laborRateLow": number,
  "laborRateHigh": number,
  "assumptions": ["assumption 1", "assumption 2", "assumption 3", "assumption 4"],
  "scenarios": {
    "budget": {
      "total": number,
      "description": "Where we cut 15-20% without sacrificing core quality"
    },
    "premium": {
      "total": number,
      "description": "Top-of-market option, best materials and execution"
    },
    "phased": {
      "phase1": {
        "total": number,
        "description": "Phase 1 scope - foundational work"
      },
      "phase2": {
        "total": number,
        "description": "Phase 2 scope - finishing work"
      }
    }
  },
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

${isMultiScope ? 'Multi-scope job description:\n' : 'Job description: '}${jobDescription}

Generate a complete Low/Mid/High estimate for this job. Include all workbench fields especially the workbenchLineItems breakdown and 3 what-if scenarios.`

    let messages: OpenAI.Chat.ChatCompletionMessageParam[]

    const finalSystemPrompt = systemPrompt + multiScopeInstruction

    if (planImageBase64 && isPlanUpload) {
      messages = [
        { role: 'system', content: finalSystemPrompt },
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
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: userMessage }
      ]
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 3500,
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

    // Build workbench line items — use AI-provided or derive from lineItems
    const wli = aiResult.workbenchLineItems || {}
    const mostLikely = Math.round(Number(aiResult.mostLikely) || 0)
    const marginPct = Number(wli.marginPercent || aiResult.marginPercent) || 10

    // Derive from regular line items if AI didn't provide structured breakdown
    let materials = Number(wli.materials) || 0
    let labor = Number(wli.labor) || 0
    let equipment = Number(wli.equipment) || 0
    let permitsAndFees = Number(wli.permitsAndFees) || 0
    let overhead = Number(wli.overhead) || 0
    let profitMargin = Number(wli.profitMargin) || 0

    if (!materials && !labor) {
      // Derive from line items
      for (const item of lineItems) {
        const avg = (item.lowCost + item.highCost) / 2
        if (item.category === 'Materials') materials += avg
        else if (item.category === 'Labor') labor += avg
        else if (item.category === 'Equipment') equipment += avg
        else if (item.category === 'Permits') permitsAndFees += avg
        else overhead += avg
      }
      if (!materials && !labor) {
        // Fallback: distribute mostLikely
        const base = mostLikely / (1 + marginPct / 100)
        materials = Math.round(base * 0.38)
        labor = Math.round(base * 0.42)
        equipment = Math.round(base * 0.06)
        permitsAndFees = Math.round(base * 0.05)
        overhead = Math.round(base * 0.05)
        profitMargin = mostLikely - materials - labor - equipment - permitsAndFees - overhead
      } else {
        profitMargin = Math.round((materials + labor + equipment + permitsAndFees + overhead) * (marginPct / 100))
        overhead = overhead || Math.round((materials + labor + equipment + permitsAndFees) * 0.05)
      }
      materials = Math.round(materials)
      labor = Math.round(labor)
      equipment = Math.round(equipment)
      permitsAndFees = Math.round(permitsAndFees)
      overhead = Math.round(overhead)
      profitMargin = Math.round(profitMargin)
    }

    // Build scenarios
    const scenarios = {
      budget: {
        total: Math.round(Number(aiResult.scenarios?.budget?.total) || mostLikely * 0.83),
        description: aiResult.scenarios?.budget?.description || 'Reduced material grades, extended timeline, minimal extras',
      },
      premium: {
        total: Math.round(Number(aiResult.scenarios?.premium?.total) || mostLikely * 1.25),
        description: aiResult.scenarios?.premium?.description || 'Premium materials, faster timeline, top-of-market execution',
      },
      phased: {
        phase1: {
          total: Math.round(Number(aiResult.scenarios?.phased?.phase1?.total) || mostLikely * 0.58),
          description: aiResult.scenarios?.phased?.phase1?.description || 'Phase 1: Core structural and rough work',
        },
        phase2: {
          total: Math.round(Number(aiResult.scenarios?.phased?.phase2?.total) || mostLikely * 0.42),
          description: aiResult.scenarios?.phased?.phase2?.description || 'Phase 2: Finishing, trim, and final details',
        },
      },
    }

    return NextResponse.json({
      tradeIcon,
      tradeType,
      location: location || null,
      jobSummary: aiResult.jobSummary || jobDescription,
      confidence: aiResult.confidence || 'medium',
      confidenceMissing: aiResult.confidenceMissing || [],
      conservative: Math.round(Number(aiResult.conservative) || 0),
      mostLikely,
      fullScope: Math.round(Number(aiResult.fullScope) || 0),
      lineItems,
      workbenchLineItems: {
        materials,
        labor,
        equipment,
        permitsAndFees,
        overhead,
        profitMargin,
      },
      marginPercent: marginPct,
      laborHoursLow: Number(aiResult.laborHoursLow) || 0,
      laborHoursHigh: Number(aiResult.laborHoursHigh) || 0,
      laborRateLow: Number(aiResult.laborRateLow) || 0,
      laborRateHigh: Number(aiResult.laborRateHigh) || 0,
      assumptions: aiResult.assumptions || [],
      scenarios,
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
