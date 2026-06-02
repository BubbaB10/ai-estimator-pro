'use client'

import { useState } from 'react'

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
  businessEmail: string
  jobDescription: string
  tradeType: string
  date: string
}

interface Props {
  estimate: EstimateData
  onNew: () => void
}

export default function EstimateResult({ estimate, onNew }: Props) {
  const [downloading, setDownloading] = useState(false)

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      // Dynamic import to keep bundle small
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header background
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageWidth, 45, 'F')

      // Business name
      doc.setTextColor(241, 245, 249)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(estimate.businessName || 'Your Business', 15, 18)

      // Contact info
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      const contactParts = [estimate.businessPhone, estimate.businessEmail].filter(Boolean)
      if (contactParts.length) doc.text(contactParts.join(' · '), 15, 28)

      // Estimate # and date (right side)
      doc.setTextColor(249, 115, 22)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTIMATE', pageWidth - 15, 15, { align: 'right' })
      doc.setTextColor(241, 245, 249)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`#${estimate.estimateNumber}`, pageWidth - 15, 23, { align: 'right' })
      doc.text(estimate.date, pageWidth - 15, 31, { align: 'right' })

      // Trade type badge
      doc.setFillColor(249, 115, 22)
      doc.roundedRect(pageWidth - 58, 35, 43, 8, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(estimate.tradeType.toUpperCase(), pageWidth - 36, 40.5, { align: 'center' })

      // Job description
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('JOB DESCRIPTION', 15, 58)
      doc.setTextColor(51, 65, 85)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(estimate.jobDescription || 'See line items below', pageWidth - 30)
      doc.setTextColor(30, 41, 59)
      // Use a lighter background for description box
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(12, 61, pageWidth - 24, Math.max(12, descLines.length * 5 + 8), 2, 2, 'F')
      doc.setTextColor(30, 41, 59)
      doc.text(descLines, 17, 67)

      const tableStartY = 62 + Math.max(12, descLines.length * 5 + 8) + 8

      // Line items table
      autoTable(doc, {
        startY: tableStartY,
        head: [['Description', 'Category', 'Qty', 'Unit Cost', 'Total']],
        body: estimate.lineItems.map(item => [
          item.description,
          item.category || '',
          item.qty.toString(),
          `$${item.unitCost.toFixed(2)}`,
          `$${item.total.toFixed(2)}`,
        ]),
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [241, 245, 249],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 28, textColor: [100, 116, 139] },
          2: { cellWidth: 16, halign: 'right' },
          3: { cellWidth: 24, halign: 'right' },
          4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 12, right: 12 },
      })

      // Totals
      const finalY = (doc as any).lastAutoTable.finalY + 8
      const totalsX = pageWidth - 75
      const totalsWidth = 63

      doc.setFillColor(241, 245, 249)
      doc.roundedRect(totalsX - 5, finalY - 5, totalsWidth + 5, 42, 2, 2, 'F')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text('Subtotal', totalsX, finalY + 4)
      doc.text(`$${estimate.subtotal.toFixed(2)}`, pageWidth - 12, finalY + 4, { align: 'right' })

      doc.text(`Tax (${estimate.taxRate || 8.25}%)`, totalsX, finalY + 13)
      doc.text(`$${estimate.tax.toFixed(2)}`, pageWidth - 12, finalY + 13, { align: 'right' })

      // Total line
      doc.setFillColor(249, 115, 22)
      doc.rect(totalsX - 5, finalY + 18, totalsWidth + 5, 14, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(255, 255, 255)
      doc.text('TOTAL', totalsX, finalY + 27)
      doc.text(`$${estimate.total.toFixed(2)}`, pageWidth - 12, finalY + 27, { align: 'right' })

      // Notes
      if (estimate.notes) {
        const notesY = finalY + 50
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('NOTES', 15, notesY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(9)
        const noteLines = doc.splitTextToSize(estimate.notes, pageWidth - 30)
        doc.text(noteLines, 15, notesY + 5)
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15
      doc.setFillColor(15, 23, 42)
      doc.rect(0, footerY - 5, pageWidth, 20, 'F')
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Generated by AI Estimator Pro · ai-estimator.vercel.app', pageWidth / 2, footerY + 2, { align: 'center' })

      doc.save(`estimate-${estimate.estimateNumber}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('PDF download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const groupedItems = estimate.lineItems.reduce((acc, item) => {
    const cat = item.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, LineItem[]>)

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <nav style={{ maxWidth: '900px', margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>AI Estimator Pro</span>
        </a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onNew} className="btn-secondary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            + New Estimate
          </button>
          <button onClick={downloadPDF} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} disabled={downloading}>
            {downloading ? 'Creating PDF...' : '⬇ Download PDF'}
          </button>
        </div>
      </nav>

      {/* Estimate document */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Success banner */}
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span>
          <span>Your estimate is ready! Download as PDF or start a new one.</span>
        </div>

        {/* Estimate card */}
        <div className="card" style={{ border: '1px solid #334155' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #334155' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '4px' }}>{estimate.businessName}</h1>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                {[estimate.businessPhone, estimate.businessEmail].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f97316', fontWeight: 800, fontSize: '1.1rem' }}>ESTIMATE</div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>#{estimate.estimateNumber}</div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{estimate.date}</div>
              <div style={{ marginTop: '8px', background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', padding: '3px 10px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>
                {estimate.tradeType}
              </div>
            </div>
          </div>

          {/* Job description */}
          <div style={{ marginBottom: '24px', background: '#0f172a', padding: '12px 16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Description</div>
            <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{estimate.jobDescription || 'See line items below'}</div>
          </div>

          {/* Line items */}
          <div style={{ marginBottom: '24px' }}>
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #1e293b' }}>
                  {category}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600 }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 600, width: '60px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 600, width: '90px' }}>Unit Cost</th>
                      <th style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 600, width: '90px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 4px', color: '#cbd5e1' }}>{item.description}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', color: '#94a3b8' }}>{item.qty}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', color: '#94a3b8' }}>${item.unitCost.toFixed(2)}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                <span>Subtotal</span>
                <span>${estimate.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                <span>Tax ({estimate.taxRate || 8.25}%)</span>
                <span>${estimate.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '8px', marginTop: '8px', fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>
                <span>TOTAL</span>
                <span>${estimate.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {estimate.notes && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{estimate.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'center' }}>
          <button onClick={downloadPDF} className="btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }} disabled={downloading}>
            {downloading ? 'Creating PDF...' : '⬇ Download PDF'}
          </button>
          <button onClick={onNew} className="btn-secondary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
            + Generate Another
          </button>
        </div>
      </div>
    </div>
  )
}
