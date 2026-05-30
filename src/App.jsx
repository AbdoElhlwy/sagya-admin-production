import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'https://sagya-backend.onrender.com/api';

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ─── API Helper ───────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const token = localStorage.getItem('sagya_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data, endpoint: path };
  return data;
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  const msg = error.message || 'خطأ غير معروف';
  const status = error.status || '?';
  const endpoint = error.endpoint || '';
  const isAuth = status === 401;
  const isNotFound = status === 404;
  return (
    <div style={{ background: '#1a0a0a', border: '1px solid #c0392b', borderRadius: 8, padding: '16px 20px', margin: '12px 0', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#e74c3c', fontWeight: 700, marginBottom: 4 }}>
            {isAuth ? '⚠️ انتهت الجلسة' : isNotFound ? '🔍 المسار غير موجود' : '❌ فشل تحميل البيانات'}
          </div>
          {endpoint && <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>المسار: <code style={{ background: '#2a1a1a', padding: '1px 6px', borderRadius: 3 }}>{endpoint}</code></div>}
          <div style={{ color: '#ddd', fontSize: 13 }}>Status: {status} — {msg}</div>
          {isNotFound && <div style={{ color: '#f39c12', fontSize: 12, marginTop: 4 }}>السيرفر يعمل لكن هذا المسار غير موجود</div>}
          {isAuth && <div style={{ color: '#f39c12', fontSize: 12, marginTop: 4 }}>انتهت صلاحية الجلسة — يرجى تسجيل الدخول مجدداً</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {onRetry && <button onClick={onRetry} style={{ background: '#2980b9', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>↻ إعادة المحاولة</button>}
          <a href="https://sagya-backend.onrender.com/health" target="_blank" rel="noreferrer" style={{ background: '#27ae60', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 13, textDecoration: 'none' }}>🔍 فحص السيرفر</a>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  root: { fontFamily: "'Tajawal','Segoe UI',sans-serif", direction: 'rtl', background: '#0f1117', minHeight: '100vh', color: '#e8ecf0' },
  sidebar: { width: 240, background: '#131720', borderLeft: '1px solid #1e2535', position: 'fixed', top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto' },
  sidebarHeader: { padding: '20px 16px 12px', borderBottom: '1px solid #1e2535' },
  navItem: (a) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: a ? 600 : 400, background: a ? '#1a3a5c' : 'transparent', color: a ? '#4fc3f7' : '#8899a6', margin: '1px 8px' }),
  main: { marginRight: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topbar: { background: '#131720', borderBottom: '1px solid #1e2535', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 },
  content: { padding: 24, flex: 1 },
  card: { background: '#131720', border: '1px solid #1e2535', borderRadius: 12, padding: 20 },
  statCard: { background: '#131720', border: '1px solid #1e2535', borderRadius: 12, padding: '16px 20px' },
  grid: (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16 }),
  btn: (v = 'primary') => ({ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: v === 'primary' ? '#1565c0' : v === 'danger' ? '#c62828' : v === 'success' ? '#2e7d32' : v === 'warning' ? '#e65100' : '#1e2535', color: '#fff' }),
  input: { background: '#0f1117', border: '1px solid #2a3a4a', borderRadius: 8, padding: '9px 14px', color: '#e8ecf0', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  select: { background: '#0f1117', border: '1px solid #2a3a4a', borderRadius: 8, padding: '9px 14px', color: '#e8ecf0', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'right', padding: '10px 14px', borderBottom: '1px solid #1e2535', color: '#546e7a', fontSize: 12, fontWeight: 600 },
  td: { padding: '11px 14px', borderBottom: '1px solid #0f1117', fontSize: 13 },
  badge: (c) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c === 'green' ? '#1b4332' : c === 'yellow' ? '#3d2b00' : c === 'red' ? '#3b0f0f' : c === 'blue' ? '#0d2137' : '#1e2535', color: c === 'green' ? '#4caf50' : c === 'yellow' ? '#ffc107' : c === 'red' ? '#ef5350' : c === 'blue' ? '#4fc3f7' : '#8899a6' }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#131720', border: '1px solid #1e2535', borderRadius: 16, padding: 28, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
};

// ─── Nav Config ───────────────────────────────────────────────────────────────
const navItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
  { id: 'users', label: 'المستخدمون', icon: '👥' },
  { id: 'admins', label: 'المشرفون والأدوار', icon: '🛡️' },
  { id: 'requests', label: 'طلبات التطوع', icon: '📋' },
  { id: 'volunteers', label: 'المتطوعون', icon: '🏅' },
  { id: 'tasks', label: 'المهام', icon: '✅' },
  { id: 'donations', label: 'التبرعات', icon: '💧' },
  { id: 'campaigns', label: 'الحملات', icon: '📢' },
  { id: 'payments', label: 'المدفوعات', icon: '💳' },
  { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
  { id: 'reports', label: 'التقارير', icon: '📈' },
  { id: 'qr', label: 'نظام QR', icon: '📲' },
  { id: 'files', label: 'إدارة الملفات', icon: '📁' },
  { id: 'locations', label: 'الخريطة والمواقع', icon: '🗺️' },
  { id: 'identity', label: 'التحقق من الهوية', icon: '🪪' },
  { id: 'nusuk', label: 'نسك — ضيوف الرحمن', icon: '🕌' },
  { id: 'nafath', label: 'إعدادات نفاذ', icon: '🔐' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return <div style={{ textAlign: 'center', padding: 40, color: '#546e7a' }}>⏳ جاري التحميل...</div>;
}

// ─── Page wrapper with fetch ──────────────────────────────────────────────────
function useFetch(endpoint, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await api(endpoint)); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [endpoint]);
  useEffect(() => { load(); }, deps);
  return { data, loading, error, reload: load };
}

// ═══════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('+966500000001');
  const [password, setPassword] = useState('Sagya@2024!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await api('/auth/admin-login', { method: 'POST', body: { phone, password } });
      localStorage.setItem('sagya_token', res.token || res.data?.token || '');
      localStorage.setItem('sagya_admin', JSON.stringify(res.admin || res.data?.admin || {}));
      onLogin(res.admin || res.data?.admin);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ ...S.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...S.card, width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💧</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#4fc3f7' }}>سقيا الحرمين</div>
          <div style={{ fontSize: 13, color: '#546e7a', marginTop: 4 }}>لوحة الإدارة</div>
        </div>
        <ErrorBanner error={error} />
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#8899a6' }}>رقم الهاتف</label>
            <input style={S.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966500000001" dir="ltr" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#8899a6' }}>كلمة المرور</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btn('primary'), width: '100%', padding: 12, fontSize: 15 }}>
            {loading ? '...' : 'تسجيل الدخول'}
          </button>
        </form>
        <div style={{ marginTop: 16, padding: 12, background: '#0f1117', borderRadius: 8, fontSize: 12, color: '#546e7a', textAlign: 'center' }}>
          هاتف: +966500000001 | كلمة السر: Sagya@2024!
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
function DashboardPage() {
  const { data, loading, error, reload } = useFetch('/admin/dashboard', []);
  const { data: statusData } = useFetch('/api/status', []);

  if (loading) return <Spinner />;

  const rawStats = data?.data || data?.data?.stats || data?.stats || {};
    const stats = {
      total_users: rawStats.totalUsers ?? rawStats.total_users,
      total_volunteers: rawStats.totalVolunteers ?? rawStats.total_volunteers,
      approved_volunteers: rawStats.approvedVolunteers ?? rawStats.approved_volunteers,
      pending_requests: rawStats.pendingRequests ?? rawStats.pending_requests,
      donations_today: rawStats.todayDonations ?? rawStats.donations_today,
      total_donations: rawStats.totalDonations ?? rawStats.total_donations,
      open_tasks: rawStats.openTasks ?? rawStats.open_tasks,
      completed_tasks: rawStats.completedTasks ?? rawStats.completed_tasks,
      active_campaigns: rawStats.activeCampaigns ?? rawStats.active_campaigns,
      notifications_sent: rawStats.notificationsSent ?? rawStats.notifications_sent,
    };
  const services = statusData?.status || {};

  const statItems = [
    { label: 'المستخدمون', value: stats.total_users ?? '—', icon: '👥', color: '#1565c0' },
    { label: 'المتطوعون', value: stats.total_volunteers ?? '—', icon: '🏅', color: '#2e7d32' },
    { label: 'معتمدون', value: stats.approved_volunteers ?? '—', icon: '✅', color: '#1b5e20' },
    { label: 'طلبات جديدة', value: stats.pending_requests ?? '—', icon: '📋', color: '#e65100' },
    { label: 'تبرعات اليوم', value: stats.donations_today ?? '—', icon: '💧', color: '#00695c' },
    { label: 'إجمالي التبرعات', value: stats.total_donations ?? '—', icon: '💰', color: '#4a148c' },
    { label: 'مهام مفتوحة', value: stats.open_tasks ?? '—', icon: '📌', color: '#bf360c' },
    { label: 'مهام مكتملة', value: stats.completed_tasks ?? '—', icon: '🎯', color: '#1b5e20' },
    { label: 'حملات نشطة', value: stats.active_campaigns ?? '—', icon: '📢', color: '#0d47a1' },
    { label: 'إشعارات مرسلة', value: stats.notifications_sent ?? '—', icon: '🔔', color: '#37474f' },
  ];

  const svcColor = (s) => s === 'ok' || s === 'configured' || s === 'cloudinary' ? 'green' : s === 'sandbox' || s === 'local' ? 'yellow' : 'red';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>📊 لوحة التحكم</h2>
        <button onClick={reload} style={S.btn('primary')}>↻ تحديث</button>
      </div>
      <ErrorBanner error={error} onRetry={reload} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {statItems.map(s => (
          <div key={s.label} style={{ ...S.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '4px 0' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#546e7a' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#8899a6' }}>⚡ حالة الخدمات</h3>
          {[
            ['قاعدة البيانات', services.database || 'unknown'],
            ['SMS', services.sms || 'unknown'],
            ['الدفع', services.payment || 'unknown'],
            ['Firebase', services.firebase || 'unknown'],
            ['التخزين', services.storage || 'unknown'],
            ['السيرفر', services.server || 'ok'],
          ].map(([name, val]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2535' }}>
              <span style={{ fontSize: 13 }}>{name}</span>
              <span style={S.badge(svcColor(val))}>{val}</span>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#8899a6' }}>📅 أحدث الأنشطة</h3>
          {(data?.data?.recentActivity || data?.data?.recent_activity || data?.recent_activity || []).length === 0
            ? <div style={{ color: '#546e7a', fontSize: 13 }}>لا توجد أنشطة حديثة</div>
            : (data?.data?.recentActivity || data?.data?.recent_activity || data?.recent_activity || []).slice(0, 8).map((a, i) => (
              <div key={i} style={{ fontSize: 12, color: '#8899a6', padding: '6px 0', borderBottom: '1px solid #1e2535' }}>
                <span style={{ color: '#e8ecf0' }}>{a.action || a.message}</span>
                {a.created_at && <span style={{ marginRight: 8, color: '#546e7a' }}>{new Date(a.created_at).toLocaleString('ar')}</span>}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// USERS PAGE
// ═══════════════════════════════════════════════════════════════════════
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api(`/users?${params}`);
      setUsers(res.data?.users || res.users || res.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (u) => {
    try {
      await api(`/users/${u.id}/status`, { method: 'PATCH', body: { status: u.status === 'active' ? 'inactive' : 'active' } });
      load();
    } catch (e) { alert(e.message); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try { await api(`/users/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { alert(e.message); }
  };

  const saveUser = async () => {
    try {
      if (modal === 'create') await api('/users', { method: 'POST', body: form });
      else await api(`/users/${form.id}`, { method: 'PATCH', body: form });
      setModal(null); setForm({});
      load();
    } catch (e) { alert(e.message); }
  };

  const roleBadge = (r) => r === 'super_admin' ? 'red' : r === 'admin' ? 'blue' : r === 'supervisor' ? 'yellow' : r === 'volunteer' ? 'green' : 'grey';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>👥 المستخدمون</h2>
        <button onClick={() => { setForm({}); setModal('create'); }} style={S.btn('success')}>+ إضافة مستخدم</button>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input style={{ ...S.input, width: 260 }} placeholder="بحث بالاسم أو الهاتف أو البريد..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={S.select} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">جميع الأدوار</option>
          <option value="user">مستخدم</option>
          <option value="volunteer">متطوع</option>
          <option value="supervisor">مشرف</option>
          <option value="admin">أدمن</option>
          <option value="super_admin">أدمن رئيسي</option>
        </select>
        <select style={S.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">معطل</option>
          <option value="suspended">موقوف</option>
        </select>
        <button onClick={load} style={S.btn()}>🔍 بحث</button>
      </div>

      {loading ? <Spinner /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>
                {['#', 'الاسم', 'الهاتف', 'البريد', 'الدور', 'الحالة', 'آخر دخول', 'إجراءات'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد نتائج</td></tr>}
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}><strong>{u.name}</strong></td>
                  <td style={{ ...S.td, direction: 'ltr' }}>{u.phone}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}><span style={S.badge(roleBadge(u.role))}>{u.role}</span></td>
                  <td style={S.td}><span style={S.badge(u.status === 'active' ? 'green' : 'red')}>{u.status}</span></td>
                  <td style={S.td}>{u.last_login ? new Date(u.last_login).toLocaleDateString('ar') : '—'}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setForm(u); setModal('edit'); }} style={{ ...S.btn(), padding: '4px 10px', fontSize: 12 }}>✏️</button>
                      <button onClick={() => toggleStatus(u)} style={{ ...S.btn(u.status === 'active' ? 'warning' : 'success'), padding: '4px 10px', fontSize: 12 }}>{u.status === 'active' ? '🔒' : '🔓'}</button>
                      <button onClick={() => deleteUser(u.id)} style={{ ...S.btn('danger'), padding: '4px 10px', fontSize: 12 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modalBox}>
            <h3 style={{ margin: '0 0 20px' }}>{modal === 'create' ? 'إضافة مستخدم' : 'تعديل مستخدم'}</h3>
            {['name', 'phone', 'email'].map(f => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>{f === 'name' ? 'الاسم' : f === 'phone' ? 'الهاتف' : 'البريد'}</label>
                <input style={S.input} value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              </div>
            ))}
            {modal === 'create' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>كلمة المرور</label>
                <input style={S.input} type="password" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>الدور</label>
              <select style={{ ...S.select, width: '100%' }} value={form.role || 'user'} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="user">مستخدم</option>
                <option value="volunteer">متطوع</option>
                <option value="supervisor">مشرف</option>
                <option value="admin">أدمن</option>
                <option value="super_admin">أدمن رئيسي</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={S.btn()}>إلغاء</button>
              <button onClick={saveUser} style={S.btn('success')}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ADMINS & ROLES PAGE
// ═══════════════════════════════════════════════════════════════════════
function AdminsPage() {
  const { data, loading, error, reload } = useFetch('/admin/audit-logs', []);
  const roles = [
    { name: 'super_admin', label: 'أدمن رئيسي', color: 'red', perms: ['كل الصلاحيات'] },
    { name: 'admin', label: 'مدير', color: 'blue', perms: ['إدارة المستخدمين', 'إدارة المتطوعين', 'إدارة المهام', 'إدارة التبرعات', 'التقارير'] },
    { name: 'supervisor', label: 'مشرف', color: 'yellow', perms: ['مشاهدة المتطوعين', 'إدارة المهام', 'مشاهدة التقارير'] },
    { name: 'viewer', label: 'مشاهد', color: 'grey', perms: ['مشاهدة فقط — لا صلاحيات تعديل'] },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>🛡️ المشرفون والأدوار</h2>
      <ErrorBanner error={error} onRetry={reload} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {roles.map(r => (
          <div key={r.name} style={{ ...S.card, borderTop: `3px solid ${r.color === 'red' ? '#c62828' : r.color === 'blue' ? '#1565c0' : r.color === 'yellow' ? '#f57f17' : '#546e7a'}` }}>
            <span style={S.badge(r.color)}>{r.label}</span>
            <div style={{ marginTop: 12 }}>
              {r.perms.map(p => <div key={p} style={{ fontSize: 12, color: '#8899a6', padding: '4px 0' }}>• {p}</div>)}
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>📜 سجل عمليات المشرفين</h3>
        {loading ? <Spinner /> : (
          <table style={S.table}>
            <thead>
              <tr>{['المشرف', 'العملية', 'النوع', 'الوقت'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {(data?.data?.logs || data?.logs || []).slice(0, 20).map((log, i) => (
                <tr key={i}>
                  <td style={S.td}>{log.admin_name || log.user_id || '—'}</td>
                  <td style={S.td}>{log.action}</td>
                  <td style={S.td}><span style={S.badge('blue')}>{log.resource_type || '—'}</span></td>
                  <td style={S.td}>{new Date(log.created_at).toLocaleString('ar')}</td>
                </tr>
              ))}
              {(data?.data?.logs || data?.logs || []).length === 0 && (
                <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد سجلات</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VOLUNTEER REQUESTS PAGE
// ═══════════════════════════════════════════════════════════════════════
function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionModal, setActionModal] = useState(null);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api('/volunteer-requests');
      setRequests(res.data?.requests || res.requests || res.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try {
      const res = await api(`/volunteer-requests/${id}/approve`, { method: 'PATCH' });
      setSuccess(`✅ تم القبول! رقم العضوية: ${res.data?.membership_number || res.membership_number || '—'}`);
      setActionModal(null); load();
    } catch (e) { alert(e.message); }
  };

  const reject = async (id) => {
    try {
      await api(`/volunteer-requests/${id}/reject`, { method: 'PATCH', body: { reason: rejectReason } });
      setActionModal(null); setRejectReason(''); load();
    } catch (e) { alert(e.message); }
  };

  const statusColor = (s) => s === 'approved' ? 'green' : s === 'pending' ? 'yellow' : s === 'rejected' ? 'red' : 'grey';
  const statusLabel = (s) => s === 'approved' ? 'مقبول' : s === 'pending' ? 'قيد المراجعة' : s === 'rejected' ? 'مرفوض' : s === 'info_required' ? 'يحتاج معلومات' : s;

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>📋 طلبات التطوع</h2>
      <ErrorBanner error={error} onRetry={load} />
      {success && <div style={{ background: '#1b4332', border: '1px solid #2e7d32', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#4caf50' }}>{success} <button onClick={() => setSuccess('')} style={{ float: 'left', background: 'none', border: 'none', color: '#4caf50', cursor: 'pointer' }}>✕</button></div>}

      {loading ? <Spinner /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{['#', 'الاسم', 'الهاتف', 'المدينة', 'الجنسية', 'الحالة', 'التاريخ', 'إجراءات'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {requests.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد طلبات</td></tr>}
              {requests.map((r, i) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(r)}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}><strong>{r.name || r.full_name}</strong></td>
                  <td style={{ ...S.td, direction: 'ltr' }}>{r.phone}</td>
                  <td style={S.td}>{r.city || '—'}</td>
                  <td style={S.td}>{r.nationality || '—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(r.status))}>{statusLabel(r.status)}</span></td>
                  <td style={S.td}>{new Date(r.created_at).toLocaleDateString('ar')}</td>
                  <td style={S.td} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status === 'pending' && <>
                        <button onClick={() => { setSelected(r); setActionModal('approve'); }} style={{ ...S.btn('success'), padding: '4px 10px', fontSize: 12 }}>✅ قبول</button>
                        <button onClick={() => { setSelected(r); setActionModal('reject'); }} style={{ ...S.btn('danger'), padding: '4px 10px', fontSize: 12 }}>❌ رفض</button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && actionModal === 'approve' && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setActionModal(null)}>
          <div style={S.modalBox}>
            <h3>تأكيد قبول الطلب</h3>
            <p style={{ color: '#8899a6' }}>هل تريد قبول طلب <strong>{selected.name || selected.full_name}</strong>؟ سيتم إنشاء رقم عضوية وبطاقة QR تلقائياً.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setActionModal(null)} style={S.btn()}>إلغاء</button>
              <button onClick={() => approve(selected.id)} style={S.btn('success')}>✅ تأكيد القبول</button>
            </div>
          </div>
        </div>
      )}

      {selected && actionModal === 'reject' && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setActionModal(null)}>
          <div style={S.modalBox}>
            <h3>رفض الطلب</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#8899a6' }}>سبب الرفض</label>
              <textarea style={{ ...S.input, height: 90, resize: 'vertical' }} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="اكتب سبب الرفض..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setActionModal(null)} style={S.btn()}>إلغاء</button>
              <button onClick={() => reject(selected.id)} style={S.btn('danger')}>❌ تأكيد الرفض</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VOLUNTEERS PAGE
// ═══════════════════════════════════════════════════════════════════════
function VolunteersPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api('/volunteers');
      setVolunteers(res.data?.volunteers || res.volunteers || res.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor = (s) => s === 'active' ? 'green' : s === 'suspended' ? 'red' : s === 'pending' ? 'yellow' : 'grey';
  const statusLabel = (s) => s === 'active' ? 'معتمد' : s === 'suspended' ? 'موقوف' : s === 'pending' ? 'قيد المراجعة' : s === 'expired' ? 'منتهي' : s;

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>🏅 المتطوعون</h2>
      <ErrorBanner error={error} onRetry={load} />

      {loading ? <Spinner /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{['#', 'الاسم', 'رقم العضوية', 'الهاتف', 'المدينة', 'الحالة', 'النقاط', 'التقييم', 'إجراءات'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {volunteers.length === 0 && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا يوجد متطوعون</td></tr>}
              {volunteers.map((v, i) => (
                <tr key={v.id}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}><strong>{v.name || v.full_name}</strong></td>
                  <td style={{ ...S.td, fontFamily: 'monospace', color: '#4fc3f7' }}>{v.membership_number || '—'}</td>
                  <td style={{ ...S.td, direction: 'ltr' }}>{v.phone}</td>
                  <td style={S.td}>{v.city || '—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(v.status))}>{statusLabel(v.status)}</span></td>
                  <td style={S.td}>{v.points || 0}</td>
                  <td style={S.td}>{v.rating ? `⭐ ${v.rating}` : '—'}</td>
                  <td style={S.td}>
                    <button onClick={() => setSelected(v)} style={{ ...S.btn(), padding: '4px 10px', fontSize: 12 }}>🔍 الملف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={S.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>ملف المتطوع</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8899a6', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['الاسم', selected.name || selected.full_name], ['رقم العضوية', selected.membership_number], ['الهاتف', selected.phone], ['المدينة', selected.city], ['الجنسية', selected.nationality], ['الحالة', selected.status], ['النقاط', selected.points], ['التقييم', selected.rating]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#546e7a', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#e8ecf0' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <a href={`${API_BASE}/volunteers/${selected.id}/card`} target="_blank" rel="noreferrer" style={{ ...S.btn('primary'), textDecoration: 'none', fontSize: 12, padding: '6px 12px' }}>🪪 بطاقة رقمية</a>
              <a href={`${API_BASE}/qr/generate/${selected.id}`} target="_blank" rel="noreferrer" style={{ ...S.btn(), textDecoration: 'none', fontSize: 12, padding: '6px 12px' }}>📲 QR</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TASKS PAGE
// ═══════════════════════════════════════════════════════════════════════
function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api('/tasks');
      setTasks(res.data?.tasks || res.tasks || res.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTask = async () => {
    try {
      await api('/tasks', { method: 'POST', body: form });
      setModal(false); setForm({}); load();
    } catch (e) { alert(e.message); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api(`/tasks/${id}/status`, { method: 'PATCH', body: { status } });
      load();
    } catch (e) { alert(e.message); }
  };

  const taskTypes = ['توزيع مياه', 'توزيع زمزم', 'توزيع وجبات', 'إرشاد', 'دعم كبار السن', 'دعم ذوي الإعاقة', 'تنظيم', 'طوارئ', 'لوجستيات'];
  const statusColor = (s) => s === 'completed' ? 'green' : s === 'in_progress' ? 'blue' : s === 'pending' ? 'yellow' : s === 'cancelled' ? 'red' : 'grey';
  const statusLabel = (s) => s === 'completed' ? 'مكتملة' : s === 'in_progress' ? 'جارية' : s === 'pending' ? 'معلقة' : s === 'cancelled' ? 'ملغاة' : s;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>✅ المهام</h2>
        <button onClick={() => setModal(true)} style={S.btn('success')}>+ إضافة مهمة</button>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      {loading ? <Spinner /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{['#', 'عنوان المهمة', 'النوع', 'الموقع', 'التاريخ', 'الحالة', 'الأولوية', 'إجراءات'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tasks.length === 0 && <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد مهام</td></tr>}
              {tasks.map((t, i) => (
                <tr key={t.id}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}><strong>{t.title}</strong></td>
                  <td style={S.td}>{t.type || '—'}</td>
                  <td style={S.td}>{t.location || '—'}</td>
                  <td style={S.td}>{t.scheduled_date ? new Date(t.scheduled_date).toLocaleDateString('ar') : '—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(t.status))}>{statusLabel(t.status)}</span></td>
                  <td style={S.td}><span style={S.badge(t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'yellow' : 'grey')}>{t.priority || 'عادية'}</span></td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {t.status === 'pending' && <button onClick={() => updateStatus(t.id, 'in_progress')} style={{ ...S.btn('primary'), padding: '3px 8px', fontSize: 11 }}>▶ بدء</button>}
                      {t.status === 'in_progress' && <button onClick={() => updateStatus(t.id, 'completed')} style={{ ...S.btn('success'), padding: '3px 8px', fontSize: 11 }}>✓ إنهاء</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <h3 style={{ margin: '0 0 20px' }}>إضافة مهمة جديدة</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>عنوان المهمة</label>
              <input style={S.input} value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>نوع المهمة</label>
              <select style={{ ...S.select, width: '100%' }} value={form.type || ''} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="">اختر النوع</option>
                {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {[['location', 'الموقع'], ['scheduled_date', 'التاريخ والوقت']].map(([f, l]) => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>{l}</label>
                <input style={S.input} type={f === 'scheduled_date' ? 'datetime-local' : 'text'} value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>الأولوية</label>
              <select style={{ ...S.select, width: '100%' }} value={form.priority || 'normal'} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">منخفضة</option>
                <option value="normal">عادية</option>
                <option value="high">عالية</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>تعليمات المهمة</label>
              <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={form.instructions || ''} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={S.btn()}>إلغاء</button>
              <button onClick={createTask} style={S.btn('success')}>💾 إنشاء المهمة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// DONATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════
function DonationsPage() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api('/donations');
      setDonations(res.data?.donations || res.donations || res.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const donationTypes = ['مياه', 'زمزم', 'وجبات ساخنة', 'وجبات جافة', 'تمر', 'عصائر', 'دعم مالي', 'دعم عيني', 'دعم لوجستي'];
  const statusColor = (s) => s === 'received' || s === 'distributed' ? 'green' : s === 'pending' ? 'yellow' : s === 'cancelled' ? 'red' : 'grey';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>💧 التبرعات</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`${API_BASE}/reports/export/donations`} target="_blank" rel="noreferrer" style={{ ...S.btn(), textDecoration: 'none', fontSize: 13 }}>📥 تصدير CSV</a>
          <button onClick={() => setModal(true)} style={S.btn('success')}>+ تبرع يدوي</button>
        </div>
      </div>
      <ErrorBanner error={error} onRetry={load} />

      {loading ? <Spinner /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{['#', 'المتبرع', 'النوع', 'الكمية', 'المبلغ', 'المدينة', 'الحالة', 'التتبع', 'إجراءات'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {donations.length === 0 && <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد تبرعات</td></tr>}
              {donations.map((d, i) => (
                <tr key={d.id}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.td}>{d.donor_name || d.user_name || '—'}</td>
                  <td style={S.td}>{d.type || '—'}</td>
                  <td style={S.td}>{d.quantity || '—'}</td>
                  <td style={S.td}>{d.amount ? `${d.amount} ر.س` : '—'}</td>
                  <td style={S.td}>{d.city || '—'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(d.status))}>{d.status || '—'}</span></td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{d.tracking_number || '—'}</td>
                  <td style={S.td}>
                    <a href={`${API_BASE}/donations/${d.id}/receipt`} target="_blank" rel="noreferrer" style={{ ...S.btn(), textDecoration: 'none', fontSize: 11, padding: '3px 8px' }}>🧾</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <h3 style={{ margin: '0 0 20px' }}>تبرع يدوي</h3>
            {[['donor_name', 'اسم المتبرع'], ['phone', 'الهاتف'], ['amount', 'المبلغ'], ['quantity', 'الكمية'], ['city', 'المدينة']].map(([f, l]) => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>{l}</label>
                <input style={S.input} value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>نوع التبرع</label>
              <select style={{ ...S.select, width: '100%' }} value={form.type || ''} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="">اختر النوع</option>
                {donationTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={S.btn()}>إلغاء</button>
              <button onClick={async () => { try { await api('/donations', { method: 'POST', body: form }); setModal(false); setForm({}); load(); } catch (e) { alert(e.message); } }} style={S.btn('success')}>💾 حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGNS PAGE
// ═══════════════════════════════════════════════════════════════════════
function CampaignsPage() {
  const { data, loading, error, reload } = useFetch('/campaigns', []);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const campaigns = data?.data?.campaigns || data?.campaigns || data?.data || [];

  const create = async () => {
    try { await api('/campaigns', { method: 'POST', body: form }); setModal(false); setForm({}); reload(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>📢 الحملات</h2>
        <button onClick={() => setModal(true)} style={S.btn('success')}>+ حملة جديدة</button>
      </div>
      <ErrorBanner error={error} onRetry={reload} />

      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {campaigns.length === 0 && <div style={{ ...S.card, gridColumn: '1/-1', textAlign: 'center', color: '#546e7a' }}>لا توجد حملات</div>}
          {campaigns.map(c => {
            const pct = c.financial_goal > 0 ? Math.min(100, Math.round((c.total_raised || 0) / c.financial_goal * 100)) : 0;
            return (
              <div key={c.id} style={{ ...S.card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>{c.title}</h3>
                  <span style={S.badge(c.status === 'active' ? 'green' : c.status === 'ended' ? 'grey' : 'yellow')}>{c.status}</span>
                </div>
                <div style={{ fontSize: 12, color: '#546e7a', marginBottom: 12 }}>{c.description}</div>
                {c.financial_goal > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{c.total_raised || 0} ر.س</span><span>{c.financial_goal} ر.س</span>
                    </div>
                    <div style={{ background: '#1e2535', borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${pct}%`, background: '#1565c0', borderRadius: 4, height: 6 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#4fc3f7', marginTop: 3 }}>{pct}% مكتمل</div>
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#546e7a' }}>
                  {c.start_date && `من ${new Date(c.start_date).toLocaleDateString('ar')}`}
                  {c.end_date && ` إلى ${new Date(c.end_date).toLocaleDateString('ar')}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={S.modalBox}>
            <h3 style={{ margin: '0 0 20px' }}>حملة جديدة</h3>
            {[['title', 'عنوان الحملة'], ['description', 'الوصف'], ['financial_goal', 'الهدف المالي'], ['start_date', 'تاريخ البداية'], ['end_date', 'تاريخ النهاية']].map(([f, l]) => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>{l}</label>
                <input style={S.input} type={f.includes('date') ? 'date' : f === 'financial_goal' ? 'number' : 'text'} value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={S.btn()}>إلغاء</button>
              <button onClick={create} style={S.btn('success')}>💾 إنشاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAYMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════
function PaymentsPage() {
  const { data, loading, error, reload } = useFetch('/payments', []);
  const payments = data?.data?.payments || data?.payments || data?.data || [];
  const statusColor = (s) => s === 'paid' || s === 'success' ? 'green' : s === 'pending' ? 'yellow' : s === 'failed' || s === 'refunded' ? 'red' : 'grey';

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>💳 المدفوعات</h2>
      <div style={{ background: '#3d2b00', border: '1px solid #f57f17', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#ffc107' }}>
        ⚠️ وضع Sandbox — لا توجد مفاتيح دفع حقيقية مكونة. للتفعيل: أضف MOYASAR_API_KEY أو HYPERPAY_API_KEY في متغيرات البيئة.
      </div>
      <ErrorBanner error={error} onRetry={reload} />

      {loading ? <Spinner /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{['رقم العملية', 'المتبرع', 'المزود', 'المبلغ', 'العملة', 'الحالة', 'التاريخ'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {payments.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد مدفوعات</td></tr>}
              {payments.map((p, i) => (
                <tr key={p.id || i}>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{p.transaction_id || p.id}</td>
                  <td style={S.td}>{p.donor_name || '—'}</td>
                  <td style={S.td}><span style={S.badge('blue')}>{p.provider || 'sandbox'}</span></td>
                  <td style={S.td}>{p.amount} {p.currency || 'SAR'}</td>
                  <td style={S.td}>{p.currency || 'SAR'}</td>
                  <td style={S.td}><span style={S.badge(statusColor(p.status))}>{p.status}</span></td>
                  <td style={S.td}>{p.created_at ? new Date(p.created_at).toLocaleDateString('ar') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, ...S.card }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>⚙️ بوابات الدفع المدعومة</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {['Moyasar', 'HyperPay', 'Tap', 'Stripe', 'Paymob'].map(g => (
            <div key={g} style={{ ...S.card, textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{g}</div>
              <div style={{ marginTop: 6 }}><span style={S.badge('yellow')}>Sandbox</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════
function NotificationsPage() {
  const { data, loading, error, reload } = useFetch('/notifications', []);
  const [form, setForm] = useState({ title: '', body: '', type: 'all' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');
  const notifications = data?.data?.notifications || data?.notifications || data?.data || [];

  const broadcast = async () => {
    setSending(true);
    try {
      await api('/notifications/broadcast', { method: 'POST', body: form });
      setSent('✅ تم إرسال الإشعار بنجاح');
      setForm({ title: '', body: '', type: 'all' });
      reload();
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>🔔 الإشعارات</h2>
      <ErrorBanner error={error} onRetry={reload} />
      {sent && <div style={{ background: '#1b4332', border: '1px solid #2e7d32', borderRadius: 8, padding: 12, marginBottom: 16, color: '#4caf50' }}>{sent}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>📤 إرسال إشعار</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>العنوان</label>
            <input style={S.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>نص الإشعار</label>
            <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>المستلمون</label>
            <select style={{ ...S.select, width: '100%' }} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="all">الجميع</option>
              <option value="volunteers">المتطوعون</option>
              <option value="donors">المتبرعون</option>
              <option value="admins">المشرفون</option>
            </select>
          </div>
          <button onClick={broadcast} disabled={sending} style={{ ...S.btn('primary'), width: '100%' }}>
            {sending ? '⏳ جاري الإرسال...' : '📤 إرسال'}
          </button>
          <div style={{ marginTop: 12, padding: 10, background: '#0f1117', borderRadius: 8, fontSize: 11, color: '#546e7a' }}>
            💡 Firebase Push يحتاج FIREBASE_PROJECT_ID — حالياً Mock
          </div>
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>📋 سجل الإشعارات</h3>
          {loading ? <Spinner /> : (
            <table style={S.table}>
              <thead>
                <tr>{['العنوان', 'المستلمون', 'الحالة', 'التاريخ'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {notifications.length === 0 && <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد إشعارات</td></tr>}
                {notifications.map((n, i) => (
                  <tr key={i}>
                    <td style={S.td}>{n.title}</td>
                    <td style={S.td}>{n.recipient_type || n.type || 'all'}</td>
                    <td style={S.td}><span style={S.badge(n.status === 'sent' ? 'green' : 'yellow')}>{n.status || 'sent'}</span></td>
                    <td style={S.td}>{n.created_at ? new Date(n.created_at).toLocaleDateString('ar') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════════
function ReportsPage() {
  const { data, loading, error, reload } = useFetch('/reports/summary', []);
  const summary = data?.data || data || {};

  const reportTypes = [
    { key: 'volunteers', label: 'تقرير المتطوعين', icon: '🏅' },
    { key: 'donations', label: 'تقرير التبرعات', icon: '💧' },
    { key: 'tasks', label: 'تقرير المهام', icon: '✅' },
    { key: 'campaigns', label: 'تقرير الحملات', icon: '📢' },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>📈 التقارير</h2>
      <ErrorBanner error={error} onRetry={reload} />

      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            ['المستخدمون', summary.total_users || '—', '👥'],
            ['المتطوعون', summary.total_volunteers || '—', '🏅'],
            ['التبرعات', summary.total_donations || '—', '💧'],
            ['المهام', summary.total_tasks || '—', '✅'],
          ].map(([l, v, ic]) => (
            <div key={l} style={S.statCard}>
              <div style={{ fontSize: 20 }}>{ic}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: 12, color: '#546e7a' }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {reportTypes.map(r => (
          <div key={r.key} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{r.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`${API_BASE}/reports/export/${r.key}`} target="_blank" rel="noreferrer" style={{ ...S.btn('primary'), textDecoration: 'none', fontSize: 12 }}>📥 CSV</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// QR PAGE
// ═══════════════════════════════════════════════════════════════════════
function QRPage() {
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const verify = async () => {
    if (!verifyCode.trim()) return;
    setVerifying(true); setVerifyResult(null); setVerifyError(null);
    try {
      const res = await api(`/qr/verify/${verifyCode.trim()}`);
      setVerifyResult(res.data || res);
    } catch (e) { setVerifyError(e); }
    finally { setVerifying(false); }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>📲 نظام QR</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>🔍 تحقق من QR</h3>
          <div style={{ marginBottom: 12 }}>
            <input style={S.input} placeholder="أدخل كود QR أو رقم العضوية..." value={verifyCode} onChange={e => setVerifyCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} dir="ltr" />
          </div>
          <button onClick={verify} disabled={verifying} style={{ ...S.btn('primary'), width: '100%' }}>{verifying ? '...' : '🔍 تحقق'}</button>
          <ErrorBanner error={verifyError} onRetry={verify} />
          {verifyResult && (
            <div style={{ marginTop: 16, padding: 16, background: '#0f1117', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>{verifyResult.name}</span>
                <span style={S.badge(verifyResult.is_valid ? 'green' : 'red')}>{verifyResult.is_valid ? '✅ معتمد' : '❌ غير معتمد'}</span>
              </div>
              {[['رقم العضوية', verifyResult.membership_number], ['الحالة', verifyResult.status], ['تاريخ الاعتماد', verifyResult.approved_at ? new Date(verifyResult.approved_at).toLocaleDateString('ar') : '—']].map(([l, v]) => (
                <div key={l} style={{ fontSize: 12, color: '#8899a6', padding: '3px 0' }}>{l}: <span style={{ color: '#e8ecf0' }}>{v || '—'}</span></div>
              ))}
            </div>
          )}
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>ℹ️ معلومات نظام QR</h3>
          <div style={{ fontSize: 13, color: '#8899a6', lineHeight: 1.8 }}>
            <p>• كل متطوع معتمد يحصل على QR فريد تلقائياً</p>
            <p>• يمكن إلغاء QR وإعادة إصداره</p>
            <p>• صفحة التحقق العامة: <a href={`https://sagya-backend.onrender.com/api/qr/verify/[code]`} style={{ color: '#4fc3f7' }} target="_blank" rel="noreferrer">qr/verify/:code</a></p>
            <p>• سجل كل عمليات المسح محفوظ</p>
            <p>• QR يحتوي: الاسم، الصورة، رقم العضوية، تاريخ الانتهاء</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FILES PAGE
// ═══════════════════════════════════════════════════════════════════════
function FilesPage() {
  const { data, loading, error, reload } = useFetch('/files', []);
  const files = data?.data?.files || data?.files || data?.data || [];

  const approve = async (id) => {
    try { await api(`/files/${id}/approve`, { method: 'PATCH' }); reload(); }
    catch (e) { alert(e.message); }
  };
  const reject = async (id) => {
    try { await api(`/files/${id}/reject`, { method: 'PATCH', body: { reason: 'مرفوض من الإدارة' } }); reload(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>📁 إدارة الملفات</h2>
      <div style={{ background: '#3d2b00', border: '1px solid #f57f17', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#ffc107' }}>
        ⚠️ تحذير: التخزين المحلي على Render مؤقت. يُنصح بتكوين Cloudinary لحفظ الملفات بشكل دائم.
      </div>
      <ErrorBanner error={error} onRetry={reload} />

      {loading ? <Spinner /> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>{['اسم الملف', 'النوع', 'الحجم', 'المالك', 'الحالة', 'التاريخ', 'إجراءات'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {files.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد ملفات</td></tr>}
              {files.map((f) => (
                <tr key={f.id}>
                  <td style={S.td}>{f.original_name || f.filename || '—'}</td>
                  <td style={S.td}>{f.file_type || f.type || '—'}</td>
                  <td style={S.td}>{f.file_size ? `${Math.round(f.file_size / 1024)} KB` : '—'}</td>
                  <td style={S.td}>{f.user_name || f.uploaded_by || '—'}</td>
                  <td style={S.td}><span style={S.badge(f.status === 'approved' ? 'green' : f.status === 'rejected' ? 'red' : 'yellow')}>{f.status || 'pending'}</span></td>
                  <td style={S.td}>{f.created_at ? new Date(f.created_at).toLocaleDateString('ar') : '—'}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {f.status !== 'approved' && <button onClick={() => approve(f.id)} style={{ ...S.btn('success'), padding: '3px 8px', fontSize: 11 }}>✅</button>}
                      {f.status !== 'rejected' && <button onClick={() => reject(f.id)} style={{ ...S.btn('danger'), padding: '3px 8px', fontSize: 11 }}>❌</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LOCATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════
function LocationsPage() {
  const { data, loading, error, reload } = useFetch('/locations/active-volunteers', []);
  const volunteers = data?.data?.volunteers || data?.volunteers || [];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>🗺️ الخريطة والمواقع</h2>
      <ErrorBanner error={error} onRetry={reload} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 15, color: '#8899a6', marginBottom: 8 }}>خريطة المتطوعين النشطين</div>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ ...S.btn('primary'), textDecoration: 'none', display: 'inline-block' }}>📍 فتح Google Maps</a>
        </div>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>👥 المتطوعون النشطون</h3>
          {loading ? <Spinner /> : (
            volunteers.length === 0
              ? <div style={{ color: '#546e7a', fontSize: 13 }}>لا يوجد متطوعون نشطون حالياً</div>
              : volunteers.map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2535', fontSize: 13 }}>
                  <span>{v.name}</span>
                  <span style={{ color: '#546e7a', fontSize: 11 }}>{v.last_seen ? new Date(v.last_seen).toLocaleTimeString('ar') : '—'}</span>
                </div>
              ))
          )}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 13, color: '#546e7a', lineHeight: 1.8 }}>
          <p>⚠️ لا يتم تتبع موقع المتطوع إلا بموافقته الصريحة</p>
          <p>• مواقع المهام تُرفع عند إنشاء المهمة</p>
          <p>• يمكن تسجيل بداية ونهاية المهمة</p>
          <p>• نقاط التوزيع تظهر على الخريطة</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// IDENTITY PAGE
// ═══════════════════════════════════════════════════════════════════════
function IdentityPage() {
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>🪪 التحقق من الهوية</h2>
      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
          {[['غير مكتمل', 'grey'], ['قيد المراجعة', 'yellow'], ['معتمد', 'green'], ['مرفوض', 'red'], ['منتهي', 'grey']].map(([l, c]) => (
            <div key={l} style={{ textAlign: 'center', padding: 16, background: '#0f1117', borderRadius: 10 }}>
              <div style={S.badge(c)}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: '#8899a6', lineHeight: 1.9 }}>
          <p>• المستندات المقبولة: الهوية الوطنية، الإقامة، الجواز، الصورة الشخصية</p>
          <p>• يتم مراجعة المستندات من قِبل المشرفين قبل اعتماد الطلب</p>
          <p>• تنبيه قبل انتهاء صلاحية الهوية بـ 30 يوم</p>
          <p>• OCR (القراءة التلقائية) متاح كخيار مستقبلي قابل للتفعيل</p>
          <p>• إدارة مستندات كل متطوع متاحة من صفحة المتطوعين → الملف الكامل</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// NUSUK PAGE
// ═══════════════════════════════════════════════════════════════════════
function NusukPage() {
  const [form, setForm] = useState({ permit_number: '', id_number: '', visitor_type: 'pilgrim' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const verify = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await api('/nusuk/verify', { method: 'POST', body: form });
      setResult(res.data || res);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>🕌 التحقق من ضيوف الرحمن — نسك</h2>
      <div style={{ background: '#0d2137', border: '1px solid #1565c0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#4fc3f7' }}>
        ℹ️ هذه الواجهة تعمل بـ Mock Provider حالياً. الربط الرسمي مع نسك يحتاج موافقات وAPI رسمي من وزارة الحج والعمرة.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>🔍 التحقق من الزائر</h3>
          {[['permit_number', 'رقم التصريح'], ['id_number', 'رقم الهوية / الجواز']].map(([f, l]) => (
            <div key={f} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>{l}</label>
              <input style={S.input} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} dir="ltr" />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>نوع الزائر</label>
            <select style={{ ...S.select, width: '100%' }} value={form.visitor_type} onChange={e => setForm(p => ({ ...p, visitor_type: e.target.value }))}>
              <option value="pilgrim">حاج</option>
              <option value="umrah">معتمر</option>
              <option value="visitor">زائر</option>
            </select>
          </div>
          <button onClick={verify} disabled={loading} style={{ ...S.btn('primary'), width: '100%' }}>{loading ? '...' : '🔍 تحقق'}</button>
          <ErrorBanner error={error} onRetry={verify} />
          {result && (
            <div style={{ marginTop: 16, padding: 12, background: '#0f1117', borderRadius: 8 }}>
              <span style={S.badge(result.status === 'approved' ? 'green' : 'red')}>{result.status_label || result.status}</span>
              <div style={{ marginTop: 8, fontSize: 12, color: '#8899a6' }}>{result.name && `الاسم: ${result.name}`}</div>
            </div>
          )}
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>📋 سجل عمليات التحقق</h3>
          <NusukLogs />
        </div>
      </div>
    </div>
  );
}

function NusukLogs() {
  const { data, loading } = useFetch('/nusuk/logs', []);
  const logs = data?.data?.logs || data?.logs || [];
  if (loading) return <Spinner />;
  return (
    <table style={S.table}>
      <thead><tr>{['رقم التصريح', 'النوع', 'الحالة', 'التاريخ'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>
        {logs.length === 0 && <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#546e7a' }}>لا توجد سجلات</td></tr>}
        {logs.map((l, i) => (
          <tr key={i}>
            <td style={S.td}>{l.permit_number || '—'}</td>
            <td style={S.td}>{l.visitor_type || '—'}</td>
            <td style={S.td}><span style={S.badge(l.status === 'approved' ? 'green' : 'red')}>{l.status}</span></td>
            <td style={S.td}>{l.created_at ? new Date(l.created_at).toLocaleDateString('ar') : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// NAFATH PAGE
// ═══════════════════════════════════════════════════════════════════════
function NafathPage() {
  const [config, setConfig] = useState({ client_id: '', client_secret: '', callback_url: '', enabled: false });
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>🔐 إعدادات نفاذ</h2>
      <div style={{ background: '#0d2137', border: '1px solid #1565c0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#4fc3f7' }}>
        ℹ️ نفاذ (Nafath) هو نظام التحقق الوطني السعودي. الربط يحتاج تسجيلاً رسمياً مع النظام. الحالة الحالية: Mock.
      </div>
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <label style={{ fontSize: 14 }}>تفعيل نفاذ</label>
          <input type="checkbox" checked={config.enabled} onChange={e => setConfig(p => ({ ...p, enabled: e.target.checked }))} style={{ width: 18, height: 18 }} />
          <span style={S.badge(config.enabled ? 'yellow' : 'grey')}>{config.enabled ? 'Mock' : 'Disabled'}</span>
        </div>
        {[['client_id', 'Client ID'], ['client_secret', 'Client Secret'], ['callback_url', 'Callback URL']].map(([f, l]) => (
          <div key={f} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>{l}</label>
            <input style={S.input} value={config[f]} onChange={e => setConfig(p => ({ ...p, [f]: e.target.value }))} dir="ltr" placeholder={f === 'callback_url' ? 'https://...' : ''} />
          </div>
        ))}
        <button style={S.btn('primary')}>💾 حفظ الإعدادات</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════
function SettingsPage() {
  const { data, loading, error, reload } = useFetch('/settings', []);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const s = data.data?.settings || data.settings || data.data || {};
      if (Array.isArray(s)) {
        const obj = {};
        s.forEach(item => { obj[item.key] = item.value; });
        setForm(obj);
      } else setForm(s);
    }
  }, [data]);

  const save = async () => {
    try {
      await api('/settings', { method: 'PATCH', body: form });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert(e.message); }
  };

  const sections = [
    { title: 'عام', fields: [['app_name', 'اسم التطبيق'], ['app_version', 'رقم الإصدار'], ['support_email', 'بريد الدعم'], ['privacy_url', 'رابط الخصوصية'], ['terms_url', 'رابط الشروط']] },
    { title: 'SMS', fields: [['sms_provider', 'مزود SMS'], ['sms_sender', 'اسم المرسل']] },
    { title: 'Maps', fields: [['maps_api_key', 'Google Maps API Key']] },
    { title: 'QR', fields: [['qr_expiry_days', 'مدة صلاحية QR (أيام)'], ['qr_type', 'نوع QR الافتراضي']] },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>⚙️ الإعدادات</h2>
      <ErrorBanner error={error} onRetry={reload} />
      {saved && <div style={{ background: '#1b4332', border: '1px solid #2e7d32', borderRadius: 8, padding: 12, marginBottom: 16, color: '#4caf50' }}>✅ تم حفظ الإعدادات</div>}

      {loading ? <Spinner /> : sections.map(sec => (
        <div key={sec.title} style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#4fc3f7' }}>{sec.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {sec.fields.map(([f, l]) => (
              <div key={f}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8899a6' }}>{l}</label>
                <input style={S.input} value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} dir="ltr" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={save} style={{ ...S.btn('success'), padding: '10px 24px', fontSize: 15 }}>💾 حفظ جميع الإعدادات</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════════
const pages = {
  dashboard: DashboardPage,
  users: UsersPage,
  admins: AdminsPage,
  requests: RequestsPage,
  volunteers: VolunteersPage,
  tasks: TasksPage,
  donations: DonationsPage,
  campaigns: CampaignsPage,
  payments: PaymentsPage,
  notifications: NotificationsPage,
  reports: ReportsPage,
  qr: QRPage,
  files: FilesPage,
  locations: LocationsPage,
  identity: IdentityPage,
  nusuk: NusukPage,
  nafath: NafathPage,
  settings: SettingsPage,
};

export default function App() {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sagya_admin')); } catch { return null; }
  });
  const [page, setPage] = useState('dashboard');

  const logout = () => {
    localStorage.removeItem('sagya_token');
    localStorage.removeItem('sagya_admin');
    setAdmin(null);
  };

  if (!admin || !localStorage.getItem('sagya_token')) {
    return <LoginPage onLogin={(a) => setAdmin(a)} />;
  }

  const PageComponent = pages[page] || DashboardPage;
  const currentNav = navItems.find(n => n.id === page);

  return (
    <AuthContext.Provider value={{ admin, logout }}>
      <div style={S.root}>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;800&display=swap" rel="stylesheet" />

        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#4fc3f7' }}>💧 سقيا الحرمين</div>
            <div style={{ fontSize: 11, color: '#546e7a', marginTop: 2 }}>لوحة الإدارة</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {navItems.map(item => (
              <div key={item.id} style={S.navItem(page === item.id)} onClick={() => setPage(item.id)}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2535' }}>
            <div style={{ fontSize: 12, color: '#546e7a', marginBottom: 6 }}>{admin?.name || admin?.phone || 'المشرف'}</div>
            <button onClick={logout} style={{ ...S.btn('danger'), width: '100%', padding: '7px', fontSize: 12 }}>تسجيل الخروج</button>
          </div>
        </div>

        {/* Main */}
        <div style={S.main}>
          <div style={S.topbar}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {currentNav?.icon} {currentNav?.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={S.badge('green')}>● متصل</span>
              <span style={{ fontSize: 13, color: '#546e7a' }}>{admin?.name || admin?.phone}</span>
              <span style={S.badge('blue')}>{admin?.role || 'admin'}</span>
            </div>
          </div>
          <div style={S.content}>
            <PageComponent />
          </div>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
