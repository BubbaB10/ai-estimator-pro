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
  qty: number
  unitCost: number
  total: number
  category: string
}

interface EstimateData {
  lineItems: LineItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  notes: string
  estimateNumber: string
  businessName: string
  businessPhone: string
  businessEmail?: string
  jobDescription: string
  tradeType: string
  date: string
}

function EstimatePageInner() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [jobDescription, setJobDescription] = useState('')
  const [tradeType, setTradeType] = useState('Plumbing')
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [taxRate, setTaxRate] = useState('8.25')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState<EstimateData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobDescription.trim() && !imageFile) {
      setError('Please describe the job or upload a photo.')
      return
    }
    setError('')
    setLoading(true)

    try {
      let imageBase64: string | undefined
      if (imageFile) {
        const reader = new FileReader()
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string
            resolve(result.split(',')[1])
          }
          reader.readAsDataURL(imageFile)
        })
      }

      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          tradeType,
          businessName,
          businessPhone,
          businessEmail,
          taxRate: parseFloat(taxRate) || 8.25,
          imageBase64,
          sessionId,
        })
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status === 402) {
          window.location.href = '/'
          return
        }
        throw new Error(err.error || 'Failed to generate estimate')
      }

      const data = await res.json()
      setEstimate({
        ...data,
        businessName: businessName || 'Your Business',
        businessPhone: businessPhone || '',
        businessEmail: businessEmail || '',
        jobDescription,
        tradeType,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
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
      {/* Header */}
      <nav style={{ maxWidth: '900px', margin: '0 auto 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>AI Estimator Pro</span>
        </a>
        <span style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>PRO</span>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>Generate Estimate</h1>
        <p style={{ color: '#94a3b8', marginBottom: '40px' }}>Describe the job or upload a photo. We'll handle the rest.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Business Info */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>Your Business</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="label">Business Name</label>
                  <input
                    className="input"
                    placeholder="Smith Plumbing Co."
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    placeholder="555-123-4567"
                    value={businessPhone}
                    onChange={e => setBusinessPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Email (optional)</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={businessEmail}
                    onChange={e => setBusinessEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Tax Rate (%)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="30"
                    placeholder="8.25"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Trade Type */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>Trade Type</h3>
              <select
                className="input"
                value={tradeType}
                onChange={e => setTradeType(e.target.value)}
              >
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Job Description */}
            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>Job Description</h3>
              <textarea
                className="input"
                style={{ minHeight: '160px', resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="e.g. Replace the water heater in the garage. 40 gallon gas unit, existing gas line, needs new expansion tank and updated shut-off valve..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
              />
            </div>

            {/* Image Upload */}
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1rem' }}>Photo (optional)</h3>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed #334155',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  minHeight: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Job site" style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '6px' }} />
                ) : (
                  <>
                    <span style={{ fontSize: '2rem' }}>📸</span>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Drop photo here or click to upload</p>
                    <p style={{ color: '#475569', fontSize: '0.8rem' }}>JPG, PNG, WEBP</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              {imageFile && (
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
                  × Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Submit — full width */}
          <div style={{ gridColumn: '1 / -1' }}>
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
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Generating Estimate...
                </span>
              ) : '⚡ Generate Professional Estimate'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          form { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function EstimatePage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>}>
      <EstimatePageInner />
    </Suspense>
  )
}
