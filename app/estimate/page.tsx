'use client'

import { useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EstimateResult from './EstimateResult'

const TRADES = [
  'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'General Contractor',
  'Painting', 'Carpentry', 'Flooring', 'Landscaping', 'Other'
]

interface LineItem {
  description: string
  lowCost: number
  highCost: number
  category: string
}

interface ChangeFactor {
  condition: string
  delta: string
}

interface EstimateData {
  tradeIcon: string
  tradeType: string
  location: string | null
  jobSummary: string
  confidence: 'low' | 'medium' | 'high'
  confidenceMissing: string[]
  conservative: number
  mostLikely: number
  fullScope: number
  lineItems: LineItem[]
  laborHoursLow: number
  laborHoursHigh: number
  laborRateLow: number
  laborRateHigh: number
  assumptions: string[]
  changeFactors: ChangeFactor[]
  notes: string
  estimateNumber: string
  isPlanBased: boolean
  date: string
  jobDescription: string
}

function EstimatePageInner() {
  useSearchParams() // keep for future use

  const [jobDescription, setJobDescription] = useState('')
  const [tradeType, setTradeType] = useState('Plumbing')
  const [location, setLocation] = useState('')
  const [planFile, setPlanFile] = useState<File | null>(null)
  const [planPreview, setPlanPreview] = useState<string | null>(null)
  const [isPlanMode, setIsPlanMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState<EstimateData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB allowed.')
      return
    }
    setPlanFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setPlanPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPlanPreview(null)
    }
    setIsPlanMode(true)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB.')
      return
    }
    setPlanFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setPlanPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
    setIsPlanMode(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobDescription.trim() && !planFile) {
      setError('Please describe the job or upload a plan sheet.')
      return
    }
    setError('')
    setLoading(true)
    setLoadingMsg(planFile ? 'Analyzing plan sheet with GPT-4o Vision…' : 'Generating Low/Mid/High estimate…')

    try {
      let planImageBase64: string | undefined

      if (planFile && planFile.type.startsWith('image/')) {
        const reader = new FileReader()
        planImageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string
            resolve(result.split(',')[1])
          }
          reader.readAsDataURL(planFile)
        })
      }

      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          tradeType,
          location,
          planImageBase64,
          isPlanUpload: isPlanMode && !!planFile,
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate estimate')
      }

      const data = await res.json()
      setEstimate({
        ...data,
        jobDescription,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  if (estimate) {
    return (
      <EstimateResult
        estimate={estimate}
        onNew={() => setEstimate(null)}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Nav */}
      <nav style={{ maxWidth: '920px', margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="6" fill="#f59e0b"/>
            <path d="M14 5L7 10.5V23H11V17H17V23H21V10.5L14 5Z" fill="#0f172a"/>
            <rect x="12" y="11" width="4" height="4" fill="#f59e0b"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>AI Estimator Pro</span>
        </a>
        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700 }}>
          {isPlanMode ? '📐 PRO — Plan Upload' : '⚡ PRO'}
        </span>
      </nav>

      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>Generate Estimate</h1>
        <p style={{ color: '#94a3b8', marginBottom: '40px' }}>
          Describe the job or upload a plan sheet — get a Low / Mid / High range with assumptions in 30 seconds.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Trade + Location */}
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>Job Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="label">Trade Type</label>
                    <select className="input" value={tradeType} onChange={e => setTradeType(e.target.value)}>
                      {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">City / Region (optional — improves accuracy)</label>
                    <input
                      className="input"
                      placeholder="e.g. Austin TX, Chicago IL, Phoenix AZ"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Plan Sheet Upload — Pro Feature */}
              <div className="card" style={{ border: isPlanMode ? '2px solid #f59e0b' : '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>📐 Plan Sheet Upload</h3>
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>PRO</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '14px' }}>
                  Upload a floor plan, drawing, or photo. GPT-4o Vision will extract dimensions and scope automatically — boosts confidence to High.
                </p>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${isPlanMode ? '#f59e0b' : '#334155'}`,
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    background: isPlanMode ? 'rgba(245,158,11,0.05)' : 'transparent',
                    minHeight: '90px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {planPreview ? (
                    <img src={planPreview} alt="Plan sheet" style={{ maxHeight: '110px', maxWidth: '100%', borderRadius: '6px' }} />
                  ) : planFile ? (
                    <>
                      <span style={{ fontSize: '2rem' }}>📄</span>
                      <p style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>{planFile.name}</p>
                      <p style={{ color: '#64748b', fontSize: '0.75rem' }}>PDF support coming soon — image extracted</p>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '2rem' }}>📐</span>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Drop plan sheet here or click to upload</p>
                      <p style={{ color: '#475569', fontSize: '0.75rem' }}>PNG, JPG up to 10MB · PDF coming soon</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {planFile && (
                  <button
                    type="button"
                    onClick={() => { setPlanFile(null); setPlanPreview(null); setIsPlanMode(false) }}
                    style={{ marginTop: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    × Remove plan
                  </button>
                )}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Job Description */}
              <div className="card" style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>Job Description</h3>
                <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '12px' }}>
                  More detail = tighter range. Include: scope, access, existing conditions, fixtures, square footage.
                </p>
                <textarea
                  className="input"
                  style={{ minHeight: '200px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  placeholder={isPlanMode
                    ? 'Optional: Add any details not visible in the plan (e.g. existing conditions, special requirements, access issues)…'
                    : 'e.g. Replace the water heater in the garage. 40-gallon gas unit, existing gas line and venting in place, needs new expansion tank and code-compliant shut-off valve. House built 2001, Dallas TX…'
                  }
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                />
              </div>

              {/* Confidence Tips */}
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem', marginBottom: '10px' }}>💡 Get a tighter range</div>
                <ul style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '0', listStyle: 'none' }}>
                  {['Include city/state for local labor rates', 'Specify square footage or linear footage', 'Mention existing conditions (age, access)', 'Note fixture counts or unit sizes', 'Upload a plan sheet for max accuracy'].map(tip => (
                    <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '24px' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.95rem' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', fontSize: '1.1rem', padding: '18px' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  {loadingMsg || 'Generating…'}
                </span>
              ) : isPlanMode
                ? '📐 Analyze Plan & Generate Estimate'
                : '⚡ Generate Low / Mid / High Estimate'
              }
            </button>
            <p style={{ textAlign: 'center', marginTop: '12px', color: '#475569', fontSize: '0.82rem' }}>
              Always verify local material costs and labor rates before quoting to a customer.
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 680px) {
          form > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function EstimatePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>}>
      <EstimatePageInner />
    </Suspense>
  )
}
