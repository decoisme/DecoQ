import { useRef, useState, useCallback, useEffect } from 'react'

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (err: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number>(0)

  const [mode, setMode] = useState<'idle' | 'camera' | 'file'>('idle')
  const [camError, setCamError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    cancelAnimationFrame(animRef.current)
    setScanning(false)
  }, [])

  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    stopCamera()
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
      setMode('camera')
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError'
        ? 'Akses kamera ditolak. Izinkan akses kamera di browser.'
        : 'Kamera tidak tersedia di perangkat ini.'
      setCamError(msg)
      onError?.(msg)
    }
  }, [stopCamera, onError])

  // Scan frame
  useEffect(() => {
    if (!scanning) return

    let jsQR: any = null
    import('jsqr').then(m => { jsQR = m.default })

    const tick = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !jsQR || video.readyState < 2) {
        animRef.current = requestAnimationFrame(tick)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0)
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
      if (code?.data) {
        stopCamera()
        setMode('idle')
        onScan(code.data)
        return
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [scanning, stopCamera, onScan])

  const handleFlip = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.src = url
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const jsQR = (await import('jsqr')).default
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      URL.revokeObjectURL(url)
      if (code?.data) {
        onScan(code.data)
      } else {
        onError?.('QR Code tidak ditemukan dalam gambar. Coba gambar yang lebih jelas.')
      }
    }
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Buttons */}
      {mode === 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={() => startCamera('environment')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Buka Kamera
          </button>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Gambar
          </button>
        </div>
      )}

      {/* Camera view */}
      {mode === 'camera' && (
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
          <video ref={videoRef} playsInline muted
            style={{ width: '100%', display: 'block', maxHeight: '340px', objectFit: 'cover' }} />
          
          {/* Scanner overlay */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
          }}>
            <div style={{ position: 'relative', width: 180, height: 180 }}>
              {/* Corner markers */}
              {[
                { top: 0, left: 0, borderTop: '3px solid #fff985', borderLeft: '3px solid #fff985', borderRadius: '4px 0 0 0' },
                { top: 0, right: 0, borderTop: '3px solid #fff985', borderRight: '3px solid #fff985', borderRadius: '0 4px 0 0' },
                { bottom: 0, left: 0, borderBottom: '3px solid #fff985', borderLeft: '3px solid #fff985', borderRadius: '0 0 0 4px' },
                { bottom: 0, right: 0, borderBottom: '3px solid #fff985', borderRight: '3px solid #fff985', borderRadius: '0 0 4px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
              ))}
              {/* Scan line */}
              <div style={{
                position: 'absolute', top: '50%', left: 4, right: 4, height: 2,
                background: 'linear-gradient(90deg, transparent, #fff985, transparent)',
                animation: 'scanLine 2s linear infinite',
                boxShadow: '0 0 8px #fff985'
              }} />
            </div>
          </div>

          {/* Controls */}
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={handleFlip} style={{
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,249,133,0.4)',
              color: '#fff', borderRadius: '10px', padding: '8px 16px',
              cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              Balik
            </button>
            <button onClick={() => { stopCamera(); setMode('idle') }} style={{
              background: 'rgba(239,68,68,0.6)', border: '1px solid rgba(239,68,68,0.5)',
              color: '#fff', borderRadius: '10px', padding: '8px 16px',
              cursor: 'pointer', fontSize: '0.8rem'
            }}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {camError && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', padding: '0.75rem 1rem',
          color: '#f87171', fontSize: '0.85rem', textAlign: 'center'
        }}>
          ⚠️ {camError}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      <style>{`
        @keyframes scanLine {
          0% { top: 8px; }
          50% { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
      `}</style>
    </div>
  )
}
