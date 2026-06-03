'use client'

import { useState } from 'react'

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

interface Props {
  estimate: EstimateData
  onNew: () => void
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function ConfidenceBadge({ level, missing }: { level: 'low' | 'medium' | 'high'; missing: string[] }) {
  const config = {
    low: { emoji: '🔴', label: 'Low Confidence', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
    medium: { emoji: '🟡', label: 'Medium Confidence', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    high: { emoji: '🟢', label: 'High Confidence', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
  }[level]

  return (
    <div style={{ background: config.bg, border: `1px solid ${config.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1rem' }}>{config.emoji}</span>
        <div>
          <span style={{ fontWeight: 700, color: config.color, fontSize: '0.9rem' }}>
            Confidence: {config.label}
          </span>
          {missing.length > 0 && (
            <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              {' '}— consider adding: <em>{missing.join(', ')}</em>
            </span>
          )}
          {level === 'low' && (
            <div style={{ color: '#fca5a5', fontSize: '0.82rem', marginTop: '4px' }}>
              ⚠️ Very limited detail provided. Range is intentionally wide. Add more information for a tighter estimate.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EstimateResult({ estimate, onNew }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const text = buildTextOutput(estimate)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageWidth, 48, 'F')

      // Logo area
      doc.setFillColor(245, 158, 11)
      doc.roundedRect(14, 8, 18, 18, 3, 3, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('A', 23, 20, { align: 'center' })

      // Title
      doc.setTextColor(241, 245, 249)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('AI Estimator Pro', 36, 16)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text('ai-estimator-pro.vercel.app', 36, 23)

      // Estimate details right side
      doc.setTextColor(245, 158, 11)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(estimate.isPlanBased ? 'PLAN-BASED ESTIMATE' : 'ESTIMATE', pageWidth - 14, 14, { align: 'right' })
      doc.setTextColor(241, 245, 249)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`#${estimate.estimateNumber}`, pageWidth - 14, 21, { align: 'right' })
      doc.text(estimate.date, pageWidth - 14, 28, { align: 'right' })

      // Trade badge
      doc.setFillColor(245, 158, 11)
      doc.roundedRect(14, 30, 60, 9, 2, 2, 'F')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(`${estimate.tradeIcon}  ${estimate.tradeType.toUpperCase()}`, 44, 36, { align: 'center' })

      // Confidence badge
      const confColors: Record<string, [number, number, number]> = {
        low: [239, 68, 68],
        medium: [245, 158, 11],
        high: [34, 197, 94],
      }
      const confColor = confColors[estimate.confidence]
      doc.setFillColor(...confColor)
      doc.roundedRect(78, 30, 50, 9, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      const confLabel = { low: 'LOW CONFIDENCE', medium: 'MED CONFIDENCE', high: 'HIGH CONFIDENCE' }[estimate.confidence]
      doc.text(confLabel, 103, 36, { align: 'center' })

      // Job summary
      let y = 58
      doc.setFillColor(241, 245, 249)
      const summaryLines = doc.splitTextToSize(estimate.jobSummary || estimate.jobDescription, pageWidth - 30)
      doc.roundedRect(12, y - 5, pageWidth - 24, summaryLines.length * 5 + 10, 2, 2, 'F')
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(summaryLines, 17, y + 1)
      y += summaryLines.length * 5 + 14

      // ESTIMATE RANGE
      doc.setTextColor(15, 23, 42)
      doc.setFillColor(15, 23, 42)
      doc.rect(12, y, pageWidth - 24, 8, 'F')
      doc.setTextColor(245, 158, 11)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTIMATE RANGE', 17, y + 5.5)
      y += 12

      const rangeRows = [
        ['Conservative', fmt(estimate.conservative), false],
        ['Most Likely  ← recommended starting point', fmt(estimate.mostLikely), true],
        ['Full Scope', fmt(estimate.fullScope), false],
      ]

      rangeRows.forEach(([label, value, highlight]) => {
        if (highlight) {
          doc.setFillColor(245, 158, 11)
          doc.rect(12, y - 2, pageWidth - 24, 11, 'F')
          doc.setTextColor(15, 23, 42)
          doc.setFont('helvetica', 'bold')
        } else {
          doc.setFillColor(241, 245, 249)
          doc.rect(12, y - 2, pageWidth - 24, 10, 'F')
          doc.setTextColor(51, 65, 85)
          doc.setFont('helvetica', 'normal')
        }
        doc.setFontSize(10)
        doc.text(String(label), 17, y + 5)
        doc.text(String(value), pageWidth - 14, y + 5, { align: 'right' })
        y += 12
      })
      y += 6

      // What's Included
      if (estimate.lineItems.length > 0) {
        doc.setFillColor(15, 23, 42)
        doc.rect(12, y, pageWidth - 24, 8, 'F')
        doc.setTextColor(245, 158, 11)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text("WHAT'S INCLUDED", 17, y + 5.5)
        y += 12

        autoTable(doc, {
          startY: y,
          head: [['Description', 'Category', 'Low', 'High']],
          body: estimate.lineItems.map(item => [
            item.description,
            item.category,
            fmt(item.lowCost),
            fmt(item.highCost),
          ]),
          headStyles: { fillColor: [30, 41, 59], textColor: [148, 163, 184], fontSize: 8 },
          bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 28, textColor: [100, 116, 139] },
            2: { cellWidth: 24, halign: 'right' },
            3: { cellWidth: 24, halign: 'right' },
          },
          margin: { left: 12, right: 12 },
        })

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      }

      // Assumptions
      if (estimate.assumptions.length > 0) {
        if (y > 220) { doc.addPage(); y = 20 }
        doc.setFillColor(15, 23, 42)
        doc.rect(12, y, pageWidth - 24, 8, 'F')
        doc.setTextColor(245, 158, 11)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('KEY ASSUMPTIONS', 17, y + 5.5)
        y += 12

        doc.setTextColor(71, 85, 105)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('⚠️ This estimate assumes:', 17, y)
        y += 6
        estimate.assumptions.forEach(a => {
          const lines = doc.splitTextToSize('• ' + a, pageWidth - 34)
          doc.text(lines, 20, y)
          y += lines.length * 5 + 2
        })
        y += 4
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 18
      doc.setFillColor(15, 23, 42)
      doc.rect(0, footerY - 4, pageWidth, 22, 'F')
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.text('⚠️ Starting point only. Verify local material costs and labor rates before quoting to a customer.', pageWidth / 2, footerY + 4, { align: 'center' })
      doc.text('Generated by AI Estimator Pro · A Micro Titan LLC platform · greg@micro-titan.com', pageWidth / 2, footerY + 10, { align: 'center' })

      doc.save(`estimate-${estimate.estimateNumber}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('PDF download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Nav */}
      <nav style={{ maxWidth: '860px', margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="6" fill="#f59e0b"/>
            <path d="M14 5L7 10.5V23H11V17H17V23H21V10.5L14 5Z" fill="#0f172a"/>
            <rect x="12" y="11" width="4" height="4" fill="#f59e0b"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>AI Estimator Pro</span>
        </a>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onNew} className="btn-secondary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            + New Estimate
          </button>
          <button onClick={copyToClipboard} className="btn-secondary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            {copied ? '✅ Copied!' : '📋 Copy Text'}
          </button>
          <button onClick={downloadPDF} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} disabled={downloading}>
            {downloading ? 'Building PDF…' : '⬇ Download PDF'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Success */}
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#86efac', padding: '10px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          ✅ Estimate ready — review all assumptions before quoting this to a customer.
        </div>

        <div className="card" style={{ border: '1px solid #334155', padding: '28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.8rem' }}>{estimate.tradeIcon}</span>
                <div>
                  <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#f1f5f9', lineHeight: 1.2 }}>{estimate.jobSummary}</h2>
                  {estimate.location && (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>📍 {estimate.location}</div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '3px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {estimate.tradeType}
                </span>
                {estimate.isPlanBased && (
                  <span style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', padding: '3px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700 }}>
                    📐 Plan-Based Estimate
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.95rem' }}>ESTIMATE #{estimate.estimateNumber}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{estimate.date}</div>
            </div>
          </div>

          {/* Confidence Banner */}
          <ConfidenceBadge level={estimate.confidence} missing={estimate.confidenceMissing} />

          {/* ESTIMATE RANGE */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ background: '#0f172a', padding: '6px 14px', borderRadius: '6px 6px 0 0', marginBottom: '0' }}>
              <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#f59e0b', letterSpacing: '0.08em' }}>ESTIMATE RANGE</span>
            </div>
            <div style={{ border: '1px solid #334155', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
              {/* Divider line */}
              <div style={{ padding: '0 14px', background: '#1e293b' }}>
                <div style={{ borderTop: '1px solid #334155', margin: '0' }} />
              </div>
              {/* Conservative */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#1a2744' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.92rem' }}>Conservative</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Minimum realistic scope</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.35rem', color: '#94a3b8' }}>{fmt(estimate.conservative)}</div>
              </div>
              {/* Most Likely — highlighted */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: '#f59e0b' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>Most Likely</div>
                  <div style={{ color: '#78350f', fontSize: '0.78rem' }}>← Recommended starting point</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.6rem', color: '#0f172a' }}>{fmt(estimate.mostLikely)}</div>
              </div>
              {/* Full Scope */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#1a2744' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.92rem' }}>Full Scope</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>All complications included</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.35rem', color: '#cbd5e1' }}>{fmt(estimate.fullScope)}</div>
              </div>
            </div>
          </div>

          {/* WHAT'S INCLUDED */}
          {estimate.lineItems.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ background: '#0f172a', padding: '6px 14px', borderRadius: '6px 6px 0 0' }}>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#f59e0b', letterSpacing: '0.08em' }}>WHAT&apos;S INCLUDED</span>
              </div>
              <div style={{ border: '1px solid #334155', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                {estimate.lineItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 18px', borderBottom: i < estimate.lineItems.length - 1 ? '1px solid #1e293b' : 'none', background: i % 2 === 0 ? '#1e293b' : '#192236' }}>
                    <div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>• {item.description}</div>
                      <div style={{ color: '#475569', fontSize: '0.75rem' }}>{item.category}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                        {fmt(item.lowCost)} – {fmt(item.highCost)}
                      </div>
                    </div>
                  </div>
                ))}
                {estimate.laborHoursLow > 0 && (
                  <div style={{ padding: '11px 18px', background: '#192236', borderTop: '1px solid #1e293b' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                      • Labor: {estimate.laborHoursLow}–{estimate.laborHoursHigh} hrs @ ${estimate.laborRateLow}–${estimate.laborRateHigh}/hr
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.75rem' }}>Labor</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KEY ASSUMPTIONS */}
          {estimate.assumptions.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ background: '#0f172a', padding: '6px 14px', borderRadius: '6px 6px 0 0' }}>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#f59e0b', letterSpacing: '0.08em' }}>KEY ASSUMPTIONS</span>
              </div>
              <div style={{ border: '1px solid #334155', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '16px 18px', background: '#1e293b' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.88rem', marginBottom: '10px' }}>⚠️ This estimate assumes:</div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {estimate.assumptions.map((a, i) => (
                    <li key={i} style={{ color: '#cbd5e1', fontSize: '0.88rem', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#64748b', flexShrink: 0 }}>•</span> {a}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: '14px', color: '#64748b', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  If any of these don&apos;t apply to your job, adjust accordingly.
                </div>
              </div>
            </div>
          )}

          {/* WHAT WOULD CHANGE THIS NUMBER */}
          {estimate.changeFactors.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ background: '#0f172a', padding: '6px 14px', borderRadius: '6px 6px 0 0' }}>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#f59e0b', letterSpacing: '0.08em' }}>WHAT WOULD CHANGE THIS NUMBER</span>
              </div>
              <div style={{ border: '1px solid #334155', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '14px 18px', background: '#1e293b' }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {estimate.changeFactors.map((f, i) => (
                    <li key={i} style={{ color: '#cbd5e1', fontSize: '0.88rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#f59e0b', flexShrink: 0 }}>•</span>
                      <span>If <strong style={{ color: '#f1f5f9' }}>{f.condition}</strong>: add <strong style={{ color: '#f59e0b' }}>{f.delta}</strong></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Notes */}
          {estimate.notes && (
            <div style={{ marginBottom: '24px', background: '#0f172a', padding: '14px 18px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.88rem', whiteSpace: 'pre-line' }}>{estimate.notes}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#f59e0b' }}>Starting point only.</strong> This is a starting point for your quote, not a final number. Always verify local material costs and labor rates before submitting to a customer.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={downloadPDF} className="btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }} disabled={downloading}>
            {downloading ? 'Building PDF…' : '⬇ Download PDF'}
          </button>
          <button onClick={copyToClipboard} className="btn-secondary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
            {copied ? '✅ Copied!' : '📋 Copy as Text'}
          </button>
          <button onClick={onNew} className="btn-secondary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
            + New Estimate
          </button>
        </div>
      </div>
    </div>
  )
}

function buildTextOutput(e: EstimateData): string {
  const lines: string[] = []
  lines.push(`${e.tradeIcon} ${e.jobSummary}`)
  if (e.location) lines.push(e.location)
  lines.push('')
  const confLabel = { low: '🔴 Low', medium: '🟡 Medium', high: '🟢 High' }[e.confidence]
  const missing = e.confidenceMissing.length ? ` — consider adding: ${e.confidenceMissing.join(', ')}` : ''
  lines.push(`Confidence: ${confLabel}${missing}`)
  lines.push('')
  lines.push('ESTIMATE RANGE')
  lines.push('──────────────────────────────')
  lines.push(`Conservative:    ${fmt(e.conservative)}`)
  lines.push(`Most Likely:     ${fmt(e.mostLikely)}  ← recommended starting point`)
  lines.push(`Full Scope:      ${fmt(e.fullScope)}`)
  lines.push('──────────────────────────────')
  lines.push('')

  if (e.lineItems.length > 0) {
    lines.push("WHAT'S INCLUDED")
    e.lineItems.forEach((item) => {
      lines.push(`• ${item.description} (${fmt(item.lowCost)} – ${fmt(item.highCost)})`)
    })
    if (e.laborHoursLow > 0) {
      lines.push(`• Labor: ${e.laborHoursLow}–${e.laborHoursHigh} hrs @ $${e.laborRateLow}–$${e.laborRateHigh}/hr`)
    }
    lines.push('')
  }

  if (e.assumptions.length > 0) {
    lines.push('KEY ASSUMPTIONS')
    lines.push('⚠️ This estimate assumes:')
    e.assumptions.forEach((a) => lines.push(`• ${a}`))
    lines.push('')
    lines.push('If any of these don\'t apply to your job, adjust accordingly.')
    lines.push('')
  }

  if (e.changeFactors.length > 0) {
    lines.push('WHAT WOULD CHANGE THIS NUMBER')
    e.changeFactors.forEach((f) => lines.push(`• If ${f.condition}: add ${f.delta}`))
    lines.push('')
  }

  lines.push('─────────────────────────────────────────────')
  lines.push('⚠️ Starting point only. Verify local material costs and labor rates before quoting.')

  return lines.join('\n')
}