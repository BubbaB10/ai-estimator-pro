'use client'

import { useState } from 'react'
import styles from './page.module.css'

const TRADES = ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'General Contractor', 'Painting', 'Carpentry', 'Flooring', 'Landscaping', 'Other']

const TESTIMONIALS = [
  { name: 'Mike T.', trade: 'Plumber, Dallas TX', quote: 'Used to spend 45 minutes on each estimate. Now it\'s done before I finish my coffee.' },
  { name: 'Sarah K.', trade: 'Electrician, Phoenix AZ', quote: 'My estimates look more professional than the big companies. Customers trust me more.' },
  { name: 'James R.', trade: 'HVAC Tech, Atlanta GA', quote: 'Won 3 more jobs last month just because my estimates came back faster than competitors.' },
]

export default function HomePage() {
  const [loading, setLoading] = useState(false)

  const handleGetStarted = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.origin })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error starting checkout. Please try again.')
      }
    } catch (e) {
      alert('Error starting checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #1e293b', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f1f5f9' }}>AI Estimator Pro</span>
        </div>
        <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem' }} onClick={handleGetStarted} disabled={loading}>
          {loading ? 'Loading...' : 'Start Free Trial →'}
        </button>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '100px 20px 80px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="badge">🔧 Built for Trades</div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', color: '#f1f5f9' }}>
          Professional Estimates<br />
          <span style={{ color: '#f97316' }}>in 30 Seconds</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '40px', lineHeight: 1.6 }}>
          Describe the job or snap a photo — get a complete, professional estimate with line items, labor, materials, and your company logo. No more losing jobs because your estimate took too long.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '18px 40px' }} onClick={handleGetStarted} disabled={loading}>
            {loading ? 'Loading...' : 'Get My First Estimate Free →'}
          </button>
        </div>
        <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.9rem' }}>
          $49/mo after trial. Cancel anytime.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#1e293b', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '60px' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {[
              { icon: '📝', step: '1', title: 'Describe the Job', desc: 'Type what needs to be done, or upload a photo of the work site. Be as detailed or brief as you want.' },
              { icon: '🤖', step: '2', title: 'AI Generates Estimate', desc: 'GPT-4o analyzes your job, applies trade-standard rates, and creates a complete itemized estimate in seconds.' },
              { icon: '📄', step: '3', title: 'Send to Customer', desc: 'Download a professional PDF with your business name, logo, and contact info. Ready to send immediately.' },
            ].map(item => (
              <div key={item.step} className="card" style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: '#f97316', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>{item.step}</div>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px', marginTop: '8px' }}>{item.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1.1rem' }}>{item.title}</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRADES */}
      <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>Works for Every Trade</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '48px', fontSize: '1.1rem' }}>AI Estimator Pro understands trade-specific labor rates, materials, and common job types.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {[
            { icon: '🔧', name: 'Plumbing' },
            { icon: '⚡', name: 'Electrical' },
            { icon: '❄️', name: 'HVAC' },
            { icon: '🏠', name: 'Roofing' },
            { icon: '🔨', name: 'General Contractor' },
            { icon: '🎨', name: 'Painting' },
            { icon: '🪵', name: 'Carpentry' },
            { icon: '🪟', name: 'Windows & Doors' },
            { icon: '🌿', name: 'Landscaping' },
            { icon: '🚿', name: 'Bathroom Remodel' },
          ].map(t => (
            <div key={t.name} style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
              <span>{t.icon}</span>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SAMPLE ESTIMATE */}
      <section style={{ background: '#1e293b', padding: '80px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>What You Get</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '40px' }}>A complete professional estimate — looks like it came from a $200/hr estimator.</p>
          <div className="card" style={{ border: '1px solid #f97316' }}>
            <div style={{ borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Smith Plumbing Co.</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>555-123-4567 | smithplumbing.com</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ESTIMATE #1042</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Jun 1, 2026</div>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>JOB DESCRIPTION</div>
              <div style={{ fontSize: '0.95rem' }}>Replace main water shutoff valve and repair leaking supply lines under kitchen sink</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px' }}>Description</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Unit</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { desc: 'Service call / diagnostic', qty: 1, unit: '$85', total: '$85' },
                  { desc: 'Main shutoff valve (ball valve, 3/4")', qty: 1, unit: '$65', total: '$65' },
                  { desc: 'Supply line replacement (braided SS)', qty: 2, unit: '$18', total: '$36' },
                  { desc: 'Labor — valve replacement', qty: 1.5, unit: '$95/hr', total: '$143' },
                  { desc: 'Labor — supply lines & testing', qty: 0.5, unit: '$95/hr', total: '$48' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px 4px' }}>{row.desc}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#94a3b8' }}>{row.qty}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#94a3b8' }}>{row.unit}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
              {[
                { label: 'Subtotal', value: '$377' },
                { label: 'Tax (8.25%)', value: '$31' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  <span>{r.label}</span><span>{r.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#f97316', marginTop: '8px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                <span>TOTAL</span><span>$408</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '48px' }}>Contractors Love It</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="card">
              <div style={{ color: '#f97316', fontSize: '1.3rem', marginBottom: '12px' }}>★★★★★</div>
              <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ fontWeight: 700 }}>{t.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{t.trade}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background: '#1e293b', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Simple Pricing</h2>
          <p style={{ color: '#94a3b8', marginBottom: '40px', fontSize: '1.1rem' }}>One plan. Unlimited estimates. Less than one hour of your time per month.</p>
          <div className="card" style={{ border: '2px solid #f97316' }}>
            <div className="badge" style={{ marginBottom: '8px' }}>Most Popular</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>AI Estimator Pro</h3>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#f97316', marginBottom: '4px' }}>$49</div>
            <div style={{ color: '#64748b', marginBottom: '32px' }}>per month, cancel anytime</div>
            <ul style={{ listStyle: 'none', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                '✅ Unlimited estimate generations',
                '✅ Text description + photo upload',
                '✅ Professional PDF download',
                '✅ Your business name & logo',
                '✅ All trades supported',
                '✅ Trade-accurate line items',
                '✅ Labor + materials + markup',
                '✅ Cancel anytime',
              ].map(f => (
                <li key={f} style={{ color: '#cbd5e1', textAlign: 'left', fontSize: '0.95rem' }}>{f}</li>
              ))}
            </ul>
            <button className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }} onClick={handleGetStarted} disabled={loading}>
              {loading ? 'Loading...' : 'Start Free Trial — $49/mo →'}
            </button>
            <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.85rem' }}>
              7-day free trial included. No credit card surprises.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px' }}>Stop Losing Jobs to Slow Estimates</h2>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.6 }}>
          Every hour you spend writing estimates by hand is an hour you could be billing. Let AI do it in 30 seconds.
        </p>
        <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '18px 48px' }} onClick={handleGetStarted} disabled={loading}>
          {loading ? 'Loading...' : 'Get Started Now — Free Trial →'}
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1e293b', padding: '24px', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
        <p>© 2026 AI Estimator Pro · Built by Micro Titan LLC · <a href="mailto:support@micro-titan.com" style={{ color: '#64748b' }}>support@micro-titan.com</a></p>
      </footer>
    </div>
  )
}
