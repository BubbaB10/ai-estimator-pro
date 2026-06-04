import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface RefinementMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      jobDescription,
      tradeType,
      location,
      currentEstimate,
      refinementRequest,
      conversationHistory = [],
    }: {
      jobDescription: string
      tradeType: string
      location: string | null
      currentEstimate: {
        mostLikely: number
        conservative: number
        fullScope: number
        assumptions: string[]
        workbenchLineItems: {
          materials: number
          labor: number
          equipment: number
          permitsAndFees: number
          overhead: number
          profitMargin: number
        }
        marginPercent: number
        scenarios: {
          budget: { total: number; description: string }
          premium: { total: number; description: string }
          phased: {
            phase1: { total: number; description: string }
            phase2: { total: number; description: string }
          }
        }
      }
      refinementRequest: string
      conversationHistory: RefinementMessage[]
    } = body

    const systemPrompt = `You are an expert ${tradeType} contractor estimator. You are refining an existing estimate based on user feedback.

ORIGINAL JOB: ${jobDescription}
${location ? `LOCATION: ${location}` : ''}

CURRENT ESTIMATE TOTALS:
- Conservative: $${currentEstimate.conservative?.toLocaleString()}
- Most Likely: $${currentEstimate.mostLikely?.toLocaleString()}
- Full Scope: $${currentEstimate.fullScope?.toLocaleString()}

CURRENT LINE ITEM BREAKDOWN:
- Materials: $${currentEstimate.workbenchLineItems?.materials?.toLocaleString()}
- Labor: $${currentEstimate.workbenchLineItems?.labor?.toLocaleString()}
- Equipment: $${currentEstimate.workbenchLineItems?.equipment?.toLocaleString()}
- Permits & Fees: $${currentEstimate.workbenchLineItems?.permitsAndFees?.toLocaleString()}
- Overhead: $${currentEstimate.workbenchLineItems?.overhead?.toLocaleString()}
- Profit Margin (${currentEstimate.marginPercent}%): $${currentEstimate.workbenchLineItems?.profitMargin?.toLocaleString()}

CURRENT ASSUMPTIONS:
${(currentEstimate.assumptions || []).map((a: string) => `- ${a}`).join('\n')}

The user wants to refine this estimate. Apply the requested changes and return an updated JSON estimate.

ALWAYS respond with ONLY valid JSON in this exact structure:
{
  "conservative": number,
  "mostLikely": number,
  "fullScope": number,
  "workbenchLineItems": {
    "materials": number,
    "labor": number,
    "equipment": number,
    "permitsAndFees": number,
    "overhead": number,
    "profitMargin": number
  },
  "marginPercent": number,
  "assumptions": ["updated assumption 1", "updated assumption 2", ...],
  "scenarios": {
    "budget": { "total": number, "description": "string" },
    "premium": { "total": number, "description": "string" },
    "phased": {
      "phase1": { "total": number, "description": "string" },
      "phase2": { "total": number, "description": "string" }
    }
  },
  "changesSummary": "Brief explanation of what changed and why",
  "updatedAssumptions": ["new assumption 1", "new assumption 2", ...]
}`

    // Build messages array with conversation history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add prior conversation turns (last 5)
    const recentHistory = conversationHistory.slice(-10)
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content })
    }

    // Add the current refinement request
    messages.push({ role: 'user', content: refinementRequest })

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

    const mostLikely = Math.round(Number(aiResult.mostLikely) || currentEstimate.mostLikely)
    const marginPct = Number(aiResult.marginPercent) || currentEstimate.marginPercent || 10

    const wli = aiResult.workbenchLineItems || {}
    const workbenchLineItems = {
      materials: Math.round(Number(wli.materials) || currentEstimate.workbenchLineItems?.materials || 0),
      labor: Math.round(Number(wli.labor) || currentEstimate.workbenchLineItems?.labor || 0),
      equipment: Math.round(Number(wli.equipment) || currentEstimate.workbenchLineItems?.equipment || 0),
      permitsAndFees: Math.round(Number(wli.permitsAndFees) || currentEstimate.workbenchLineItems?.permitsAndFees || 0),
      overhead: Math.round(Number(wli.overhead) || currentEstimate.workbenchLineItems?.overhead || 0),
      profitMargin: Math.round(Number(wli.profitMargin) || currentEstimate.workbenchLineItems?.profitMargin || 0),
    }

    const scenarios = {
      budget: {
        total: Math.round(Number(aiResult.scenarios?.budget?.total) || mostLikely * 0.83),
        description: aiResult.scenarios?.budget?.description || currentEstimate.scenarios?.budget?.description || '',
      },
      premium: {
        total: Math.round(Number(aiResult.scenarios?.premium?.total) || mostLikely * 1.25),
        description: aiResult.scenarios?.premium?.description || currentEstimate.scenarios?.premium?.description || '',
      },
      phased: {
        phase1: {
          total: Math.round(Number(aiResult.scenarios?.phased?.phase1?.total) || mostLikely * 0.58),
          description: aiResult.scenarios?.phased?.phase1?.description || currentEstimate.scenarios?.phased?.phase1?.description || '',
        },
        phase2: {
          total: Math.round(Number(aiResult.scenarios?.phased?.phase2?.total) || mostLikely * 0.42),
          description: aiResult.scenarios?.phased?.phase2?.description || currentEstimate.scenarios?.phased?.phase2?.description || '',
        },
      },
    }

    return NextResponse.json({
      conservative: Math.round(Number(aiResult.conservative) || currentEstimate.conservative),
      mostLikely,
      fullScope: Math.round(Number(aiResult.fullScope) || currentEstimate.fullScope),
      workbenchLineItems,
      marginPercent: marginPct,
      assumptions: aiResult.assumptions || currentEstimate.assumptions || [],
      scenarios,
      changesSummary: aiResult.changesSummary || 'Estimate updated based on your refinement.',
    })

  } catch (error: unknown) {
    console.error('Refine API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
