import Head from "next/head";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
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
import ManageAdminTab from "../components/ManageAdminTab";
import RegisterQRISTab from "../components/RegisterQRISTab";
import EditQRISModal from "../components/EditQRISModal";

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
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [sessionToken, setSessionToken] = useState("");

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

  // Edit modal
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    qris: QRISEntry | null;
  }>({ isOpen: false, qris: null });

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Get user role from users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, full_name, email, is_active')
        .eq('auth_user_id', session.user.id)
        .single();

      if (error || !userData) {
        alert('User tidak ditemukan dalam sistem');
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      if (!userData.is_active) {
        alert('Akun Anda tidak aktif. Hubungi administrator.');
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      setAdminRole(userData.role as AdminRole);
      setAdminName(userData.full_name || userData.email);
      setAdminEmail(userData.email);
      setSessionToken(session.access_token);
      setAuthed(true);

      // Fetch initial data
      await Promise.all([
        fetchStats(session.access_token),
        fetchList(session.access_token)
      ]);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (token?: string) => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/dashboard-stats", {
        headers: { 
          "Authorization": `Bearer ${token || sessionToken}`
        },
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

  const fetchList = async (token?: string) => {
    setListLoading(true);
    try {
      console.log('🔍 Fetching QRIS list...')
      const res = await fetch("/api/list", {
        headers: { 
          "Authorization": `Bearer ${token || sessionToken}`
        },
      });
      console.log('📡 Response status:', res.status)
      const json = await res.json();
      console.log('📦 Response data:', json)
      
      if (!res.ok) {
        console.error('❌ API error:', json.error)
      }
      
      setList(json.data || []);
      console.log('✅ QRIS list loaded:', json.data?.length || 0, 'items')
    } catch (error) {
      console.error('❌ Fetch list error:', error)
    }
    setListLoading(false);
  };

  const showRestriction = (action: string) => {
    setRestrictionModal({ isOpen: true, action });
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...')
      
      // Sign out from Supabase (this should clear the session)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Logout error:', error)
      } else {
        console.log('✅ Logout successful')
      }
      
      // Clear ALL Supabase-related items from localStorage
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = []
        
        // Find all keys that start with 'sb-'
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key)
          }
        }
        
        // Remove all Supabase keys
        keysToRemove.forEach(key => {
          console.log('🗑️ Removing:', key)
          localStorage.removeItem(key)
        })
        
        // Also clear specific auth token
        localStorage.removeItem('sb-auth-token')
        
        console.log('✅ LocalStorage cleared')
      }
      
      // Clear local state
      setAuthed(false)
      setAdminRole(null)
      setAdminName('')
      setAdminEmail('')
      setSessionToken('')
      
      console.log('✅ Local state cleared')
      
      // Small delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect to login with cache buster
      router.push('/auth/login?t=' + Date.now())
    } catch (err) {
      console.error('❌ Logout exception:', err)
      
      // Force clear localStorage even on error
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
      
      // Force redirect
      router.push('/auth/login?t=' + Date.now())
    }
  };

  const handleDeactivate = async (id: string) => {
    if (adminRole !== 'superadmin') {
      showRestriction('menonaktifkan QRIS');
      return;
    }

    if (!confirm("Nonaktifkan QRIS ini?")) return;
    
    const res = await fetch("/api/list", {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${sessionToken}`
      },
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
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${sessionToken}`
      },
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
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${sessionToken}`
      },
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
    setEditModal({ isOpen: true, qris });
  };

  const filtered = list.filter(
    (q) =>
      q.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.merchant_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Loading screen
  if (loading) {
    return (
      <>
        <Head>
          <title>Dashboard Admin — DecoQ</title>
        </Head>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </>
    );
  }

  // Not authed (should not reach here due to redirect)
  if (!authed) {
    return null;
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

            {/* Register QRIS Tab */}
            {activeTab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <RegisterQRISTab 
                  sessionToken={sessionToken}
                  currentUser={{
                    email: adminEmail,
                    full_name: adminName,
                    role: adminRole!
                  }}
                  onSuccess={() => {
                    // Refresh stats and list after successful registration
                    fetchStats();
                    fetchList();
                    // Switch to QRIS Database tab
                    setActiveTab('qris');
                  }}
                />
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
                <VerificationLogsTable sessionToken={sessionToken} />
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
                <AuditLogsTable sessionToken={sessionToken} />
              </motion.div>
            )}

            {/* Manage Admin Tab (Superadmin Only) */}
            {activeTab === 'manage-admin' && adminRole === 'superadmin' && (
              <motion.div
                key="manage-admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ManageAdminTab sessionToken={sessionToken} />
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

      {/* Edit QRIS Modal */}
      <EditQRISModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, qris: null })}
        qris={editModal.qris}
        sessionToken={sessionToken}
        onSuccess={() => {
          fetchList();
          fetchStats();
        }}
      />

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
