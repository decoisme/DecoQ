import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Camera, Upload } from "lucide-react";
import dynamic from "next/dynamic";
import { extractQRISMerchantInfo, isValidQRIS } from "../lib/qris";

const QRScanner = dynamic(() => import("./QRScanner"), { ssr: false });

const CATEGORIES = [
  "F&B",
  "Retail",
  "Jasa",
  "Transportasi",
  "Kesehatan",
  "Pendidikan",
  "E-commerce",
  "Umum",
];

interface RegisterQRISTabProps {
  sessionToken: string;
  onSuccess?: () => void;
}

export default function RegisterQRISTab({ sessionToken, onSuccess }: RegisterQRISTabProps) {
  const [form, setForm] = useState({
    merchantName: "",
    merchantId: "",
    category: "Umum",
    registeredBy: "",
    notes: "",
    rawQRIS: "",
  });

  const [scanning, setScanning] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regResult, setRegResult] = useState<{
    success?: boolean;
    message?: string;
    hash?: string;
    error?: string;
  } | null>(null);

  const handleRegister = async () => {
    if (!form.merchantName || !form.merchantId || !form.rawQRIS) {
      setRegResult({
        error: "Nama merchant, ID merchant, dan data QRIS wajib diisi.",
      });
      return;
    }

    setRegLoading(true);
    setRegResult(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (json.success) {
        setRegResult({ success: true, message: json.message, hash: json.hash });
        setForm({
          merchantName: "",
          merchantId: "",
          category: "Umum",
          registeredBy: "",
          notes: "",
          rawQRIS: "",
        });
        
        // Call onSuccess callback after 1.5s
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setRegResult({ error: json.error });
      }
    } catch (error) {
      setRegResult({ error: "Gagal menghubungi server." });
    }

    setRegLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { decodeQRFromFile, extractQRISMerchantInfo, isValidQRIS } = await import("../lib/qris");

      const rawPayload = await decodeQRFromFile(file);
      setForm({ ...form, rawQRIS: rawPayload });

      if (isValidQRIS(rawPayload)) {
        const merchantInfo = extractQRISMerchantInfo(rawPayload);

        setForm((prev) => ({
          ...prev,
          rawQRIS: rawPayload,
          merchantName: merchantInfo.merchantName || prev.merchantName,
          merchantId: merchantInfo.merchantId || prev.merchantId,
        }));

        setRegResult({
          success: true,
          message: `✓ QRIS terdeteksi! Merchant: ${merchantInfo.merchantName || "N/A"}, NMID: ${merchantInfo.merchantId || "N/A"}`,
        });

        setTimeout(() => setRegResult(null), 3000);
      } else {
        alert("QR Code terdeteksi tapi bukan format QRIS yang valid.");
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "QR tidak terdeteksi. Coba gambar yang lebih jelas."
      );
    }

    e.target.value = "";
  };

  return (
    <div>
      <h1 style={{ 
        color: '#fff', 
        fontWeight: 800, 
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        Daftarkan QRIS Baru
      </h1>
      <p style={{ 
        color: 'rgba(255,255,255,0.5)', 
        fontSize: '0.95rem',
        marginBottom: '2rem'
      }}>
        Scan atau upload QRIS untuk mendaftarkan merchant baru
      </p>

      <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {/* Merchant Name & ID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                display: 'block',
                marginBottom: 8,
                fontWeight: 500
              }}>
                Nama Merchant *
              </label>
              <input
                className="input-glass"
                placeholder="Cth: Warung Pak Budi"
                value={form.merchantName}
                onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
              />
            </div>
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                display: 'block',
                marginBottom: 8,
                fontWeight: 500
              }}>
                ID Merchant *
              </label>
              <input
                className="input-glass"
                placeholder="Cth: ID1234567890123"
                value={form.merchantId}
                onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
              />
            </div>
          </div>

          {/* Category & Registered By */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                display: 'block',
                marginBottom: 8,
                fontWeight: 500
              }}>
                Kategori
              </label>
              <select
                className="input-glass"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ background: '#1a1a2e' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                display: 'block',
                marginBottom: 8,
                fontWeight: 500
              }}>
                Didaftarkan oleh
              </label>
              <input
                className="input-glass"
                placeholder="Nama admin"
                value={form.registeredBy}
                onChange={(e) => setForm({ ...form, registeredBy: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              display: 'block',
              marginBottom: 8,
              fontWeight: 500
            }}>
              Catatan (opsional)
            </label>
            <input
              className="input-glass"
              placeholder="Catatan tambahan..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* QRIS Data */}
          <div>
            <label style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              display: 'block',
              marginBottom: 8,
              fontWeight: 500
            }}>
              Data QRIS *{" "}
              {form.rawQRIS && (
                <span
                  className="tag tag-success"
                  style={{
                    marginLeft: 8,
                    fontSize: '0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CheckCircle size={10} />
                  Terisi
                </span>
              )}
            </label>

            {!form.rawQRIS && (
              <>
                {scanning ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <QRScanner
                      onScan={(data, merchantInfo) => {
                        setForm((prev) => ({
                          ...prev,
                          rawQRIS: data,
                          merchantName: merchantInfo?.merchantName || prev.merchantName,
                          merchantId: merchantInfo?.merchantId || prev.merchantId,
                        }));

                        if (merchantInfo?.merchantName || merchantInfo?.merchantId) {
                          setRegResult({
                            success: true,
                            message: `✓ QRIS terdeteksi! Merchant: ${merchantInfo.merchantName || "N/A"}, NMID: ${merchantInfo.merchantId || "N/A"}`,
                          });
                          setTimeout(() => setRegResult(null), 3000);
                        }

                        setScanning(false);
                      }}
                      onError={() => setScanning(false)}
                    />
                    <button
                      className="btn-secondary"
                      onClick={() => setScanning(false)}
                      style={{ marginTop: '1rem', width: '100%' }}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setScanning(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Camera size={18} />
                      Scan QRIS
                    </button>
                    <label
                      className="btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={18} />
                      Upload File
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                )}
                <textarea
                  className="input-glass"
                  rows={3}
                  placeholder="Atau paste raw data QRIS string di sini..."
                  value={form.rawQRIS}
                  onChange={(e) => setForm({ ...form, rawQRIS: e.target.value })}
                  style={{
                    resize: 'vertical',
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.8rem',
                  }}
                />
              </>
            )}

            {form.rawQRIS && (
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#4ade80',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <CheckCircle size={18} />
                    Data QRIS terisi
                  </p>
                  <p style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.4)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}>
                    {form.rawQRIS}
                  </p>
                </div>
                <button
                  onClick={() => setForm({ ...form, rawQRIS: "" })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '4px 8px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Result message */}
        <AnimatePresence>
          {regResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                background: regResult.success
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(239,68,68,0.1)',
                border: `1px solid ${regResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              <p style={{
                color: regResult.success ? '#4ade80' : '#f87171',
                fontWeight: 600,
                fontSize: '0.9rem',
                marginBottom: regResult.hash ? 6 : 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                {regResult.success ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertTriangle size={18} />
                )}
                {regResult.message || regResult.error}
              </p>
              {regResult.hash && (
                <p style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: 6,
                  wordBreak: 'break-all',
                }}>
                  Hash: {regResult.hash}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="btn-primary"
          onClick={handleRegister}
          disabled={regLoading}
          style={{
            width: '100%',
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '0.9rem',
          }}
        >
          {regLoading ? (
            <>
              <div className="spinner" />
              Mendaftarkan...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Daftarkan QRIS
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
