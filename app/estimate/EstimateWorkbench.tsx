'use client'

import { useState, useCallback } from 'react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface WorkbenchLineItems {
  materials: number
  labor: number
  equipment: number
  permitsAndFees: number
  overhead: number
  profitMargin: number
}

interface Scenario {
  total: number
  description: string
}

interface PhasedScenario {
  phase1: Scenario
  phase2: Scenario
}

interface Scenarios {
  budget: Scenario
  premium: Scenario
  phased: PhasedScenario
}

export interface EstimateData {
  tradeIcon: string
  tradeType: string
  location: string | null
  jobSummary: string
  confidence: 'low' | 'medium' | 'high'
  confidenceMissing: string[]
  conservative: number
  mostLikely: number
  fullScope: number
  lineItems: { description: string; lowCost: number; highCost: number; category: string }[]
  workbenchLineItems: WorkbenchLineItems
  marginPercent: number
  laborHoursLow: number
  laborHoursHigh: number
  laborRateLow: number
  laborRateHigh: number
  assumptions: string[]
  scenarios: Scenarios
  changeFactors: { condition: string; delta: string }[]
  notes: string
  estimateNumber: string
  isPlanBased: boolean
  date: string
  jobDescription: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  updatedEstimate?: boolean
}

interface Props {
  estimate: EstimateData
  onNew: () => void
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─────────────────────────────────────────────
// AssumptionChips
// ─────────────────────────────────────────────

function AssumptionChips({
  assumptions,
  onEdit,
}: {
  assumptions: string[]
  onEdit: (updated: string[]) => void
}) {
  const [editing, setEditing] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')
  const [adding, setAdding] = useState(false)
  const [newVal, setNewVal] = useState('')

  const startEdit = (i: number) => {
    setEditing(i)
    setEditVal(assumptions[i])
  }

  const saveEdit = () => {
    if (editing === null) return
    const updated = [...assumptions]
    updated[editing] = editVal.trim() || updated[editing]
    onEdit(updated)
    setEditing(null)
    setEditVal('')
  }

  const removeChip = (i: number) => {
    onEdit(assumptions.filter((_, idx) => idx !== i))
  }

  const addChip = () => {
    if (newVal.trim()) {
      onEdit([...assumptions, newVal.trim()])
      setNewVal('')
    }
    setAdding(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        {assumptions.map((a, i) =>
          editing === i ? (
            <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null) }}
                style={{ background: '#1e293b', border: '1px solid #f59e0b', color: '#f1f5f9', borderRadius: '6px', padding: '4px 10px', fontSize: '0.82rem', minWidth: '220px' }}
                autoFocus
              />
              <button onClick={saveEdit} style={{ background: '#f59e0b', border: 'none', color: '#0f172a', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '100px', padding: '4px 12px', fontSize: '0.82rem', color: '#fbbf24', cursor: 'pointer' }}>
              <span onClick={() => startEdit(i)} title="Click to edit">{a}</span>
              <span onClick={() => removeChip(i)} style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.7rem', marginLeft: '2px' }} title="Remove">✕</span>
            </div>
          )
        )}
        {adding ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addChip(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="New assumption..."
              style={{ background: '#1e293b', border: '1px solid #f59e0b', color: '#f1f5f9', borderRadius: '6px', padding: '4px 10px', fontSize: '0.82rem', minWidth: '200px' }}
              autoFocus
            />
            <button onClick={addChip} style={{ background: '#f59e0b', border: 'none', color: '#0f172a', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ background: 'none', border: '1px dashed #334155', color: '#64748b', borderRadius: '100px', padding: '4px 12px', fontSize: '0.82rem', cursor: 'pointer' }}>+ Add assumption</button>
        )}
      </div>
      <p style={{ color: '#475569', fontSize: '0.78rem' }}>Click any chip to edit · ✕ to remove · Changing assumptions recalculates via AI</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// MarginSlider
// ─────────────────────────────────────────────

function MarginSlider({ marginPct, wli, onChange }: { marginPct: number; wli: WorkbenchLineItems; onChange: (pct: number) => void }) {
  const base = wli.materials + wli.labor + wli.equipment + wli.permitsAndFees + wli.overhead
  const margin = Math.round(base * (marginPct / 100))
  const total = base + margin

  return (
    <div style={{ marginTop: '16px', padding: '16px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.88rem' }}>Profit Margin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>{marginPct}%</span>
          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>({fmt(margin)})</span>
        </div>
      </div>
      <input type="range" min={5} max={45} step={1} value={marginPct} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.75rem', marginTop: '4px' }}>
        <span>5%</span><span>45%</span>
      </div>
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>Total with margin:</span>
        <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#f59e0b' }}>{fmt(total)}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// ScenarioCard
// ─────────────────────────────────────────────

function ScenarioCard({ icon, label, total, description, color, phased }: {
  icon: string; label: string; total: number; description: string; color: string
  phased?: { phase1: Scenario; phase2: Scenario }
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#1e293b', border: `1px solid ${color}40`, borderRadius: '10px', padding: '20px', flex: '1', minWidth: '180px' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontWeight: 800, color: '#f1f5f9', marginBottom: '4px', fontSize: '1rem' }}>{label}</div>
      {phased ? (
        <>
          <div style={{ fontWeight: 800, color, fontSize: '1.3rem', marginBottom: '2px' }}>{fmt(phased.phase1.total + phased.phase2.total)}</div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '8px' }}>P1: {fmt(phased.phase1.total)} · P2: {fmt(phased.phase2.total)}</div>
        </>
      ) : (
        <div style={{ fontWeight: 800, color, fontSize: '1.3rem', marginBottom: '8px' }}>{fmt(total)}</div>
      )}
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: `1px solid ${color}40`, color: '#94a3b8', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem' }}>
        {open ? 'Hide' : 'Details'}
      </button>
      {open && (
        <div style={{ marginTop: '10px', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6, borderTop: '1px solid #334155', paddingTop: '10px' }}>
          {phased ? (
            <>
              <div style={{ marginBottom: '6px' }}><strong style={{ color: '#cbd5e1' }}>Phase 1:</strong> {phased.phase1.description}</div>
              <div><strong style={{ color: '#cbd5e1' }}>Phase 2:</strong> {phased.phase2.description}</div>
            </>
          ) : description}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// RefinementThread
// ─────────────────────────────────────────────

function RefinementThread({ jobDescription, tradeType, location, currentEstimate, onEstimateUpdate }: {
  jobDescription: string; tradeType: string; location: string | null
  currentEstimate: EstimateData; onEstimateUpdate: (u: Partial<EstimateData>) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendRefinement = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription, tradeType, location,
          currentEstimate: {
            mostLikely: currentEstimate.mostLikely,
            conservative: currentEstimate.conservative,
            fullScope: currentEstimate.fullScope,
            assumptions: currentEstimate.assumptions,
            workbenchLineItems: currentEstimate.workbenchLineItems,
            marginPercent: currentEstimate.marginPercent,
            scenarios: currentEstimate.scenarios,
          },
          refinementRequest: text,
          conversationHistory: history,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed') }
      const data = await res.json()
      onEstimateUpdate({ conservative: data.conservative, mostLikely: data.mostLikely, fullScope: data.fullScope, workbenchLineItems: data.workbenchLineItems, marginPercent: data.marginPercent, assumptions: data.assumptions, scenarios: data.scenarios })
      setMessages(prev => [...prev, { role: 'assistant', content: data.changesSummary, updatedEstimate: true }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, jobDescription, tradeType, location, currentEstimate, onEstimateUpdate])

  return (
    <div>
      {messages.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: msg.role === 'user' ? '#1e40af' : '#1e293b', border: msg.role === 'assistant' ? '1px solid #334155' : 'none', fontSize: '0.88rem', lineHeight: 1.6, color: '#e2e8f0' }}>
                {msg.updatedEstimate && <div style={{ color: '#22c55e', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>✅ Estimate updated</div>}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 2px', background: '#1e293b', border: '1px solid #334155', fontSize: '0.88rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Recalculating…
              </div>
            </div>
          )}
        </div>
      )}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.88rem' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRefinement() } }}
          placeholder="Refine your estimate… e.g. 'Use Trex decking instead of pressure treated' or 'Add a second bathroom' or 'What if I supply the materials myself?'"
          rows={3}
          style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', padding: '12px 14px', fontSize: '0.9rem', lineHeight: 1.5, resize: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={sendRefinement}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? '#1e293b' : '#f59e0b', border: 'none', color: loading || !input.trim() ? '#475569' : '#0f172a', borderRadius: '8px', padding: '12px 20px', fontWeight: 800, fontSize: '0.9rem', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
        >
          {loading ? '…' : '→ Send'}
        </button>
      </div>
      <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: '6px' }}>Press Enter to send · Shift+Enter for new line</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// LockModal
// ─────────────────────────────────────────────

function LockModal({ onClose, onExport }: { onClose: () => void; onExport: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '32px', maxWidth: '420px', width: '100%' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px', color: '#f1f5f9' }}>🔒 Lock &amp; Export PDF Proposal</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.6 }}>This will generate a clean proposal PDF with your company name. The estimate will be locked at current numbers.</p>
        <label style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }}>Your Company Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Smith Plumbing & HVAC"
          style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f1f5f9', borderRadius: '8px', padding: '10px 12px', fontSize: '0.9rem', marginBottom: '20px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onExport(name || '[Your Company Name]')} style={{ flex: 1, background: '#f59e0b', border: 'none', color: '#0f172a', borderRadius: '8px', padding: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
            ⬇ Generate PDF
          </button>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', fontSize: '0.95rem' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Workbench
// ─────────────────────────────────────────────

export default function EstimateWorkbench({ estimate: initialEstimate, onNew }: Props) {
  const [estimate, setEstimate] = useState<EstimateData>(initialEstimate)
  const [marginPct, setMarginPct] = useState(initialEstimate.marginPercent || 10)
  const [assumptions, setAssumptions] = useState<string[]>(initialEstimate.assumptions || [])
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [recalcError, setRecalcError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showLockModal, setShowLockModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const wli = estimate.workbenchLineItems || { materials: 0, labor: 0, equipment: 0, permitsAndFees: 0, overhead: 0, profitMargin: 0 }
  const base = wli.materials + wli.labor + wli.equipment + wli.permitsAndFees + wli.overhead
  const dynamicMargin = Math.round(base * (marginPct / 100))
  const dynamicTotal = base + dynamicMargin

  const updateEstimate = useCallback((partial: Partial<EstimateData>) => {
    setEstimate(prev => ({ ...prev, ...partial }))
    if (partial.marginPercent !== undefined) setMarginPct(partial.marginPercent)
    if (partial.assumptions !== undefined) setAssumptions(partial.assumptions)
  }, [])

  const recalcWithAssumptions = async (newAssumptions: string[]) => {
    setAssumptions(newAssumptions)
    setEstimate(prev => ({ ...prev, assumptions: newAssumptions }))
    setRecalcLoading(true)
    setRecalcError('')
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: estimate.jobDescription,
          tradeType: estimate.tradeType,
          location: estimate.location,
          currentEstimate: { mostLikely: estimate.mostLikely, conservative: estimate.conservative, fullScope: estimate.fullScope, assumptions: newAssumptions, workbenchLineItems: wli, marginPercent: marginPct, scenarios: estimate.scenarios },
          refinementRequest: 'Recalculate based on updated assumptions: ' + newAssumptions.join('; '),
          conversationHistory: [],
        }),
      })
      if (!res.ok) throw new Error('Recalc failed')
      const data = await res.json()
      setEstimate(prev => ({ ...prev, conservative: data.conservative, mostLikely: data.mostLikely, fullScope: data.fullScope, workbenchLineItems: data.workbenchLineItems, marginPercent: data.marginPercent, assumptions: newAssumptions, scenarios: data.scenarios }))
      setMarginPct(data.marginPercent || marginPct)
    } catch {
      setRecalcError('Recalculation failed — assumptions saved, numbers unchanged.')
    } finally {
      setRecalcLoading(false)
    }
  }

