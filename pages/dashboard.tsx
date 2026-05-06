import Head from "next/head";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  AlertTriangle,
  Database,
  Activity,
  TrendingUp,
  Users,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import VerificationLogsTable from "../components/VerificationLogsTable";
import AuditLogsTable from "../components/AuditLogsTable";
import QRISListItem from "../components/QRISListItem";
import RestrictionModal from "../components/RestrictionModal";

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

type DashboardStats = {
  total_qris: number;
  total_active_qris: number;
  total_verifications: number;
  successful_verifications: number;
  verifications_today: number;
  verifications_week: number;
  success_rate: number;
}

export default function DashboardNew() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminName, setAdminName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // QRIS List
  const [list, setList] = useState<QRISEntry[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Restriction modal
  const [restrictionModal, setRestrictionModal] = useState<{
    isOpen: boolean;
    action: string;
  }>({ isOpen: false, action: "" });

  const tryAuth = async () => {
    setAuthLoading(true);
    setAuthError("");
    
    try {
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

      setAdminRole(authData.role);
      setAdminName(authData.name);
      setAuthed(true);

      // Fetch initial data
      await Promise.all([
        fetchStats(),
        fetchList()
      ]);
    } catch {
      setAuthError("Gagal terhubung ke server.");
    }
    setAuthLoading(false);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/dashboard-stats", {
        headers: { "x-admin-key": adminKey },
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setStatsLoading(false);
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

  const showRestriction = (action: string) => {
    setRestrictionModal({ isOpen: true, action });
  };

  const handleLogout = () => {
    setAuthed(false);
    setAdminKey("");
    setAdminRole(null);
    setAdminName("");
    setStats(null);
    setList([]);
    setActiveTab("overview");
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

    if (res.status === 403) {
      showRestriction('menonaktifkan QRIS');
      return;
    }

    fetchList();
    fetchStats();
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
    
    if (res.status === 403) {
      showRestriction('mengaktifkan QRIS');
      return;
    }

    const json = await res.json();
    if (json.success) {
      alert(json.message);
      fetchList();
      fetchStats();
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

    if (res.status === 403) {
      showRestriction('menghapus QRIS secara permanen');
      return;
    }

    const json = await res.json();
    if (json.success) {
      alert(json.message);
      fetchList();
      fetchStats();
    } else {
      alert("Gagal menghapus: " + json.error);
    }
  };

  const openEditModal = (qris: QRISEntry) => {
    if (adminRole !== 'superadmin') {
      showRestriction('mengedit data QRIS');
      return;
    }
    // TODO: Implement edit modal
    alert('Edit modal coming soon!');
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

      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          adminRole={adminRole!}
          adminName={adminName}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: 280,
          padding: '2rem',
          minHeight: '100vh'
        }}
        className="dashboard-main"
        >
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 style={{ 
                  color: '#fff', 
                  fontWeight: 800, 
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>
                  Dashboard Overview
                </h1>
                <p style={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: '0.95rem',
                  marginBottom: '2rem'
                }}>
                  Selamat datang kembali, {adminName}! 👋
                </p>

                {/* Stats Cards */}
                {statsLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </div>
                ) : stats && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    <StatCard
                      title="Total QRIS"
                      value={stats.total_active_qris}
                      subtitle={`${stats.total_qris} total (termasuk nonaktif)`}
                      icon={Database}
                      color="blue"
                    />
                    <StatCard
                      title="Total Verifikasi"
                      value={stats.total_verifications}
                      subtitle={`${stats.verifications_today} hari ini`}
                      icon={Activity}
                      color="purple"
                    />
                    <StatCard
                      title="Success Rate"
                      value={`${stats.success_rate}%`}
                      subtitle={`${stats.successful_verifications} berhasil`}
                      icon={TrendingUp}
                      color="green"
                    />
                    <StatCard
                      title="Minggu Ini"
                      value={stats.verifications_week}
                      subtitle="Verifikasi 7 hari terakhir"
                      icon={Users}
                      color="yellow"
                    />
                  </div>
                )}

                {/* Quick Info */}
                <div className="glass" style={{ 
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginTop: '2rem'
                }}>
                  <h3 style={{ 
                    color: '#fff', 
                    fontWeight: 700, 
                    fontSize: '1.1rem',
                    marginBottom: '1rem'
                  }}>
                    Quick Actions
                  </h3>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('qris')}
                      style={{ width: '100%' }}
                    >
                      View QRIS Database
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('verification')}
                      style={{ width: '100%' }}
                    >
                      View Verification Logs
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setActiveTab('audit')}
                      style={{ width: '100%' }}
                    >
                      View Audit Logs
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* QRIS Database Tab */}
            {activeTab === 'qris' && (
              <motion.div
                key="qris"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 style={{ 
                  color: '#fff', 
                  fontWeight: 800, 
                  fontSize: '2rem',
                  marginBottom: '0.5rem'
                }}>
                  QRIS Database
                </h1>
                <p style={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: '0.95rem',
                  marginBottom: '2rem'
                }}>
                  Kelola semua QRIS yang terdaftar
                </p>

                {/* Search */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    className="input-glass"
                    placeholder="Cari merchant atau ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* List */}
                {listLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {searchTerm ? 'Tidak ada hasil' : 'Belum ada QRIS'}
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    overflow: 'visible',
                    position: 'relative'
                  }}>
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
              </motion.div>
            )}

            {/* Verification Logs Tab */}
            {activeTab === 'verification' && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <VerificationLogsTable adminKey={adminKey} />
              </motion.div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AuditLogsTable adminKey={adminKey} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Restriction Modal */}
      <AnimatePresence>
        <RestrictionModal
          isOpen={restrictionModal.isOpen}
          onClose={() => setRestrictionModal({ isOpen: false, action: "" })}
          action={restrictionModal.action}
        />
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0 !important;
            padding: 5rem 1rem 1rem 1rem !important;
          }
        }
      `}</style>
    </>
  );
}
