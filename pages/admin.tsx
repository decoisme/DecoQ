import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Settings, ArrowLeft, CheckCircle, AlertTriangle, Search, Camera, Upload, Inbox } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const QRScanner = dynamic(() => import('../components/QRScanner'), { ssr: false })

type QRISEntry = {
  id: string
  hash: string
  merchant_name: string
  merchant_id: string
  category: string
  registered_by: string
  registered_at: string
  is_active: boolean
  notes?: string
}

const CATEGORIES = ['F&B', 'Retail', 'Jasa', 'Transportasi', 'Kesehatan', 'Pendidikan', 'E-commerce', 'Umum']

export default function Admin() {
  const [tab, setTab] = useState<'register' | 'list'>('register')
  const [adminKey, setAdminKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Register form
  const [form, setForm] = useState({
    merchantName: '', merchantId: '', category: 'Umum',
    registeredBy: '', notes: '', rawQRIS: ''
  })
  const [scanning, setScanning] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regResult, setRegResult] = useState<{ success?: boolean; message?: string; hash?: string; error?: string } | null>(null)

  // List
  const [list, setList] = useState<QRISEntry[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const tryAuth = async () => {
    setAuthLoading(true)
    setAuthError('')
    // Test by fetching list
    try {
      const res = await fetch('/api/list', {
        headers: { 'x-admin-key': adminKey }
      })
      if (res.status === 401) {
        setAuthError('Kunci admin salah. Coba lagi.')
      } else {
        setAuthed(true)
        const json = await res.json()
        setList(json.data || [])
      }
    } catch {
      setAuthError('Gagal terhubung ke server.')
    }
    setAuthLoading(false)
  }

  const fetchList = async () => {
    setListLoading(true)
    try {
      const res = await fetch('/api/list', { headers: { 'x-admin-key': adminKey } })
      const json = await res.json()
      setList(json.data || [])
    } catch {}
    setListLoading(false)
  }

  useEffect(() => {
    if (authed && tab === 'list') fetchList()
  }, [tab, authed])

  const handleRegister = async () => {
    if (!form.merchantName || !form.merchantId || !form.rawQRIS) {
      setRegResult({ error: 'Nama merchant, ID merchant, dan data QRIS wajib diisi.' })
      return
    }
    setRegLoading(true)
    setRegResult(null)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, ...form })
      })
      const json = await res.json()
      if (json.success) {
        setRegResult({ success: true, message: json.message, hash: json.hash })
        setForm({ merchantName: '', merchantId: '', category: 'Umum', registeredBy: '', notes: '', rawQRIS: '' })
      } else {
        setRegResult({ error: json.error })
      }
    } catch {
      setRegResult({ error: 'Gagal menghubungi server.' })
    }
    setRegLoading(false)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Nonaktifkan QRIS ini?')) return
    await fetch('/api/list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id })
    })
    fetchList()
  }

  const filtered = list.filter(q =>
    q.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.merchant_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Auth screen
  if (!authed) {
    return (
      <>
        <Head><title>Admin — DecoQ</title></Head>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
          {/* Background animation */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(255,249,133,0.05) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="glass"
            style={{ padding: '2.5rem', width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
          >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto 0.75rem',
                  background: 'linear-gradient(135deg, rgba(255,249,133,0.15), rgba(255,233,64,0.08))',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,249,133,0.2)'
                }}
              >
                <Settings size={32} color="#fff985" strokeWidth={2.5} />
              </motion.div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>Panel Admin</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 6 }}>
                Masukkan kunci admin untuk melanjutkan
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Image src="/logo.svg" alt="DecoQ" width={20} height={20} />
                <span style={{ color: 'rgba(255,249,133,0.6)', fontSize: '0.75rem', fontWeight: 600 }}>
                  Powered by DecoQ
                </span>
              </motion.div>
            </div>

            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', display: 'block', marginBottom: 6 }}>
              Kunci Admin
            </label>
            <input
              type="password"
              className="input-glass"
              placeholder="Masukkan kunci admin..."
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tryAuth()}
              style={{ marginBottom: '1rem' }}
            />

            {authError && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  color: '#f87171',
                  fontSize: '0.83rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertTriangle size={16} />
                {authError}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
              onClick={tryAuth}
              disabled={authLoading || !adminKey}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {authLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="spinner"
                  />
                  Memverifikasi...
                </>
              ) : (
                'Masuk Admin'
              )}
            </motion.button>

            <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: '1.25rem',
              color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', textDecoration: 'none' }}>
              ← Kembali ke beranda
            </Link>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Admin — DecoQ</title></Head>
      <div style={{ minHeight: '100vh', maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
              </motion.button>
            </Link>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Image src="/logo.svg" alt="DecoQ" width={32} height={32} />
            </motion.div>
            <div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>Panel Admin</h1>
              <span className="tag tag-neutral" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} />
                Terautentikasi
              </span>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}
          >
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>Total QRIS</span>
            <motion.span
              key={list.filter(q => q.is_active).length}
              initial={{ scale: 1.5, color: '#fff985' }}
              animate={{ scale: 1, color: '#fff985' }}
              style={{ fontWeight: 700, fontSize: '1.5rem' }}
            >
              {list.filter(q => q.is_active).length}
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['register', 'list'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.88rem',
              transition: 'all 0.2s',
              background: tab === t ? 'linear-gradient(135deg, #fff985, #ffe940)' : 'rgba(255,255,255,0.06)',
              color: tab === t ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
              border: tab === t ? 'none' : '1px solid rgba(255,249,133,0.2)'
            }}>
              {t === 'register' ? '+ Daftarkan QRIS' : `Daftar QRIS (${list.filter(q => q.is_active).length})`}
            </button>
          ))}
        </div>

        {/* Register Tab */}
        {tab === 'register' && (
          <div className="glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Daftarkan QRIS Baru
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                    Nama Merchant *
                  </label>
                  <input className="input-glass" placeholder="Cth: Warung Pak Budi"
                    value={form.merchantName} onChange={e => setForm({ ...form, merchantName: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                    ID Merchant *
                  </label>
                  <input className="input-glass" placeholder="Cth: MERCH001"
                    value={form.merchantId} onChange={e => setForm({ ...form, merchantId: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                    Kategori
                  </label>
                  <select className="input-glass" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a2e' }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                    Didaftarkan oleh
                  </label>
                  <input className="input-glass" placeholder="Nama admin"
                    value={form.registeredBy} onChange={e => setForm({ ...form, registeredBy: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', display: 'block', marginBottom: 6 }}>
                  Catatan (opsional)
                </label>
                <input className="input-glass" placeholder="Catatan tambahan..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              {/* QRIS Data */}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', display: 'block', marginBottom: 8 }}>
                  Data QRIS * {form.rawQRIS && <span className="tag tag-success" style={{ marginLeft: 6, fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={10} />
                    Terisi
                  </span>}
                </label>

                {!form.rawQRIS && (
                  <>
                    {scanning ? (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <QRScanner
                          onScan={(data) => { setForm({ ...form, rawQRIS: data }); setScanning(false) }}
                          onError={() => setScanning(false)}
                        />
                        <button className="btn-secondary" onClick={() => setScanning(false)}
                          style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.85rem' }}>
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <button className="btn-secondary" onClick={() => setScanning(true)}
                          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Camera size={16} />
                          Scan QRIS
                        </button>
                        <label className="btn-secondary" style={{
                          fontSize: '0.85rem', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: 6, cursor: 'pointer'
                        }}>
                          <Upload size={16} />
                          Upload File
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={async e => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const url = URL.createObjectURL(file)
                              const img = new Image()
                              img.src = url
                              img.onload = async () => {
                                const canvas = document.createElement('canvas')
                                canvas.width = img.width; canvas.height = img.height
                                const ctx = canvas.getContext('2d')!
                                ctx.drawImage(img, 0, 0)
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                                const jsQR = (await import('jsqr')).default
                                const code = jsQR(imageData.data, imageData.width, imageData.height)
                                URL.revokeObjectURL(url)
                                if (code?.data) setForm({ ...form, rawQRIS: code.data })
                                else alert('QR tidak terdeteksi. Coba gambar yang lebih jelas.')
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                    )}
                    <textarea className="input-glass" rows={3}
                      placeholder="Atau paste raw data QRIS string di sini..."
                      value={form.rawQRIS}
                      onChange={e => setForm({ ...form, rawQRIS: e.target.value })}
                      style={{ resize: 'vertical', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem' }}
                    />
                  </>
                )}

                {form.rawQRIS && (
                  <div style={{
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '10px', padding: '0.75rem 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                  }}>
                    <div>
                      <p style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.85rem', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={16} />
                        Data QRIS terisi
                      </p>
                      <p style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '0.68rem',
                        color: 'rgba(255,255,255,0.35)', overflow: 'hidden',
                        whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 220
                      }}>
                        {form.rawQRIS}
                      </p>
                    </div>
                    <button onClick={() => setForm({ ...form, rawQRIS: '' })} style={{
                      background: 'transparent', border: 'none', color: '#f87171',
                      cursor: 'pointer', fontSize: '1.1rem', padding: '4px'
                    }}>×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Result message */}
            {regResult && (
              <div style={{
                marginTop: '1rem', padding: '0.9rem 1rem', borderRadius: '12px',
                background: regResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${regResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}>
                <p style={{ color: regResult.success ? '#4ade80' : '#f87171', fontWeight: 600, fontSize: '0.88rem', marginBottom: regResult.hash ? 4 : 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {regResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {regResult.message || regResult.error}
                </p>
                {regResult.hash && (
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 4, wordBreak: 'break-all' }}>
                    Hash: {regResult.hash}
                  </p>
                )}
              </div>
            )}

            <button className="btn-primary" onClick={handleRegister} disabled={regLoading}
              style={{ width: '100%', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {regLoading ? <><div className="spinner" />Mendaftarkan...</> : '+ Daftarkan QRIS'}
            </button>
          </div>
        )}

        {/* List Tab */}
        {tab === 'list' && (
          <div>
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Search size={16} color="rgba(255,255,255,0.3)" />
              </div>
              <input className="input-glass" placeholder="Cari merchant atau ID..." style={{ paddingLeft: '2.5rem' }}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {listLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <div className="spinner" />
                </div>
                Memuat data...
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
                <Inbox size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                  {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada QRIS terdaftar'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map(q => (
                  <div key={q.id} className="glass-dark" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{q.merchant_name}</span>
                          <span className={`tag ${q.is_active ? 'tag-success' : 'tag-danger'}`} style={{ fontSize: '0.68rem' }}>
                            {q.is_active ? '● Aktif' : '○ Nonaktif'}
                          </span>
                          <span className="tag tag-neutral" style={{ fontSize: '0.68rem' }}>{q.category}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                          ID: {q.merchant_id} · {new Date(q.registered_at).toLocaleDateString('id-ID')}
                        </p>
                        <p style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '0.62rem',
                          color: 'rgba(255,249,133,0.4)', marginTop: 4, overflow: 'hidden',
                          whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 260
                        }}>
                          {q.hash}
                        </p>
                      </div>
                      {q.is_active && (
                        <button onClick={() => handleDeactivate(q.id)} style={{
                          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#f87171', borderRadius: '8px', padding: '6px 12px',
                          cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap'
                        }}>
                          Nonaktifkan
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
