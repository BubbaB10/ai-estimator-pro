'use client'

import { useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EstimateWorkbench, { EstimateData } from './EstimateWorkbench'

const TRADES = [
  'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'General Contractor',
  'Painting', 'Carpentry', 'Flooring', 'Landscaping', 'Other'
]

// ─── Multi-scope types ────────────────────────────────────────────────────────

interface ScopeField { key: string; value: string }

interface Scope {
  id: string
  name: string
  tradeType: string
  sqft: string
  fields: ScopeField[]
}

function newScope(): Scope {
  return { id: crypto.randomUUID(), name: '', tradeType: 'General Contractor', sqft: '', fields: [] }
}

function serializeScopes(scopes: Scope[]): string {
  const parts = scopes.map((s, i) => {
    const lines: string[] = []
    lines.push(`Scope ${i + 1}: ${s.name || '(unnamed)'} (${s.tradeType})`)
    if (s.sqft) lines.push(`Square footage: ${s.sqft} sq ft`)
    const details = s.fields.filter(f => f.key.trim()).map(f => `${f.key}: ${f.value}`).join(', ')
    if (details) lines.push(`Details: ${details}`)
    return lines.join('\n')
  })
  return `MULTI-SCOPE ESTIMATE:\n\n${parts.join('\n\n')}`
}

// ─── Mode Toggle ──────────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: 'quick' | 'multi'; onChange: (m: 'quick' | 'multi') => void }) {
  return (
    <div style={{ display: 'inline-flex', background: '#1e293b', border: '1px solid #334155', borderRadius: '100px', padding: '3px', gap: '2px', marginBottom: '28px' }}>
      {(['quick', 'multi'] as const).map(m => (
        <button key={m} type="button" onClick={() => onChange(m)} style={{
          background: mode === m ? '#f59e0b' : 'transparent',
          color: mode === m ? '#0f172a' : '#94a3b8',
          border: 'none', borderRadius: '100px', padding: '7px 20px',
          fontWeight: mode === m ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer',
          transition: 'background 0.18s, color 0.18s',
        }}>
          {m === 'quick' ? '⚡ Quick' : '🏗️ Multi-Scope'}
        </button>
      ))}
    </div>
  )
}

// ─── Scope Card ───────────────────────────────────────────────────────────────

