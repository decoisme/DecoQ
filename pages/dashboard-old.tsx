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
  Shield,
  Crown,
  Eye,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRISListItem from "../components/QRISListItem";
import RestrictionModal from "../components/RestrictionModal";

const QRScanner = dynamic(() => import("../components/QRScanner"), {
  ssr: false,
});

type AdminRole = 'admin' | 'superadmin'

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

export default function Dashboard() {
  const [tab, setTab] = useState<"register" | "list">("list");
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminName, setAdminName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Restriction modal
  const [restrictionModal, setRestrictionModal] = useState<{
    isOpen: boolean;
    action: string;
  }>({ isOpen: false, action: "" });

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    
    try {
      // Authenticate with new auth API
      const authRes = await fetch("/api/auth-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });

      const authData = await authRes.json();

      if (authRes.status === 401 || !authData.success) {
        setAuthError(authData.error || "Kunci admin salah. Coba lagi.");
        setAuthLoading(false);
        return;
      }

      // Set role and name
      setAdminRole(authData.role);
      setAdminName(authData.name);
      setAuthed(true);

      // Fetch list
      const res = await fetch("/api/list", {
        headers: { "x-admin-key": adminKey },
      });
      const json = await res.json();
      setList(json.data || []);
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

  const showRestriction = (action: string) => {
    setRestrictionModal({ isOpen: true, action });
  };

  const handleRegister = async () => {
    if (adminRole !== 'superadmin') {
      showRestriction('mendaftarkan QRIS baru');
      return;
    }

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
      
      if (res.status === 403) {
        showRestriction('mendaftarkan QRIS baru');
        setRegLoading(false);
        return;
      }

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
    if (adminRole !== 'superadmin') {
      showRestriction('menonaktifkan QRIS');
      return;
    }

    if (!confirm("Nonaktifkan QRIS ini?")) return;
    
    const res = await fetch("/api/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();
    
    if (res.status === 403) {
      showRestriction('menonaktifkan QRIS');
      return;
    }

    fetchList();
  };

  const handleActivate = async (id: string) => {
    if (adminRole !== 'superadmin') {
      showRestriction('mengaktifkan QRIS');
      return;
    }

    if (!confirm("Aktifkan kembali QRIS ini?")) return;
    
    const res = await fetch("/api/list", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ id, action: "activate" }),
    });
    
    const json = await res.json();
    
    if (res.status === 403) {
      showRestriction('mengaktifkan QRIS');
      return;
    }

    if (json.success) {
      alert(json.message);
      fetchList();
    }
  };

  const handleDeletePermanent = async (id: string, merchantName: string) => {
    if (adminRole !== 'superadmin') {
      showRestriction('menghapus QRIS secara permanen');
      return;
    }

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
    
    if (res.status === 403) {
      showRestriction('menghapus QRIS secara permanen');
      return;
    }

    if (json.success) {
      alert(json.message);
      fetchList();
    } else {
      alert("Gagal menghapus: " + json.error);
    }
  };

  const openEditModal = (qris: QRISEntry) => {
    if (adminRole !== 'superadmin') {
      showRestriction('mengedit data QRIS');
      return;
    }

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

      if (res.status === 403) {
        closeEditModal();
        showRestriction('mengedit data QRIS');
        setEditLoading(false);
        return;
      }

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
          <title>Dashboard Admin — DecoQ</title>
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
                Dashboard Admin
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
                "Masuk Dashboard"
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
        <title>Dashboard Admin — DecoQ</title>
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
                Dashboard
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span
                  className={`tag ${adminRole === 'superadmin' ? 'tag-success' : 'tag-neutral'}`}
                  style={{
                    fontSize: "0.7rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {adminRole === 'superadmin' ? (
                    <>
                      <Crown size={12} />
                      Superadmin
                    </>
                  ) : (
                    <>
                      <Eye size={12} />
                      Admin (View Only)
                    </>
                  )}
                </span>
              </div>
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
          <button
            onClick={() => setTab("list")}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "10px",
              cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              fontSize: "0.88rem",
              transition: "all 0.2s",
              background:
                tab === "list"
                  ? "linear-gradient(135deg, #fff985, #ffe940)"
                  : "rgba(255,255,255,0.06)",
              color: tab === "list" ? "#1a1a2e" : "rgba(255,255,255,0.6)",
              border: tab === "list" ? "none" : "1px solid rgba(255,249,133,0.2)",
            }}
          >
            Daftar QRIS ({list.filter((q) => q.is_active).length})
          </button>
          
          <button
            onClick={() => {
              if (adminRole !== 'superadmin') {
                showRestriction('mengakses halaman registrasi QRIS');
                return;
              }
              setTab("register");
            }}
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "10px",
              cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              fontSize: "0.88rem",
              transition: "all 0.2s",
              background:
                tab === "register"
                  ? "linear-gradient(135deg, #fff985, #ffe940)"
                  : "rgba(255,255,255,0.06)",
              color: tab === "register" ? "#1a1a2e" : "rgba(255,255,255,0.6)",
              border: tab === "register" ? "none" : "1px solid rgba(255,249,133,0.2)",
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: adminRole !== 'superadmin' ? 0.5 : 1
            }}
          >
            {adminRole !== 'superadmin' && <Lock size={14} />}
            + Daftarkan QRIS
          </button>
        </div>

        {/* Register Tab - SUPERADMIN ONLY */}
        {tab === "register" && adminRole === 'superadmin' && (
          <div className="glass" style={{ padding: "1.75rem" }}>
            {/* ... Register form content sama seperti admin.tsx ... */}
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
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Fitur ini akan ditambahkan di update berikutnya. Gunakan halaman admin lama untuk registrasi.
            </p>
            <Link href="/admin">
              <button className="btn-secondary" style={{ width: '100%' }}>
                Buka Panel Admin Lama
              </button>
            </Link>
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
                    isMenuOpen={openMenuId === q.id}
                    onMenuToggle={() => setOpenMenuId(openMenuId === q.id ? null : q.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Modal - same as admin.tsx but with role check */}
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
                {/* Edit modal content - copy from admin.tsx */}
                <p style={{ color: '#fff', textAlign: 'center' }}>Edit modal content here</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Restriction Modal */}
        <AnimatePresence>
          <RestrictionModal
            isOpen={restrictionModal.isOpen}
            onClose={() => setRestrictionModal({ isOpen: false, action: "" })}
            action={restrictionModal.action}
          />
        </AnimatePresence>
      </div>
    </>
  );
}
