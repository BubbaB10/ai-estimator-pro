import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ valid: false, error: 'No session ID' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })

    const subscription = session.subscription as Stripe.Subscription | null

    const isValid =
      session.payment_status === 'paid' ||
      session.status === 'complete' ||
      (subscription && (subscription.status === 'active' || subscription.status === 'trialing'))

    return NextResponse.json({
      valid: isValid,
      customerId: session.customer,
      subscriptionId: subscription?.id ?? null,
      status: subscription?.status ?? null,
    })
  } catch (error: unknown) {
    console.error('Verify subscription error:', error)
    return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 500 })
  }
}