function ScopeCard({ scope, index, onChange, onRemove, canRemove }: {
  scope: Scope; index: number
  onChange: (u: Scope) => void; onRemove: () => void; canRemove: boolean
}) {
  const up = (patch: Partial<Scope>) => onChange({ ...scope, ...patch })
  const addField = () => up({ fields: [...scope.fields, { key: '', value: '' }] })
  const removeField = (fi: number) => up({ fields: scope.fields.filter((_, idx) => idx !== fi) })
  const updateField = (fi: number, patch: Partial<ScopeField>) =>
    up({ fields: scope.fields.map((f, idx) => idx === fi ? { ...f, ...patch } : f) })

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '18px', position: 'relative' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '100px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
          Scope {index + 1}
        </span>
        <input className="input" style={{ flex: 1, marginBottom: 0 }}
          placeholder="Scope name (e.g. Foundation slab, HVAC system)"
          value={scope.name} onChange={e => up({ name: e.target.value })} />
        {canRemove && (
          <button type="button" onClick={onRemove} title="Remove scope"
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            ×
          </button>
        )}
      </div>

      {/* Trade + Sq Ft */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label className="label">Trade Type</label>
          <select className="input" value={scope.tradeType} onChange={e => up({ tradeType: e.target.value })}>
            {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Sq Ft (optional)</label>
          <input className="input" type="number" min="0" placeholder="e.g. 800"
            value={scope.sqft} onChange={e => up({ sqft: e.target.value })} />
        </div>
      </div>

      {/* Custom fields */}
      {scope.fields.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          {scope.fields.map((field, fi) => (
            <div key={fi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="input" style={{ flex: '0 0 38%' }} placeholder="Field name (e.g. Panel size)"
                value={field.key} onChange={e => updateField(fi, { key: e.target.value })} />
              <input className="input" style={{ flex: 1 }} placeholder="Value (e.g. 200A)"
                value={field.value} onChange={e => updateField(fi, { value: e.target.value })} />
              <button type="button" onClick={() => removeField(fi)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>×</button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={addField}
        style={{ background: 'none', border: '1px dashed #334155', color: '#64748b', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b' }}>
        + Add field
      </button>
    </div>
  )
}

// ─── Plan Upload Section (shared between modes) ───────────────────────────────

function PlanUploadSection({ isPlanMode, planPreview, planFile, onDrop, onFileChange, onRemove, fileRef }: {
  isPlanMode: boolean; planPreview: string | null; planFile: File | null
  onDrop: (e: React.DragEvent) => void; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void; fileRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div className="card" style={{ border: isPlanMode ? '2px solid #f59e0b' : '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>📐 Plan Sheet Upload</h3>
        <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>PRO</span>
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '14px' }}>
        Upload a floor plan, drawing, or photo. GPT-4o Vision will extract dimensions and scope automatically.
      </p>
      <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${isPlanMode ? '#f59e0b' : '#334155'}`, borderRadius: '8px', padding: '20px',
          textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
          background: isPlanMode ? 'rgba(245,158,11,0.05)' : 'transparent',
          minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px',
        }}>
        {planPreview ? (
          <img src={planPreview} alt="Plan sheet" style={{ maxHeight: '110px', maxWidth: '100%', borderRadius: '6px' }} />
        ) : planFile ? (
          <><span style={{ fontSize: '2rem' }}>📄</span><p style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>{planFile.name}</p></>
        ) : (
          <><span style={{ fontSize: '2rem' }}>📐</span>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Drop plan sheet here or click to upload</p>
            <p style={{ color: '#475569', fontSize: '0.75rem' }}>PNG, JPG up to 10MB</p></>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: 'none' }} onChange={onFileChange} />
      {planFile && (
        <button type="button" onClick={onRemove}
          style={{ marginTop: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>
          × Remove plan
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function EstimatePageInner() {
  useSearchParams()

  const [mode, setMode] = useState<'quick' | 'multi'>('quick')

  // quick mode
  const [jobDescription, setJobDescription] = useState('')
  const [tradeType, setTradeType] = useState('Plumbing')

  // multi-scope mode
  const [scopes, setScopes] = useState<Scope[]>([newScope()])

  // shared
  const [location, setLocation] = useState('')
  const [planFile, setPlanFile] = useState<File | null>(null)
  const [planPreview, setPlanPreview] = useState<string | null>(null)
  const [isPlanMode, setIsPlanMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState<EstimateData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null!)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum 10MB allowed.'); return }
    setPlanFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setPlanPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else { setPlanPreview(null) }
    setIsPlanMode(true)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum 10MB.'); return }
    setPlanFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setPlanPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
    setIsPlanMode(true)
  }, [])

  const updateScope = (id: string, updated: Scope) => setScopes(prev => prev.map(s => s.id === id ? updated : s))
  const removeScope = (id: string) => setScopes(prev => prev.filter(s => s.id !== id))
  const addScope = () => setScopes(prev => [...prev, newScope()])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isMultiScope = mode === 'multi'

    if (isMultiScope) {
      if (scopes.length === 0) { setError('Please add at least one scope.'); return }
      if (scopes.some(s => !s.name.trim())) { setError('Please give each scope a name.'); return }
    } else {
      if (!jobDescription.trim() && !planFile) { setError('Please describe the job or upload a plan sheet.'); return }
    }

    setError('')
    setLoading(true)
    setLoadingMsg(planFile ? 'Analyzing plan sheet with GPT-4o Vision…' : isMultiScope ? 'Building multi-scope estimate…' : 'Generating Low/Mid/High estimate…')

    try {
      let planImageBase64: string | undefined
      if (planFile && planFile.type.startsWith('image/')) {
        const reader = new FileReader()
        planImageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => { const r = reader.result as string; resolve(r.split(',')[1]) }
          reader.readAsDataURL(planFile)
        })
      }

      const effectiveJobDescription = isMultiScope ? serializeScopes(scopes) : jobDescription
      const effectiveTradeType = isMultiScope ? (scopes[0]?.tradeType || 'General Contractor') : tradeType

      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: effectiveJobDescription, tradeType: effectiveTradeType, location, planImageBase64, isPlanUpload: isPlanMode && !!planFile, isMultiScope }),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to generate estimate') }
      const data = await res.json()
      setEstimate({ ...data, jobDescription: effectiveJobDescription, date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  if (estimate) {
    return <EstimateWorkbench estimate={estimate} onNew={() => setEstimate(null)} />
  }

  const whatYouGet = [
    'Line item breakdown (Materials, Labor, Equipment…)',
    'Editable assumptions that recalculate via AI',
    'Margin slider — adjust from 5% to 45%',
    '3 what-if scenarios (Budget, Premium, Phased)',
    'Refinement chat — iterate on the estimate',
    'Lock & export as PDF proposal',
  ]

  const planUploadProps = {
    isPlanMode, planPreview, planFile,
    onDrop: handleDrop, onFileChange: handleFileChange,
    onRemove: () => { setPlanFile(null); setPlanPreview(null); setIsPlanMode(false) },
    fileRef,
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
          {isPlanMode ? '📐 PRO — Plan Upload' : mode === 'multi' ? '🏗️ PRO — Multi-Scope' : '⚡ PRO'}
        </span>
      </nav>

      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>Generate Estimate</h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          Describe the job or upload a plan sheet — get a full workbench with line items, assumptions, and what-if scenarios.
        </p>

        <ModeToggle mode={mode} onChange={m => { setMode(m); setError('') }} />

        <form onSubmit={handleSubmit}>

          {/* ── QUICK MODE ──────────────────────────────────────────────────── */}
          {mode === 'quick' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                      <input className="input" placeholder="e.g. Austin TX, Chicago IL, Phoenix AZ" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                  </div>
                </div>
                <PlanUploadSection {...planUploadProps} />
              </div>

              {/* Right */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card" style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>Job Description</h3>
                  <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '12px' }}>
                    More detail = tighter range. Include: scope, access, existing conditions, fixtures, square footage.
                  </p>
                  <textarea className="input"
                    style={{ minHeight: '200px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                    placeholder={isPlanMode ? 'Optional: Add any details not visible in the plan…' : 'e.g. Replace the water heater in the garage. 40-gallon gas unit, existing gas line and venting in place, needs new expansion tank and code-compliant shut-off valve. House built 2001, Dallas TX…'}
                    value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
                </div>
                <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem', marginBottom: '10px' }}>💡 What you get</div>
                  <ul style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '0', listStyle: 'none' }}>
                    {whatYouGet.map(tip => (
                      <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── MULTI-SCOPE MODE ─────────────────────────────────────────────── */}
          {mode === 'multi' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left — scope builder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card">
                  <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1rem' }}>Project Scopes</h3>
                  <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '16px' }}>
                    Add one scope per trade or work type. Each gets its own line items in the estimate.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {scopes.map((scope, i) => (
                      <ScopeCard key={scope.id} scope={scope} index={i}
                        onChange={updated => updateScope(scope.id, updated)}
                        onRemove={() => removeScope(scope.id)}
                        canRemove={scopes.length > 1} />
                    ))}
                  </div>
                  <button type="button" onClick={addScope}
                    style={{ marginTop: '16px', width: '100%', background: 'rgba(245,158,11,0.08)', border: '1px dashed rgba(245,158,11,0.4)', color: '#f59e0b', borderRadius: '8px', padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}>
                    + Add another scope
                  </button>
                </div>
                <div className="card">
                  <label className="label">City / Region (optional — improves accuracy)</label>
                  <input className="input" placeholder="e.g. Austin TX, Chicago IL, Phoenix AZ" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              {/* Right — plan upload + info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <PlanUploadSection {...planUploadProps} />
                <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem', marginBottom: '10px' }}>🏗️ Multi-Scope estimate</div>
                  <ul style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '0', listStyle: 'none' }}>
                    {[
                      'GPT breaks out line items per scope section',
                      'Each scope labeled clearly in the workbench',
                      'Combined Low/Mid/High across all scopes',
                      'Great for new builds, remodels, multi-trade jobs',
                      'Mix trades: GC + Electrical + Plumbing + HVAC',
                    ].map(tip => (
                      <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: '24px' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.95rem' }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '18px' }} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  {loadingMsg || 'Generating…'}
                </span>
              ) : isPlanMode
                ? '📐 Analyze Plan & Build Estimate Workbench'
                : mode === 'multi'
                ? '🏗️ Build Multi-Scope Estimate Workbench'
                : '⚡ Generate Estimate Workbench'
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