  const handleExportPDF = async (companyName: string) => {
    setShowLockModal(false)
    setPdfLoading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      const pw = doc.internal.pageSize.getWidth()
      const m = 12

      // Header
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pw, 52, 'F')
      doc.setFillColor(245, 158, 11)
      doc.roundedRect(m, 8, 18, 18, 3, 3, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.text('AI', 21, 19, { align: 'center' })
      doc.setTextColor(241, 245, 249)
      doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text(companyName, 34, 15)
      doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text('Powered by AI Estimator Pro', 34, 22)
      doc.setTextColor(245, 158, 11); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.text('ESTIMATE PROPOSAL', pw - m, 14, { align: 'right' })
      doc.setTextColor(241, 245, 249); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
      doc.text(`#${estimate.estimateNumber}`, pw - m, 21, { align: 'right' })
      doc.text(estimate.date, pw - m, 27, { align: 'right' })
      doc.setFillColor(245, 158, 11)
      doc.roundedRect(m, 32, 65, 9, 2, 2, 'F')
      doc.setTextColor(15, 23, 42); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text(`${estimate.tradeIcon}  ${estimate.tradeType.toUpperCase()}`, m + 32, 38, { align: 'center' })
      doc.setTextColor(100, 116, 139); doc.setFontSize(7); doc.setFont('helvetica', 'normal')
      doc.text('Valid for 30 days from issue date', pw - m, 38, { align: 'right' })

      // Job summary
      let y = 62
      doc.setFillColor(241, 245, 249)
      const sumLines = doc.splitTextToSize(estimate.jobSummary || estimate.jobDescription, pw - m * 2 - 10)
      doc.roundedRect(m, y - 5, pw - m * 2, sumLines.length * 5 + 12, 2, 2, 'F')
      doc.setTextColor(30, 41, 59); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text(sumLines, m + 5, y + 2)
      y += sumLines.length * 5 + 16

      // Cost breakdown
      doc.setFillColor(15, 23, 42)
      doc.rect(m, y, pw - m * 2, 8, 'F')
      doc.setTextColor(245, 158, 11); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text('COST BREAKDOWN', m + 4, y + 5.5)
      y += 12

      autoTable(doc, {
        startY: y,
        head: [['Category', 'Amount']],
        body: [
          ['Materials', fmt(wli.materials)],
          ['Labor', fmt(wli.labor)],
          ['Equipment', fmt(wli.equipment)],
          ['Permits & Fees', fmt(wli.permitsAndFees)],
          ['Overhead', fmt(wli.overhead)],
          [`Profit Margin (${marginPct}%)`, fmt(dynamicMargin)],
          ['TOTAL', fmt(dynamicTotal)],
        ],
        headStyles: { fillColor: [30, 41, 59] as [number, number, number], textColor: [148, 163, 184] as [number, number, number], fontSize: 8 },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] as [number, number, number] },
        alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
        willDrawCell: (data: unknown) => {
          const d = data as { row: { index: number; section: string }; cell: { styles: Record<string, unknown> } }
          if (d.row.index === 6 && d.row.section === 'body') {
            d.cell.styles.fillColor = [245, 158, 11]
            d.cell.styles.fontStyle = 'bold'
            d.cell.styles.textColor = [15, 23, 42]
          }
        },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 35, halign: 'right' as const } },
        margin: { left: m, right: m },
      })

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

      // Assumptions
      if (assumptions.length > 0) {
        if (y > 220) { doc.addPage(); y = 20 }
        doc.setFillColor(15, 23, 42)
        doc.rect(m, y, pw - m * 2, 8, 'F')
        doc.setTextColor(245, 158, 11); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
        doc.text('KEY ASSUMPTIONS', m + 4, y + 5.5)
        y += 12
        doc.setTextColor(71, 85, 105); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
        assumptions.forEach(a => {
          const lines = doc.splitTextToSize('• ' + a, pw - m * 2 - 10)
          if (y + lines.length * 5 > 270) { doc.addPage(); y = 20 }
          doc.text(lines, m + 4, y)
          y += lines.length * 5 + 3
        })
        y += 4
      }

      // What-If Scenarios
      if (y > 210) { doc.addPage(); y = 20 }
      doc.setFillColor(15, 23, 42)
      doc.rect(m, y, pw - m * 2, 8, 'F')
      doc.setTextColor(245, 158, 11); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text('WHAT-IF SCENARIOS', m + 4, y + 5.5)
      y += 12
      const scenarioRows: [string, string, string][] = [
        ['Budget Option', fmt(estimate.scenarios.budget.total), estimate.scenarios.budget.description],
        ['Premium Option', fmt(estimate.scenarios.premium.total), estimate.scenarios.premium.description],
        ['Phase 1', fmt(estimate.scenarios.phased.phase1.total), estimate.scenarios.phased.phase1.description],
        ['Phase 2', fmt(estimate.scenarios.phased.phase2.total), estimate.scenarios.phased.phase2.description],
      ]
      autoTable(doc, {
        startY: y,
        head: [['Scenario', 'Total', 'Notes']],
        body: scenarioRows,
        headStyles: { fillColor: [30, 41, 59] as [number, number, number], textColor: [148, 163, 184] as [number, number, number], fontSize: 8 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] as [number, number, number] },
        alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
        columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 28, halign: 'right' as const }, 2: { cellWidth: 'auto' } },
        margin: { left: m, right: m },
      })

      // Footer
      const fh = doc.internal.pageSize.getHeight() - 18
      doc.setFillColor(15, 23, 42)
      doc.rect(0, fh - 4, pw, 22, 'F')
      doc.setTextColor(100, 116, 139); doc.setFontSize(7); doc.setFont('helvetica', 'normal')
      doc.text('Micro Titan LLC — AI Estimator Pro', pw / 2, fh + 4, { align: 'center' })
      doc.text('Starting point only. Verify local rates before quoting.', pw / 2, fh + 10, { align: 'center' })

      doc.save(`estimate-${estimate.estimateNumber}-proposal.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('PDF failed. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const copyText = () => {
    const lines: string[] = [
      `${estimate.tradeIcon} ${estimate.jobSummary}`,
      estimate.location ? `Location: ${estimate.location}` : '',
      '',
      `ESTIMATE: ${fmt(dynamicTotal)} (with ${marginPct}% margin)`,
      `Conservative: ${fmt(estimate.conservative)} | Most Likely: ${fmt(estimate.mostLikely)} | Full Scope: ${fmt(estimate.fullScope)}`,
      '',
      'COST BREAKDOWN',
      `Materials: ${fmt(wli.materials)}`,
      `Labor: ${fmt(wli.labor)}`,
      `Equipment: ${fmt(wli.equipment)}`,
      `Permits & Fees: ${fmt(wli.permitsAndFees)}`,
      `Overhead: ${fmt(wli.overhead)}`,
      `Profit Margin (${marginPct}%): ${fmt(dynamicMargin)}`,
      '',
      'ASSUMPTIONS',
      ...assumptions.map(a => `• ${a}`),
      '',
      `Budget Option: ${fmt(estimate.scenarios.budget.total)}`,
      `Premium Option: ${fmt(estimate.scenarios.premium.total)}`,
      `Phased: P1 ${fmt(estimate.scenarios.phased.phase1.total)} + P2 ${fmt(estimate.scenarios.phased.phase2.total)}`,
    ].filter(l => l !== null)
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Nav */}
      <nav style={{ maxWidth: '1000px', margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="6" fill="#f59e0b"/>
            <path d="M14 5L7 10.5V23H11V17H17V23H21V10.5L14 5Z" fill="#0f172a"/>
            <rect x="12" y="11" width="4" height="4" fill="#f59e0b"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>AI Estimator Pro</span>
        </a>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={onNew} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>+ New Estimate</button>
          <button onClick={copyText} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>{copied ? '✅ Copied!' : '📋 Copy'}</button>
          <button onClick={() => setShowLockModal(true)} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }} disabled={pdfLoading}>
            {pdfLoading ? 'Building…' : '🔒 Lock & Export PDF'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── ESTIMATE WORKBENCH HEADER ── */}
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '4px' }}>ESTIMATE WORKBENCH</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>{estimate.tradeIcon}</span>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: '1.15rem', color: '#f1f5f9', lineHeight: 1.2, margin: 0 }}>{estimate.jobSummary}</h2>
                {estimate.location && <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>📍 {estimate.location}</div>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, fontSize: '2rem', color: '#f59e0b', lineHeight: 1 }}>{fmt(dynamicTotal)}</div>
            <div style={{ color: '#64748b', fontSize: '0.82rem' }}>with {marginPct}% margin · #{estimate.estimateNumber}</div>
            {recalcLoading && <div style={{ color: '#f59e0b', fontSize: '0.78rem', marginTop: '4px' }}>⟳ Recalculating…</div>}
            {recalcError && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{recalcError}</div>}
          </div>
        </div>

        {/* ── MAIN GRID: LINE ITEMS + ASSUMPTIONS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

          {/* Left: Line Item Breakdown */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '10px 16px', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f59e0b', letterSpacing: '0.08em' }}>LINE ITEM BREAKDOWN</span>
            </div>
            <div style={{ padding: '16px' }}>
              {[
                { key: 'materials', label: 'Materials', icon: '🪵', val: wli.materials },
                { key: 'labor', label: 'Labor', icon: '👷', val: wli.labor },
                { key: 'equipment', label: 'Equipment', icon: '🔧', val: wli.equipment },
                { key: 'permitsAndFees', label: 'Permits & Fees', icon: '📋', val: wli.permitsAndFees },
                { key: 'overhead', label: 'Overhead', icon: '🏢', val: wli.overhead },
              ].map(({ label, icon, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{icon} {label}</span>
                  <span style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '0.95rem' }}>{fmt(val)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>💰 Profit Margin ({marginPct}%)</span>
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.95rem' }}>{fmt(dynamicMargin)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 4px' }}>
                <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem' }}>Total</span>
                <span style={{ fontWeight: 900, color: '#f59e0b', fontSize: '1.2rem' }}>{fmt(dynamicTotal)}</span>
              </div>
              <MarginSlider marginPct={marginPct} wli={wli} onChange={setMarginPct} />
            </div>
          </div>

          {/* Right: Key Assumptions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0f172a', padding: '10px 16px', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f59e0b', letterSpacing: '0.08em' }}>KEY ASSUMPTIONS</span>
              {recalcLoading && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⟳ Updating…</span>}
            </div>
            <div style={{ padding: '16px' }}>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '12px', lineHeight: 1.5 }}>
                These are the assumptions GPT made. Edit any chip to change an assumption — the estimate will recalculate.
              </p>
              <AssumptionChips assumptions={assumptions} onEdit={recalcWithAssumptions} />
            </div>
          </div>
        </div>

        {/* ── WHAT-IF SCENARIOS ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#0f172a', padding: '10px 16px', borderRadius: '10px 10px 0 0' }}>
            <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f59e0b', letterSpacing: '0.08em' }}>WHAT-IF SCENARIOS</span>
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <ScenarioCard icon="💰" label="Budget Version" total={estimate.scenarios.budget.total} description={estimate.scenarios.budget.description} color="#22c55e" />
            <ScenarioCard icon="⭐" label="Premium Version" total={estimate.scenarios.premium.total} description={estimate.scenarios.premium.description} color="#f59e0b" />
            <ScenarioCard icon="📅" label="Phased Approach" total={0} description="" color="#60a5fa" phased={estimate.scenarios.phased} />
          </div>
        </div>

        {/* ── REFINE YOUR ESTIMATE ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#0f172a', padding: '10px 16px', borderRadius: '10px 10px 0 0' }}>
            <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f59e0b', letterSpacing: '0.08em' }}>REFINE YOUR ESTIMATE</span>
          </div>
          <div style={{ padding: '20px' }}>
            <RefinementThread
              jobDescription={estimate.jobDescription}
              tradeType={estimate.tradeType}
              location={estimate.location}
              currentEstimate={estimate}
              onEstimateUpdate={updateEstimate}
            />
          </div>
        </div>

        {/* ── ORIGINAL RANGE (collapsed reference) ── */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '10px' }}>ORIGINAL ESTIMATE RANGE (for reference)</div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#475569', fontSize: '0.75rem' }}>Conservative</div>
              <div style={{ fontWeight: 700, color: '#64748b', fontSize: '1rem' }}>{fmt(estimate.conservative)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Most Likely</div>
              <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '1rem' }}>{fmt(estimate.mostLikely)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#475569', fontSize: '0.75rem' }}>Full Scope</div>
              <div style={{ fontWeight: 700, color: '#64748b', fontSize: '1rem' }}>{fmt(estimate.fullScope)}</div>
            </div>
          </div>
        </div>

      </div>

      {showLockModal && (
        <LockModal
          onClose={() => setShowLockModal(false)}
          onExport={handleExportPDF}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 720px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
