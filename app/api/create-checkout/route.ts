import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { returnUrl } = body

    const baseUrl = returnUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-estimator-pro.vercel.app'

    // Create or retrieve the product
    let priceId = process.env.STRIPE_PRICE_ID

    if (!priceId) {
      // Create product + price on first run
      const product = await stripe.products.create({
        name: 'AI Estimator Pro',
        description: 'Unlimited professional estimate generation for contractors and trades. Generate estimates from text or photos in seconds.',
        metadata: { app: 'ai-estimator' },
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 4900, // $49.00
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: 'AI Estimator Pro Monthly',
      })

      priceId = price.id
      console.log('Created Stripe price:', priceId)
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 7,
        metadata: { app: 'ai-estimator' },
      },
      success_url: `${baseUrl}/estimate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: 'always',
      metadata: {
        app: 'ai-estimator',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
