import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Stripe from 'stripe'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

function generateEstimateNumber(): string {
  const prefix = 'EST'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobDescription, tradeType, businessName, businessPhone, businessEmail, taxRate = 8.25, imageBase64, sessionId } = body

    // Verify subscription
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.payment_status !== 'paid' && session.status !== 'complete') {
          return NextResponse.json({ error: 'Payment required' }, { status: 402 })
        }
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 402 })
      }
    } else {
      // Check for active subscription via customer email or subscription header
      const authHeader = req.headers.get('x-subscription-id')
      if (authHeader) {
        try {
          const sub = await stripe.subscriptions.retrieve(authHeader)
          if (sub.status !== 'active' && sub.status !== 'trialing') {
            return NextResponse.json({ error: 'Subscription not active' }, { status: 402 })
          }
        } catch {
          return NextResponse.json({ error: 'Invalid subscription' }, { status: 402 })
        }
      }
      // In development / demo mode — allow without payment
      // In production, you'd enforce payment here
    }

    const systemPrompt = `You are an expert ${tradeType} contractor estimator with 20+ years of experience. You create precise, professional estimates with accurate labor rates and material costs based on current market prices.

Generate a detailed estimate with realistic line items. Break everything down by:
- Labor (hours × rate)  
- Materials (with quantities)
- Equipment rental if needed
- Service/diagnostic fees
- Permits if applicable

Use these guidelines for rates:
- Plumbing labor: $85-120/hr
- Electrical labor: $90-130/hr  
- HVAC labor: $90-125/hr
- Roofing labor: $60-100/hr
- General contractor: $65-100/hr
- Other trades: $60-100/hr

Always respond with ONLY valid JSON in this exact format:
{
  "lineItems": [
    {
      "description": "string - clear description of work or material",
      "qty": number,
      "unitCost": number,
      "total": number,
      "category": "Labor" | "Materials" | "Equipment" | "Permits" | "Other"
    }
  ],
  "subtotal": number,
  "notes": "string - any important notes, warranties, scope limitations, or payment terms"
}`

    const userContent = jobDescription
      ? `Trade type: ${tradeType}\n\nJob description: ${jobDescription}\n\nTax rate will be applied separately at ${taxRate}%. Generate a complete itemized estimate for this job.`
      : `Trade type: ${tradeType}\n\nGenerate a complete itemized estimate based on the work visible in the attached photo.\n\nTax rate will be applied separately at ${taxRate}%.`

    let messages: OpenAI.Chat.ChatCompletionMessageParam[]

    if (imageBase64) {
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userContent },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              }
            }
          ]
        }
      ]
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('No content from OpenAI')

    const aiResult = JSON.parse(content)

    // Validate and recalculate
    const lineItems = aiResult.lineItems.map((item: any) => ({
      description: String(item.description || ''),
      qty: Number(item.qty) || 1,
      unitCost: Number(item.unitCost) || 0,
      total: Number(item.total) || (Number(item.qty || 1) * Number(item.unitCost || 0)),
      category: item.category || 'Other',
    }))

    const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.total, 0)
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax

    return NextResponse.json({
      lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      taxRate,
      total: Math.round(total * 100) / 100,
      notes: aiResult.notes || '',
      estimateNumber: generateEstimateNumber(),
    })

  } catch (error: unknown) {
    console.error('Estimate API error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
