'use client'

import { useState } from 'react'

const TESTIMONIALS = [
  { name: 'Mike T.', trade: 'Plumber — Dallas TX', quote: 'Used to spend 45 minutes writing estimates by hand. Now I get a full Low/Mid/High range in 30 seconds. I stopped underselling myself.' },
  { name: 'Sarah K.', trade: 'Electrician — Phoenix AZ', quote: 'The assumptions section alone is worth it. I can see exactly what the AI assumed and adjust for my job. Way smarter than a flat number.' },
  { name: 'James R.', trade: 'HVAC Tech — Atlanta GA', quote: 'I uploaded a floor plan photo and it extracted the room count, square footage, and auto-estimated the ductwork. That\'s insane for $49/mo.' },
]

export default function HomePage() {
  const [loading, setLoading] = useState(false)

  const handleGetStarted = () => {
    window.location.href = '/estimate'
  }

  return (
    <div>
      {/* NAV */}
      <nav style={{ borderBottom: '1px solid #1e293b', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* SVG Logo — hard hat style */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#f59e0b"/>
              <path d="M16 5L7 11.5V27H13V20H19V27H25V11.5L16 5Z" fill="#0f172a"/>
              <rect x="13" y="13" width="6" height="5" rx="1" fill="#f59e0b"/>
            </svg>
            <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>AI Estimator Pro</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="#pricing" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none' }}>Pricing</a>
            <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem' }} onClick={handleGetStarted} disabled={loading}>
              {loading ? 'Loading...' : 'Try Free →'}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '100px 20px 80px', maxWidth: '840px', margin: '0 auto' }}>
        <div className="badge" style={{ marginBottom: '20px' }}>
          🔨 Built for HVAC, Plumbing, Electrical, Roofing &amp; General Contractors
        </div>
        <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 900, lineHeight: 1.08, marginBottom: '28px', color: '#f1f5f9', letterSpacing: '-0.03em' }}>
          Stop Guessing.<br />
          <span style={{ color: '#f59e0b' }}>Start Winning Jobs.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '48px', lineHeight: 1.7, maxWidth: '680px', margin: '0 auto 48px' }}>
          AI-powered estimates for trades contractors. Upload your plans or describe the job — get a Low / Mid / High range with full assumptions in 30 seconds.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ fontSize: '1.15rem', padding: '18px 44px' }} onClick={handleGetStarted} disabled={loading}>
            {loading ? 'Loading...' : '⚡ Generate My First Estimate →'}
          </button>
        </div>
        <p style={{ marginTop: '16px', color: '#475569', fontSize: '0.88rem' }}>
          No credit card required to try.
        </p>

        {/* Trust signals */}
        <div style={{ marginTop: '48px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            '✅ Never undercut yourself again — every estimate shows your full range',
            '✅ Every estimate includes assumptions so you know what could change',
            '✅ Upload plan sheets for plan-based estimates (Pro)',
          ].map(signal => (
            <div key={signal} style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', padding: '10px 16px', color: '#94a3b8', fontSize: '0.85rem', maxWidth: '280px', textAlign: 'left' }}>
              {signal}
            </div>
          ))}
        </div>
      </section>

      {/* SAMPLE ESTIMATE OUTPUT */}
      <section style={{ background: '#1e293b', padding: '80px 20px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>What the Output Looks Like</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '40px' }}>Not a single flat number. A full Low / Mid / High range with every assumption spelled out.</p>

          <div className="card" style={{ border: '2px solid #334155', fontFamily: 'monospace', fontSize: '0.88rem' }}>
            {/* Confidence */}
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', padding: '10px 14px', marginBottom: '18px', color: '#fbbf24', fontSize: '0.85rem' }}>
              🟡 Confidence: Medium — consider adding: fixture brand, access condition
            </div>

            {/* Range */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ background: '#0f172a', padding: '5px 12px', borderRadius: '4px 4px 0 0', color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em' }}>ESTIMATE RANGE</div>
              <div style={{ border: '1px solid #334155', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#1a2744', color: '#94a3b8' }}>
                  <span>Conservative:</span><span>$1,200</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#f59e0b', color: '#0f172a', fontWeight: 900 }}>
                  <span>Most Likely:  ← recommended starting point</span><span>$1,750</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#1a2744', color: '#cbd5e1' }}>
                  <span>Full Scope:</span><span>$2,400</span>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em', marginBottom: '8px' }}>WHAT&apos;S INCLUDED</div>
              {[
                'Service call / diagnostic ($85 – $95)',
                '40-gal gas water heater, AO Smith ($650 – $850)',
                'Expansion tank + shut-off valve ($120 – $175)',
                'Labor: 3–5 hrs @ $90–$110/hr',
              ].map(item => (
                <div key={item} style={{ color: '#94a3b8', padding: '4px 0' }}>• {item}</div>
              ))}
            </div>

            {/* Assumptions */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em', marginBottom: '8px' }}>KEY ASSUMPTIONS</div>
              <div style={{ color: '#fbbf24', marginBottom: '6px', fontSize: '0.83rem' }}>⚠️ This estimate assumes:</div>
              {[
                'Existing gas line and venting are code-compliant',
                'Standard residential install, no structural work',
                'Unit accessible in garage with standard clearance',
              ].map(a => (
                <div key={a} style={{ color: '#94a3b8', padding: '2px 0', paddingLeft: '8px', fontSize: '0.83rem' }}>• {a}</div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', color: '#64748b', fontSize: '0.8rem' }}>
              ⚠️ Starting point only. Verify local material costs and labor rates before quoting.
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '60px' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
          {[
            { icon: '📝', step: '1', title: 'Describe the Job', desc: 'Type what needs to be done, add your city for local rates, and optionally upload a plan sheet. More detail = tighter range.' },
            { icon: '🤖', step: '2', title: 'AI Generates Range', desc: 'GPT-4o analyzes your job and outputs a Conservative / Most Likely / Full Scope range with every assumption spelled out.' },
            { icon: '📄', step: '3', title: 'Use to Quote', desc: 'Start with the Most Likely figure. Review assumptions. Adjust for your job. Download PDF or copy text. Done.' },
          ].map(item => (
            <div key={item.step} className="card" style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#0f172a', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>{item.step}</div>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px', marginTop: '8px' }}>{item.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1.1rem' }}>{item.title}</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLAN UPLOAD FEATURE */}
      <section style={{ background: '#1e293b', padding: '80px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <div className="badge" style={{ marginBottom: '16px' }}>📐 Pro Feature</div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2 }}>Upload Plan Sheets<br/><span style={{ color: '#f59e0b' }}>for Plan-Based Estimates</span></h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>
              Drop a floor plan, drawing, or site photo. GPT-4o Vision reads it automatically — extracts dimensions, room counts, fixture counts, and linear footage.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Auto-extracts dimensions & scope from drawings',
                'Boosts estimate confidence to 🟢 High automatically',
                'Labeled as "Plan-Based Estimate" in output',
                'Works with PNG, JPG plan sheets (PDF coming soon)',
              ].map(f => (
                <li key={f} style={{ display: 'flex', gap: '10px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                  <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#0f172a', border: '2px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📐</div>
            <div style={{ color: '#f59e0b', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>Drop Plan Sheet Here</div>
            <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '20px' }}>PNG, JPG up to 10MB</div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', color: '#64748b', textAlign: 'left' }}>
              🟢 Plan-Based Estimate · High Confidence<br/>
              Extracted: 2,400 sqft · 3 zones · 18 diffusers
            </div>
          </div>
        </div>
      </section>

      {/* TRADES */}
      <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>Works for Every Trade</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '48px', fontSize: '1.05rem' }}>Trade-specific labor rates, materials, and job types — not generic AI guesses.</p>
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
            <div key={t.name} style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#cbd5e1' }}>
              <span>{t.icon}</span>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: '#1e293b', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '48px' }}>Contractors Love It</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card">
                <div style={{ color: '#f59e0b', fontSize: '1.1rem', marginBottom: '14px' }}>★★★★★</div>
                <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '18px', fontStyle: 'italic', fontSize: '0.95rem' }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{t.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{t.trade}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Simple, Transparent Pricing</h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '48px', fontSize: '1.05rem' }}>Less than one estimate worth of margin. Cancel anytime.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
            {/* Basic */}
            <div className="card" style={{ border: '1px solid #334155' }}>
              <div style={{ marginBottom: '8px', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Basic</div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#f1f5f9', marginBottom: '4px' }}>$49<span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>/mo</span></div>
              <div style={{ color: '#64748b', marginBottom: '28px', fontSize: '0.9rem' }}>Cancel anytime</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                {[
                  'Unlimited estimate generations',
                  'Low / Mid / High range output',
                  'Key assumptions on every estimate',
                  'Confidence level indicator',
                  'All trades supported',
                  'Export as text',
                  'Trade-accurate labor + material rates',
                ].map(f => (
                  <li key={f} style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className="btn-secondary" style={{ width: '100%', fontSize: '1rem', padding: '14px' }} onClick={handleGetStarted}>
                Get Started — $49/mo →
              </button>
            </div>

            {/* Pro */}
            <div className="card" style={{ border: '2px solid #f59e0b', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#0f172a', padding: '3px 16px', borderRadius: '100px', fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
              <div style={{ marginBottom: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pro</div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#f1f5f9', marginBottom: '4px' }}>$149<span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>/mo</span></div>
              <div style={{ color: '#64748b', marginBottom: '28px', fontSize: '0.9rem' }}>Cancel anytime</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                {[
                  'Everything in Basic',
                  '📐 Plan sheet upload (PNG, JPG)',
                  'GPT-4o Vision plan analysis',
                  'Auto-extracts dimensions & scope',
                  'Plan-Based Estimate badge',
                  'Export as formatted PDF',
                  'Priority support',
                ].map(f => (
                  <li key={f} style={{ color: '#cbd5e1', fontSize: '0.92rem', display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#f59e0b', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:support@micro-titan.com?subject=AI Estimator Pro — Pro Plan Interest" style={{ display: 'block', textDecoration: 'none' }}>
                <button className="btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '14px' }}>
                  Get Pro — $149/mo →
                </button>
              </a>
              <p style={{ marginTop: '10px', color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>Email us to get set up on Pro</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1e293b', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2 }}>Stop Losing Jobs to Slow Estimates.</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.7 }}>
            Every hour you spend writing estimates by hand is an hour you could be billing. Every flat number you give is a number that could cost you margin. Get a range. Know your assumptions. Win more jobs.
          </p>
          <button className="btn-primary" style={{ fontSize: '1.15rem', padding: '18px 48px' }} onClick={handleGetStarted}>
            ⚡ Generate My First Estimate →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1e293b', padding: '32px 24px', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#f59e0b"/>
              <path d="M16 5L7 11.5V27H13V20H19V27H25V11.5L16 5Z" fill="#0f172a"/>
              <rect x="13" y="13" width="6" height="5" rx="1" fill="#f59e0b"/>
            </svg>
            <span style={{ color: '#64748b' }}>AI Estimator Pro is a <strong style={{ color: '#94a3b8' }}>Micro Titan LLC</strong> platform</span>
          </div>
          <div style={{ color: '#475569' }}>
            <a href="mailto:greg@micro-titan.com" style={{ color: '#64748b', textDecoration: 'none' }}>greg@micro-titan.com</a>
            {' · '}© 2026 Micro Titan LLC
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
