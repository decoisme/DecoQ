import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Settings,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Search,
  Camera,
  Upload,
  Inbox,
  Edit2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRISListItem from "../components/QRISListItem";

const QRScanner = dynamic(() => import("../components/QRScanner"), {
  ssr: false,
});

type QRISEntry = {
  id: string;
  hash: string;
  merchant_name: string;
  merchant_id: string;
  category: string;
  registered_by: string;
  registered_at: string;
  is_active: boolean;
  notes?: string;
};

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

export default function Admin() {
  const [tab, setTab] = useState<"register" | "list">("register");
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Register form
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

  // List
  const [list, setList] = useState<QRISEntry[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit modal
  const [editingQRIS, setEditingQRIS] = useState<QRISEntry | null>(null);
  const [editForm, setEditForm] = useState({
    merchantName: "",
    merchantId: "",
    category: "Umum",
    notes: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editResult, setEditResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const tryAuth = async () => {
    setAuthLoading(true);
    setAuthError("");
    // Test by fetching list
    try {
      const res = await fetch("/api/list", {
        headers: { "x-admin-key": adminKey },
      });
      if (res.status === 401) {
        setAuthError("Kunci admin salah. Coba lagi.");
      } else {
        setAuthed(true);
        const json = await res.json();
        setList(json.data || []);
      }
    } catch {
      setAuthError("Gagal terhubung ke server.");
    }
    setAuthLoading(false);
  };

  const fetchList = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/list", {
        headers: { "x-admin-key": adminKey },
      });
      const json = await res.json();
      setList(json.data || []);
    } catch {}
    setListLoading(false);
  };

  useEffect(() => {
    if (authed && tab === "list") fetchList();
  }, [tab, authed]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, ...form }),
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
      } else {
        setRegResult({ error: json.error });
      }
    } catch {
      setRegResult({ error: "Gagal menghubungi server." });
    }
    setRegLoading(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Nonaktifkan QRIS ini?")) return;
    await fetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ id }),
    });
    fetchList();
  };

  const handleActivate = async (id: string) => {
    if (!confirm("Aktifkan kembali QRIS ini?")) return;
    const res = await fetch("/api/list", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ id, action: "activate" }),
    });
    const json = await res.json();
    if (json.success) {
      alert(json.message);
      fetchList();
    }
  };

  const handleDeletePermanent = async (id: string, merchantName: string) => {
    const confirmation = prompt(
      `⚠ PERINGATAN: Hapus permanen tidak dapat dibatalkan!\n\nKetik "DELETE_PERMANENT" untuk menghapus QRIS "${merchantName}" secara permanen:`,
    );

    if (confirmation !== "DELETE_PERMANENT") {
      alert("Penghapusan dibatalkan");
      return;
    }

    const res = await fetch("/api/list", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ id, confirm: "DELETE_PERMANENT" }),
    });

    const json = await res.json();
    if (json.success) {
      alert(json.message);
      fetchList();
    } else {
      alert("Gagal menghapus: " + json.error);
    }
  };

  const openEditModal = (qris: QRISEntry) => {
    setEditingQRIS(qris);
    setEditForm({
      merchantName: qris.merchant_name,
      merchantId: qris.merchant_id,
      category: qris.category,
      notes: qris.notes || "",
    });
    setEditResult(null);
  };

  const closeEditModal = () => {
    setEditingQRIS(null);
    setEditForm({
      merchantName: "",
      merchantId: "",
      category: "Umum",
      notes: "",
    });
    setEditResult(null);
  };

  const handleEditSubmit = async () => {
    if (!editingQRIS) return;

    setEditLoading(true);
    setEditResult(null);

    try {
      const res = await fetch("/api/list", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          id: editingQRIS.id,
          action: "update",
          merchantName: editForm.merchantName,
          merchantId: editForm.merchantId,
          category: editForm.category,
          notes: editForm.notes,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setEditResult({ success: true, message: json.message });
        setTimeout(() => {
          closeEditModal();
          fetchList();
        }, 1500);
      } else {
        setEditResult({ error: json.error });
      }
    } catch (error) {
      setEditResult({ error: "Gagal menghubungi server" });
    } finally {
      setEditLoading(false);
    }
  };

  const filtered = list.filter(
    (q) =>
      q.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.merchant_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Auth screen
  if (!authed) {
    return (
      <>
        <Head>
          <title>Admin — DecoQ</title>
        </Head>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background animation */}
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              width: 400,
              height: 400,
              background:
                "radial-gradient(circle, rgba(255,249,133,0.05) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="glass"
            style={{
              padding: "2.5rem",
              width: "100%",
              maxWidth: 420,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 0.75rem",
                  background:
                    "linear-gradient(135deg, rgba(255,249,133,0.15), rgba(255,233,64,0.08))",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,249,133,0.2)",
                }}
              >
                <Settings size={32} color="#fff985" strokeWidth={2.5} />
              </motion.div>
              <h1
                style={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem" }}
              >
                Panel Admin
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.85rem",
                  marginTop: 6,
                }}
              >
                Masukkan kunci admin untuk melanjutkan
              </p>
            </div>

            <label
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.82rem",
                display: "block",
                marginBottom: 6,
              }}
            >
              Kunci Admin
            </label>
            <input
              type="password"
              className="input-glass"
              placeholder="Masukkan kunci admin..."
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tryAuth()}
              style={{ marginBottom: "1rem" }}
            />

            {authError && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  color: "#f87171",
                  fontSize: "0.83rem",
                  marginBottom: "1rem",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
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
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {authLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="spinner"
                  />
                  Memverifikasi...
                </>
              ) : (
                "Masuk Admin"
              )}
            </motion.button>

            <Link
              href="/"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "1.25rem",
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.82rem",
                textDecoration: "none",
              }}
            >
              ← Kembali ke beranda
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin — DecoQ</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          maxWidth: 560,
          margin: "0 auto",
          padding: "1.5rem 1rem",
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Link href="/" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.05, x: -3 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,249,133,0.2)",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
              </motion.button>
            </Link>
            <div>
              <h1
                style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem" }}
              >
                Panel Admin
              </h1>
              <span
                className="tag tag-neutral"
                style={{
                  fontSize: "0.7rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle size={12} />
                Terautentikasi
              </span>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            style={{
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            <span
              style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}
            >
              Total QRIS
            </span>
            <motion.span
              key={list.filter((q) => q.is_active).length}
              initial={{ scale: 1.5, color: "#fff985" }}
              animate={{ scale: 1, color: "#fff985" }}
              style={{ fontWeight: 700, fontSize: "1.5rem" }}
            >
              {list.filter((q) => q.is_active).length}
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {(["register", "list"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "10px",
                cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                fontSize: "0.88rem",
                transition: "all 0.2s",
                background:
                  tab === t
                    ? "linear-gradient(135deg, #fff985, #ffe940)"
                    : "rgba(255,255,255,0.06)",
                color: tab === t ? "#1a1a2e" : "rgba(255,255,255,0.6)",
                border: tab === t ? "none" : "1px solid rgba(255,249,133,0.2)",
              }}
            >
              {t === "register"
                ? "+ Daftarkan QRIS"
                : `Daftar QRIS (${list.filter((q) => q.is_active).length})`}
            </button>
          ))}
        </div>

        {/* Register Tab */}
        {tab === "register" && (
          <div className="glass" style={{ padding: "1.75rem" }}>
            <h2
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.1rem",
                marginBottom: "1.5rem",
              }}
            >
              Daftarkan QRIS Baru
            </h2>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: "0.8rem",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Nama Merchant *
                  </label>
                  <input
                    className="input-glass"
                    placeholder="Cth: Warung Pak Budi"
                    value={form.merchantName}
                    onChange={(e) =>
                      setForm({ ...form, merchantName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: "0.8rem",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    ID Merchant *
                  </label>
                  <input
                    className="input-glass"
                    placeholder="Cth: MERCH001"
                    value={form.merchantId}
                    onChange={(e) =>
                      setForm({ ...form, merchantId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: "0.8rem",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Kategori
                  </label>
                  <select
                    className="input-glass"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option
                        key={c}
                        value={c}
                        style={{ background: "#1a1a2e" }}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: "0.8rem",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Didaftarkan oleh
                  </label>
                  <input
                    className="input-glass"
                    placeholder="Nama admin"
                    value={form.registeredBy}
                    onChange={(e) =>
                      setForm({ ...form, registeredBy: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: "0.8rem",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
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
                <label
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: "0.8rem",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Data QRIS *{" "}
                  {form.rawQRIS && (
                    <span
                      className="tag tag-success"
                      style={{
                        marginLeft: 6,
                        fontSize: "0.68rem",
                        display: "inline-flex",
                        alignItems: "center",
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
                      <div style={{ marginBottom: "0.75rem" }}>
                        <QRScanner
                          onScan={(data, merchantInfo) => {
                            // Set raw QRIS data and auto-fill merchant info
                            setForm((prev) => ({
                              ...prev,
                              rawQRIS: data,
                              merchantName:
                                merchantInfo?.merchantName || prev.merchantName,
                              merchantId:
                                merchantInfo?.merchantId || prev.merchantId,
                            }));

                            // Show success notification if merchant info detected
                            if (
                              merchantInfo?.merchantName ||
                              merchantInfo?.merchantId
                            ) {
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
                          style={{
                            marginTop: "0.75rem",
                            width: "100%",
                            fontSize: "0.85rem",
                          }}
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <button
                          className="btn-secondary"
                          onClick={() => setScanning(true)}
                          style={{
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <Camera size={16} />
                          Scan QRIS
                        </button>
                        <label
                          className="btn-secondary"
                          style={{
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            cursor: "pointer",
                          }}
                        >
                          <Upload size={16} />
                          Upload File
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              try {
                                // Import QRIS utilities
                                const {
                                  decodeQRFromFile,
                                  extractQRISMerchantInfo,
                                  isValidQRIS,
                                } = await import("../lib/qris");

                                // Decode QR from image
                                const rawPayload = await decodeQRFromFile(file);

                                // Set raw QRIS data
                                setForm({ ...form, rawQRIS: rawPayload });

                                // Auto-fill merchant info if valid QRIS
                                if (isValidQRIS(rawPayload)) {
                                  const merchantInfo =
                                    extractQRISMerchantInfo(rawPayload);

                                  setForm((prev) => ({
                                    ...prev,
                                    rawQRIS: rawPayload,
                                    merchantName:
                                      merchantInfo.merchantName ||
                                      prev.merchantName,
                                    merchantId:
                                      merchantInfo.merchantId ||
                                      prev.merchantId,
                                  }));

                                  // Show success notification
                                  setRegResult({
                                    success: true,
                                    message: `✓ QRIS terdeteksi! Merchant: ${merchantInfo.merchantName || "N/A"}, NMID: ${merchantInfo.merchantId || "N/A"}`,
                                  });

                                  // Clear notification after 3 seconds
                                  setTimeout(() => setRegResult(null), 3000);
                                } else {
                                  alert(
                                    "QR Code terdeteksi tapi bukan format QRIS yang valid.",
                                  );
                                }
                              } catch (err) {
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "QR tidak terdeteksi. Coba gambar yang lebih jelas.",
                                );
                              }

                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    )}
                    <textarea
                      className="input-glass"
                      rows={3}
                      placeholder="Atau paste raw data QRIS string di sini..."
                      value={form.rawQRIS}
                      onChange={(e) =>
                        setForm({ ...form, rawQRIS: e.target.value })
                      }
                      style={{
                        resize: "vertical",
                        fontFamily: "Space Mono, monospace",
                        fontSize: "0.75rem",
                      }}
                    />
                  </>
                )}

                {form.rawQRIS && (
                  <div
                    style={{
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#4ade80",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          marginBottom: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CheckCircle size={16} />
                        Data QRIS terisi
                      </p>
                      <p
                        style={{
                          fontFamily: "Space Mono, monospace",
                          fontSize: "0.68rem",
                          color: "rgba(255,255,255,0.35)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          maxWidth: 220,
                        }}
                      >
                        {form.rawQRIS}
                      </p>
                    </div>
                    <button
                      onClick={() => setForm({ ...form, rawQRIS: "" })}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#f87171",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        padding: "4px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Result message */}
            {regResult && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.9rem 1rem",
                  borderRadius: "12px",
                  background: regResult.success
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(239,68,68,0.1)",
                  border: `1px solid ${regResult.success ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                <p
                  style={{
                    color: regResult.success ? "#4ade80" : "#f87171",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    marginBottom: regResult.hash ? 4 : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {regResult.success ? (
                    <CheckCircle size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  {regResult.message || regResult.error}
                </p>
                {regResult.hash && (
                  <p
                    style={{
                      fontFamily: "Space Mono, monospace",
                      fontSize: "0.65rem",
                      color: "rgba(255,255,255,0.35)",
                      marginTop: 4,
                      wordBreak: "break-all",
                    }}
                  >
                    Hash: {regResult.hash}
                  </p>
                )}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleRegister}
              disabled={regLoading}
              style={{
                width: "100%",
                marginTop: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {regLoading ? (
                <>
                  <div className="spinner" />
                  Mendaftarkan...
                </>
              ) : (
                "+ Daftarkan QRIS"
              )}
            </button>
          </div>
        )}

        {/* List Tab */}
        {tab === "list" && (
          <div>
            <div style={{ marginBottom: "1rem", position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <Search size={16} color="rgba(255,255,255,0.3)" />
              </div>
              <input
                className="input-glass"
                placeholder="Cari merchant atau ID..."
                style={{ paddingLeft: "2.5rem" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {listLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <div className="spinner" />
                </div>
                Memuat data...
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="glass"
                style={{ padding: "3rem", textAlign: "center" }}
              >
                <Inbox
                  size={48}
                  color="rgba(255,255,255,0.2)"
                  style={{ margin: "0 auto 12px" }}
                />
                <p
                  style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}
                >
                  {searchTerm
                    ? "Tidak ada hasil pencarian"
                    : "Belum ada QRIS terdaftar"}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  overflow: "visible", // Penting: biarkan dropdown menu keluar
                  position: "relative"
                }}
              >
                {filtered.map((q) => (
                  <QRISListItem
                    key={q.id}
                    qris={q}
                    onEdit={() => openEditModal(q)}
                    onActivate={() => handleActivate(q.id)}
                    onDeactivate={() => handleDeactivate(q.id)}
                    onDelete={() => handleDeletePermanent(q.id, q.merchant_name)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editingQRIS && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                zIndex: 1000,
              }}
              onClick={closeEditModal}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass"
                style={{
                  width: "100%",
                  maxWidth: 500,
                  padding: "2rem",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h2
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Edit2 size={20} color="#60a5fa" />
                    Edit Data QRIS
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeEditModal}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={18} />
                  </motion.button>
                </div>

                <div style={{ display: "grid", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.8rem",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Nama Merchant *
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Nama merchant"
                      value={editForm.merchantName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          merchantName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.8rem",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      ID Merchant *
                    </label>
                    <input
                      className="input-glass"
                      placeholder="ID merchant"
                      value={editForm.merchantId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, merchantId: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.8rem",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Kategori
                    </label>
                    <select
                      className="input-glass"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {CATEGORIES.map((c) => (
                        <option
                          key={c}
                          value={c}
                          style={{ background: "#1a1a2e" }}
                        >
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "0.8rem",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Catatan
                    </label>
                    <textarea
                      className="input-glass"
                      rows={3}
                      placeholder="Catatan tambahan..."
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({ ...editForm, notes: e.target.value })
                      }
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Hash info (read-only) */}
                  <div>
                    <label
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: "0.72rem",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      SHA-256 Hash (tidak dapat diubah)
                    </label>
                    <div
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontFamily: "Space Mono, monospace",
                        fontSize: "0.65rem",
                        color: "rgba(255,249,133,0.5)",
                        wordBreak: "break-all",
                        lineHeight: 1.5,
                      }}
                    >
                      {editingQRIS.hash}
                    </div>
                  </div>
                </div>

                {/* Result message */}
                {editResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: "1rem",
                      padding: "0.9rem 1rem",
                      borderRadius: "12px",
                      background: editResult.success
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(239,68,68,0.1)",
                      border: `1px solid ${editResult.success ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}
                  >
                    <p
                      style={{
                        color: editResult.success ? "#4ade80" : "#f87171",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {editResult.success ? (
                        <CheckCircle size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                      {editResult.message || editResult.error}
                    </p>
                  </motion.div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginTop: "1.5rem",
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary"
                    onClick={closeEditModal}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary"
                    onClick={handleEditSubmit}
                    disabled={
                      editLoading ||
                      !editForm.merchantName ||
                      !editForm.merchantId
                    }
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {editLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="spinner"
                        />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Simpan Perubahan
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
