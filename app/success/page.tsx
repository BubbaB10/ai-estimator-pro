'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SuccessInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }
    // Redirect to estimate page with session
    router.push(`/estimate?session_id=${sessionId}`)
  }, [sessionId, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '12px' }}>You're all set!</h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Redirecting you to the estimate generator...</p>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(249,115,22,0.3)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>}>
      <SuccessInner />
    </Suspense>
  )
}
