import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

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
        <title>Verifikasi QRIS — DecoQ</title>
      </Head>

      <div style={{ minHeight: '100vh', padding: '1.5rem 1rem', maxWidth: 560, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,249,133,0.2)',
                color: '#fff',
                borderRadius: '10px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.85rem'
              }}
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Kembali
            </motion.button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Image src="/logo.svg" alt="DecoQ" width={36} height={36} />
            </motion.div>
            <div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>Verifikasi QRIS</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>Powered by DecoQ</p>
            </div>
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass"
          style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}
        >
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.88rem',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                  lineHeight: 1.6
                }}>
                  Arahkan kamera ke QRIS merchant atau upload foto QRIS dari galeri Anda
                </p>
                <QRScanner onScan={handleScan} onError={setScanError} />
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ textAlign: 'center', padding: '2.5rem 1rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: 56,
                      height: 56,
                      border: '3px solid rgba(255,249,133,0.1)',
                      borderTop: '3px solid #fff985',
                      borderRadius: '50%'
                    }}
                  />
                </div>
                <motion.p
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ color: '#fff985', fontWeight: 600, fontSize: '0.95rem' }}
                >
                  Memverifikasi QRIS...
                </motion.p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 4 }}>
                  Mencocokkan hash SHA-256
                </p>
              </motion.div>
            )}

            {/* Result */}
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {result.verified ? (
                  /* SUCCESS */
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '1rem' }}>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            background: 'rgba(34,197,94,0.15)',
                            border: '2px solid rgba(34,197,94,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            zIndex: 1
                          }}
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                          >
                            <CheckCircle2 size={36} color="#4ade80" strokeWidth={2.5} />
                          </motion.div>
                        </motion.div>
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 0, 0.6]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            border: '2px solid rgba(34,197,94,0.3)'
                          }}
                        />
                      </div>
                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ color: '#4ade80', fontWeight: 800, fontSize: '1.4rem', marginBottom: 4 }}
                      >
                        QRIS Terverifikasi
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem' }}
                      >
                        QRIS ini aman dan terdaftar. Transaksi dapat dilanjutkan.
                      </motion.p>
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
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 150 }}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          margin: '0 auto 1rem',
                          background: 'rgba(239,68,68,0.12)',
                          border: '2px solid rgba(239,68,68,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          <AlertTriangle size={36} color="#f87171" strokeWidth={2.5} />
                        </motion.div>
                      </motion.div>
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
                      <p style={{ color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.6, display: 'flex', gap: '0.5rem' }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>Peringatan Keamanan:</strong> Jangan lanjutkan transaksi sebelum memverifikasi
                          keaslian QRIS ini dengan pihak merchant atau pengelola.
                        </span>
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
              </motion.div>
            )}

            {scanError && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  textAlign: 'center',
                  marginTop: '1rem'
                }}
              >
                <p style={{
                  color: '#f87171',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={16} />
                  {scanError}
                </p>
                <button className="btn-secondary" onClick={reset} style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                  Coba Lagi
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              background: 'rgba(255,249,133,0.04)',
              borderRadius: '14px',
              border: '1px solid rgba(255,249,133,0.1)'
            }}
          >
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              display: 'flex',
              gap: '0.5rem'
            }}>
              <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#fff985' }} />
              <span>
                <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Tips:</strong> Pastikan gambar QRIS tidak buram dan seluruh kode terlihat jelas untuk hasil scan yang akurat.
              </span>
            </p>
          </motion.div>
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
