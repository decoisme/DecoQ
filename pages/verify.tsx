import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const QRScanner = dynamic(() => import('../components/QRScanner'), { ssr: false })

type Result = {
  verified: boolean
  hash: string
  merchant?: { name: string; id: string; category: string; registeredAt: string }
  message?: string
} | null

export default function Verify() {
  const [result, setResult] = useState<Result>(null)
  const [loading, setLoading] = useState(false)
  const [rawData, setRawData] = useState('')
  const [scanError, setScanError] = useState('')

  const handleScan = async (data: string) => {
    setLoading(true)
    setResult(null)
    setScanError('')
    setRawData(data)
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawQRIS: data })
      })
      const json = await res.json()
      setResult(json)
    } catch {
      setScanError('Gagal terhubung ke server. Periksa koneksi internet.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setRawData('')
    setScanError('')
  }

  return (
    <>
      <Head>
        <title>Verifikasi QRIS — QRIS Verifier</title>
      </Head>

      <div style={{ minHeight: '100vh', padding: '1.5rem 1rem', maxWidth: 540, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,249,133,0.2)',
              color: '#fff', borderRadius: '10px', padding: '8px 14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Kembali
            </button>
          </Link>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>Verifikasi QRIS</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>Scan QR untuk memverifikasi</p>
          </div>
        </div>

        {/* Main card */}
        <div className="glass" style={{ padding: '1.75rem' }}>
          {!result && !loading && (
            <>
              <p style={{
                color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem',
                textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.6
              }}>
                Arahkan kamera ke QRIS merchant atau upload foto QRIS dari galeri Anda
              </p>
              <QRScanner onScan={handleScan} onError={setScanError} />
            </>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: 56, height: 56,
                  border: '3px solid rgba(255,249,133,0.1)',
                  borderTop: '3px solid #fff985',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              </div>
              <p style={{ color: '#fff985', fontWeight: 600, fontSize: '0.95rem' }}>Memverifikasi QRIS...</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 4 }}>Mencocokkan hash SHA-256</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="fade-in">
              {result.verified ? (
                /* SUCCESS */
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '1rem' }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'rgba(34,197,94,0.15)',
                        border: '2px solid rgba(34,197,94,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', position: 'relative', zIndex: 1
                      }}>✅</div>
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: '2px solid rgba(34,197,94,0.3)',
                        animation: 'pulse-ring 2s ease-out infinite'
                      }} />
                    </div>
                    <h2 style={{ color: '#4ade80', fontWeight: 800, fontSize: '1.4rem', marginBottom: 4 }}>
                      QRIS Terverifikasi
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem' }}>
                      QRIS ini aman dan terdaftar. Transaksi dapat dilanjutkan.
                    </p>
                  </div>

                  {/* Merchant info */}
                  <div style={{
                    background: 'rgba(34,197,94,0.06)', borderRadius: '14px',
                    border: '1px solid rgba(34,197,94,0.2)', padding: '1.25rem',
                    marginBottom: '1.25rem'
                  }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 600,
                      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Detail Merchant
                    </p>
                    {[
                      { label: 'Nama Merchant', val: result.merchant?.name },
                      { label: 'ID Merchant', val: result.merchant?.id },
                      { label: 'Kategori', val: result.merchant?.category },
                      { label: 'Terdaftar', val: result.merchant?.registeredAt
                        ? new Date(result.merchant.registeredAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-' },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                        padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.83rem' }}>{label}</span>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.83rem', textAlign: 'right', maxWidth: '55%' }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hash */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem',
                      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>SHA-256 Hash</p>
                    <div style={{
                      background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px 12px',
                      fontFamily: 'Space Mono, monospace', fontSize: '0.68rem',
                      color: '#fff985', wordBreak: 'break-all', lineHeight: 1.5
                    }}>
                      {result.hash}
                    </div>
                  </div>

                  <button className="btn-primary" onClick={reset} style={{ width: '100%' }}>
                    Scan QRIS Lain
                  </button>
                </div>
              ) : (
                /* DANGER */
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
                      background: 'rgba(239,68,68,0.12)',
                      border: '2px solid rgba(239,68,68,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem'
                    }}>⚠️</div>
                    <h2 style={{ color: '#f87171', fontWeight: 800, fontSize: '1.4rem', marginBottom: 4 }}>
                      QRIS Tidak Dikenal
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                      QRIS ini <strong style={{ color: '#f87171' }}>belum terdaftar</strong> di database kami.
                      Segera beritahu kasir atau batalkan transaksi.
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(239,68,68,0.08)', borderRadius: '14px',
                    border: '1px solid rgba(239,68,68,0.25)', padding: '1rem',
                    marginBottom: '1.25rem'
                  }}>
                    <p style={{ color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      🚨 <strong>Peringatan Keamanan:</strong> Jangan lanjutkan transaksi sebelum memverifikasi
                      keaslian QRIS ini dengan pihak merchant atau pengelola.
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem',
                      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Hash yang Dicek</p>
                    <div style={{
                      background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px 12px',
                      fontFamily: 'Space Mono, monospace', fontSize: '0.68rem',
                      color: '#f87171', wordBreak: 'break-all', lineHeight: 1.5
                    }}>
                      {result.hash}
                    </div>
                  </div>

                  <button className="btn-primary" onClick={reset} style={{ width: '100%' }}>
                    Scan Ulang
                  </button>
                </div>
              )}
            </div>
          )}

          {scanError && !loading && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px', padding: '1rem', textAlign: 'center', marginTop: '1rem'
            }}>
              <p style={{ color: '#f87171', fontSize: '0.85rem' }}>⚠️ {scanError}</p>
              <button className="btn-secondary" onClick={reset} style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        {!result && !loading && (
          <div style={{
            marginTop: '1.5rem', padding: '1rem 1.25rem',
            background: 'rgba(255,249,133,0.04)', borderRadius: '14px',
            border: '1px solid rgba(255,249,133,0.1)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.6 }}>
              💡 <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Tips:</strong> Pastikan gambar QRIS tidak buram dan seluruh kode terlihat jelas untuk hasil scan yang akurat.
            </p>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeIn 0.4s ease forwards; }
        `}</style>
      </div>
    </>
  )
}
