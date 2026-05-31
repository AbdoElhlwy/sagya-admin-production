import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — single source of truth
// ─────────────────────────────────────────────────────────────────────────────
const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://sagya-backend-production.onrender.com/api';

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('sagya_token');
  const url = `${API_URL}${endpoint}`;

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  let res;
  try {
    res = await fetch(url, config);
  } catch (_) {
    const err = new Error('فشل الاتصال بالسيرفر — تحقق من اتصال الإنترنت');
    err.status = 0;
    err.endpoint = endpoint;
    throw err;
  }

  let data;
  try {
    data = await res.json();
  } catch (_) {
    const err = new Error('رد غير صالح من السيرفر');
    err.status = res.status;
    err.endpoint = endpoint;
    throw err;
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('sagya_token');
      localStorage.removeItem('sagya_refresh_token');
      localStorage.removeItem('sagya_user');
      window.location.reload();
    }
    const err = new Error(data.message || `خطأ ${res.status}`);
    err.status = res.status;
    err.endpoint = endpoint;
    err.data = data;
    throw err;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────
function useFetch(endpoint, enabled = true) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const endpointRef = useRef(endpoint);
  endpointRef.current = endpoint;

  const load = useCallback(async () => {
    if (!enabled) { setState(s => ({ ...s, loading: false })); return; }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiRequest(endpointRef.current);
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: e });
    }
  }, [enabled]);

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:         '#0A0E0A',
  bgCard:     '#0F1510',
  bgSide:     '#080C08',
  border:     '#1A2A1A',
  borderLight:'#243424',
  green:      '#1B6B3A',
  greenLight: '#2D9B55',
  greenGlow:  '#3DBB6A',
  gold:       '#C9A84C',
  goldLight:  '#E8C96A',
  ivory:      '#F5F0E8',
  ivoryDim:   '#B8B0A0',
  white:      '#FFFFFF',
  error:      '#8B2020',
  errorLight: '#C0392B',
  warn:       '#7A5200',
  warnLight:  '#E67E00',
  textPrimary:'#EAE8E0',
  textSecond: '#8A9080',
  textDim:    '#506050',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
`;

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const globalCSS = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body {
    font-family: 'Noto Naskh Arabic', 'Segoe UI', sans-serif;
    background: ${C.bg};
    color: ${C.textPrimary};
    direction: rtl;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.green}; border-radius: 3px; }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; }
  input, select, textarea { font-family: inherit; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .page-anim { animation: fadeIn 0.3s ease both; }
  .spin { animation: spin 0.9s linear infinite; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Spinner({ size = 20 }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={C.border} strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={C.greenGlow} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ErrorCard({ error, onRetry, compact = false }) {
  if (!error) return null;
  const is401 = error.status === 401;
  const is404 = error.status === 404;
  const isNet = error.status === 0;

  const title = is401 ? 'انتهت الجلسة' : is404 ? 'المسار غير موجود' : isNet ? 'فشل الاتصال' : 'خطأ في تحميل البيانات';
  const icon = is401 ? '🔐' : is404 ? '🔍' : isNet ? '📡' : '⚠️';

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.error}22, ${C.error}11)`,
      border: `1px solid ${C.error}55`,
      borderRadius: 10,
      padding: compact ? '10px 14px' : '16px 20px',
      margin: compact ? '8px 0' : '12px 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#E87070', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            {icon} {title}
          </div>
          {error.endpoint && (
            <div style={{ color: C.textDim, fontSize: 11, marginBottom: 3 }}>
              المسار:{' '}
              <code style={{ color: C.gold, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                {API_URL}{error.endpoint}
              </code>
            </div>
          )}
          <div style={{ color: C.ivoryDim, fontSize: 13 }}>
            {error.status ? `HTTP ${error.status} — ` : ''}{error.message}
          </div>
          {is404 && <div style={{ color: C.warnLight, fontSize: 12, marginTop: 4 }}>السيرفر يعمل لكن هذا المسار غير مُعرَّف</div>}
          {isNet && <div style={{ color: C.warnLight, fontSize: 12, marginTop: 4 }}>تأكد أن السيرفر لا يزال في وضع Sleep على Render</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {onRetry && (
            <button onClick={onRetry} style={btnStyle('primary', 'sm')}>↻ إعادة</button>
          )}
          <a
            href={`${API_URL.replace('/api', '')}/health`}
            target="_blank"
            rel="noreferrer"
            style={{ ...btnStyle('ghost', 'sm'), textAlign: 'center' }}
          >
            🔍 Health
          </a>
        </div>
      </div>
    </div>
  );
}

function Badge({ color = 'grey', children }) {
  const map = {
    green:  { bg: '#0D2E18', text: '#4CAF80', border: '#1B5E30' },
    yellow: { bg: '#2E1E00', text: '#FFB84D', border: '#5E3C00' },
    red:    { bg: '#2E0A0A', text: '#E57373', border: '#5E1A1A' },
    blue:   { bg: '#0A1A2E', text: '#64B5F6', border: '#1A3A5E' },
    gold:   { bg: '#2E1E00', text: C.gold,    border: '#5E3C00' },
    grey:   { bg: '#141A14', text: C.textSecond, border: C.border },
  };
  const t = map[color] || map.grey;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: t.bg,
      color: t.text,
      border: `1px solid ${t.border}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function btnStyle(variant = 'primary', size = 'md') {
  const base = {
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '9px 18px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 15 },
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`, color: '#fff' },
    gold:    { background: `linear-gradient(135deg, #7A5200, ${C.gold})`, color: '#fff' },
    danger:  { background: `linear-gradient(135deg, ${C.error}, ${C.errorLight})`, color: '#fff' },
    ghost:   { background: 'transparent', color: C.textSecond, border: `1px solid ${C.border}` },
    outline: { background: 'transparent', color: C.greenLight, border: `1px solid ${C.green}` },
  };
  return { ...base, ...sizes[size], ...variants[variant] };
}

function Btn({ variant = 'primary', size = 'md', onClick, children, disabled, style = {}, ...rest }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...btnStyle(variant, size), opacity: disabled ? 0.5 : 1, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '', dir }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>{label}</div>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        style={{
          width: '100%',
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          color: C.textPrimary,
          fontSize: 14,
          outline: 'none',
        }}
      />
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function PageTitle({ icon, title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ivory }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon = '📭', message = 'لا توجد بيانات' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: C.textDim }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <Spinner size={32} />
    </div>
  );
}

function Table({ cols, rows, emptyMessage }) {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
            {cols.map(c => (
              <th key={c.key || c.label} style={{ textAlign: 'right', padding: '10px 14px', color: C.textDim, fontSize: 12, fontWeight: 600 }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              {cols.map(c => (
                <td key={c.key || c.label} style={{ padding: '11px 14px', fontSize: 13, color: C.textPrimary }}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: C.bgCard, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: 28, width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ivory }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textSecond, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FutureServiceCard({ icon, title, description }) {
  return (
    <Card style={{ textAlign: 'center', padding: '36px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: C.ivory }}>{title}</h3>
      <p style={{ fontSize: 13, color: C.textSecond, lineHeight: 1.7 }}>{description}</p>
      <div style={{ marginTop: 16 }}>
        <Badge color="yellow">قيد التطوير</Badge>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',    label: 'لوحة التحكم',         icon: '◈' },
  { id: 'users',        label: 'المستخدمون',           icon: '◉' },
  { id: 'requests',     label: 'طلبات التطوع',         icon: '◎' },
  { id: 'volunteers',   label: 'المتطوعون',            icon: '◆' },
  { id: 'tasks',        label: 'المهام',               icon: '◇' },
  { id: 'donations',    label: 'التبرعات',             icon: '◈' },
  { id: 'campaigns',    label: 'الحملات',              icon: '◉' },
  { id: 'payments',     label: 'المدفوعات',            icon: '◎' },
  { id: 'notifications',label: 'الإشعارات',            icon: '◆' },
  { id: 'reports',      label: 'التقارير',             icon: '◇' },
  { id: 'qr',           label: 'QR التحقق',           icon: '◈' },
  { id: 'files',        label: 'الملفات',              icon: '◉' },
  { id: 'identity',     label: 'التحقق من الهوية',    icon: '◎' },
  { id: 'nusuk',        label: 'نسك — ضيوف الرحمن', icon: '◆' },
  { id: 'nafath',       label: 'نفاذ',                icon: '◇' },
  { id: 'settings',     label: 'الإعدادات',           icon: '⚙' },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) { setError('يرجى إدخال رقم الهاتف وكلمة المرور'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/auth/admin-login', {
        method: 'POST',
        body: { phone: phone.trim(), password },
      });
      const token       = res.token       || res.data?.token;
      const refreshToken= res.refreshToken|| res.data?.refreshToken || '';
      const user        = res.user        || res.data?.user        || {};
      if (!token) throw new Error('لم يُستلم توكن من السيرفر');
      localStorage.setItem('sagya_token',         token);
      localStorage.setItem('sagya_refresh_token', refreshToken);
      localStorage.setItem('sagya_user',          JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      const status = err.status;
      if (status === 401) setError('بيانات الدخول غير صحيحة');
      else if (status === 0)  setError('فشل الاتصال بالسيرفر — قد يكون في وضع Sleep، انتظر 30 ثانية وأعد المحاولة');
      else if (status === 404) setError(`المسار غير موجود: ${API_URL}/auth/admin-login`);
      else setError(err.message || 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(ellipse at 30% 20%, ${C.green}18 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${C.gold}0A 0%, transparent 60%), ${C.bg}`,
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 0 32px ${C.green}44`,
          }}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <path d="M19 4C19 4 8 14 8 22C8 28.6 13 33 19 33C25 33 30 28.6 30 22C30 14 19 4Z" fill="white" opacity="0.9"/>
              <path d="M19 4C19 4 8 14 8 22" stroke="white" strokeWidth="1.5" opacity="0.5"/>
              <circle cx="19" cy="22" r="4" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.ivory, marginBottom: 6, letterSpacing: '-0.5px' }}>
            سقيا الحرمين
          </h1>
          <p style={{ fontSize: 13, color: C.textSecond }}>لوحة إدارة المتطوعين والتبرعات</p>
        </div>

        {/* Form */}
        <div style={{
          background: C.bgCard,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 16,
          padding: 28,
          boxShadow: `0 20px 60px rgba(0,0,0,0.4)`,
        }}>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>رقم الهاتف</div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+966500000001"
                dir="ltr"
                autoComplete="username"
                style={{
                  width: '100%',
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: '11px 14px',
                  color: C.textPrimary,
                  fontSize: 15,
                  outline: 'none',
                  letterSpacing: '0.5px',
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>كلمة المرور</div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: '11px 14px',
                  color: C.textPrimary,
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                background: `${C.error}22`,
                border: `1px solid ${C.error}66`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                color: '#E87070',
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnStyle('primary', 'lg'),
                width: '100%',
                opacity: loading ? 0.7 : 1,
                background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
                boxShadow: loading ? 'none' : `0 4px 16px ${C.green}44`,
              }}
            >
              {loading ? <><Spinner size={18} /> جاري التحقق...</> : 'دخول'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, color: C.textDim, fontSize: 12 }}>
          سقيا الحرمين © {new Date().getFullYear()} — لوحة الإدارة
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { data, loading, error, reload } = useFetch('/admin/dashboard');
  const healthUrl = API_URL.replace('/api', '') + '/api/status';
  const [statusData, setStatusData] = useState(null);
  useEffect(() => {
    fetch(healthUrl).then(r => r.ok ? r.json() : null).then(d => d && setStatusData(d)).catch(() => {});
  }, [healthUrl]);

  const raw = data?.data || {};
  const stats = {
    total_users:       raw.totalUsers       ?? raw.total_users       ?? 0,
    total_volunteers:  raw.totalVolunteers  ?? raw.total_volunteers  ?? 0,
    approved_volunteers:raw.approvedVolunteers??raw.approved_volunteers??0,
    pending_requests:  raw.pendingRequests  ?? raw.pending_requests  ?? 0,
    donations_today:   raw.todayDonations   ?? raw.donations_today   ?? 0,
    total_donations:   raw.totalDonations   ?? raw.total_donations   ?? 0,
    open_tasks:        raw.openTasks        ?? raw.open_tasks        ?? 0,
    completed_tasks:   raw.completedTasks   ?? raw.completed_tasks   ?? 0,
    active_campaigns:  raw.activeCampaigns  ?? raw.active_campaigns  ?? 0,
    notifications_sent:raw.notificationsSent?? raw.notifications_sent?? 0,
  };

  const svc = statusData?.status || {};

  const statCards = [
    { label: 'المستخدمون',      value: stats.total_users,        color: C.greenLight, icon: '◉' },
    { label: 'المتطوعون',       value: stats.total_volunteers,   color: C.gold,       icon: '◆' },
    { label: 'معتمدون',         value: stats.approved_volunteers,color: C.greenGlow,  icon: '◈' },
    { label: 'طلبات جديدة',     value: stats.pending_requests,   color: '#E67E00',    icon: '◎' },
    { label: 'تبرعات اليوم',    value: `${stats.donations_today} ر.س`, color: C.greenLight, icon: '◉' },
    { label: 'إجمالي التبرعات', value: `${stats.total_donations} ر.س`, color: C.gold,  icon: '◆' },
    { label: 'مهام مفتوحة',     value: stats.open_tasks,         color: '#E67E00',    icon: '◈' },
    { label: 'مهام مكتملة',     value: stats.completed_tasks,    color: C.greenGlow,  icon: '◎' },
    { label: 'حملات نشطة',      value: stats.active_campaigns,   color: C.greenLight, icon: '◉' },
    { label: 'إشعارات مرسلة',   value: stats.notifications_sent, color: C.textSecond, icon: '◆' },
  ];

  const svcItems = [
    ['قاعدة البيانات', svc.database],
    ['SMS',            svc.sms],
    ['الدفع',          svc.payment],
    ['Firebase',       svc.firebase],
    ['التخزين',        svc.storage],
  ];

  const svcColor = v => v === 'ok' || v === 'configured' || v === 'cloudinary' ? 'green' : v === 'sandbox' || v === 'local' ? 'yellow' : 'grey';

  const activity = raw.recentActivity || raw.recent_activity || [];

  return (
    <div className="page-anim">
      <PageTitle
        icon="◈"
        title="لوحة التحكم"
        action={<Btn onClick={reload} variant="outline" size="sm">↻ تحديث</Btn>}
      />

      <ErrorCard error={error} onRetry={reload} />

      {loading && !data ? <Loading /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
            {statCards.map(s => (
              <div key={s.label} style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '16px 14px',
                borderTop: `2px solid ${s.color}`,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ fontSize: 24, color: s.color, marginBottom: 6, opacity: 0.6 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.ivory, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚡ حالة الخدمات
              </h3>
              {svcItems.map(([name, val]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13 }}>{name}</span>
                  <Badge color={svcColor(val)}>{val || 'unknown'}</Badge>
                </div>
              ))}
            </Card>

            <Card>
              <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 14 }}>📅 آخر الأنشطة</h3>
              {activity.length === 0
                ? <EmptyState icon="📭" message="لا توجد أنشطة حديثة" />
                : activity.slice(0, 7).map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                    <span style={{ color: C.textPrimary }}>{a.title || a.action || a.message || '—'}</span>
                    <span style={{ color: C.textDim }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('ar') : ''}</span>
                  </div>
                ))
              }
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function UsersPage() {
  const { data, loading, error, reload } = useFetch('/users');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const users = (data?.data?.users || data?.users || data?.data || [])
    .filter(u => !search || (u.name||'').includes(search) || (u.phone||'').includes(search));

  const roleColor = r => r === 'super_admin' ? 'red' : r === 'admin' ? 'blue' : r === 'supervisor' ? 'yellow' : r === 'volunteer' ? 'green' : 'grey';

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'create') await apiRequest('/users', { method: 'POST', body: form });
      else await apiRequest(`/users/${form.id}`, { method: 'PATCH', body: form });
      setModal(null); setForm({}); reload();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggleStatus = async u => {
    try {
      await apiRequest(`/users/${u.id}/status`, { method: 'PATCH', body: { status: u.status === 'active' ? 'inactive' : 'active' } });
      reload();
    } catch (e) { alert(e.message); }
  };

  const cols = [
    { label: '#',       render: (_, i) => i + 1 },
    { label: 'الاسم',  render: u => <strong>{u.name}</strong> },
    { label: 'الهاتف', render: u => <span style={{ direction: 'ltr', display: 'inline-block' }}>{u.phone}</span> },
    { label: 'الدور',  render: u => <Badge color={roleColor(u.role)}>{u.role}</Badge> },
    { label: 'الحالة', render: u => <Badge color={u.status === 'active' ? 'green' : 'red'}>{u.status === 'active' ? 'نشط' : 'معطل'}</Badge> },
    {
      label: 'إجراءات',
      render: u => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn variant="ghost" size="sm" onClick={() => { setForm(u); setModal('edit'); }}>✏️</Btn>
          <Btn variant={u.status === 'active' ? 'gold' : 'outline'} size="sm" onClick={() => toggleStatus(u)}>
            {u.status === 'active' ? '🔒' : '🔓'}
          </Btn>
        </div>
      ),
    },
  ];

  const rows = users.map((u, i) => ({ ...u, _i: i }));
  const colsWithIndex = cols.map(c => c.label === '#' ? { ...c, render: (u) => u._i + 1 } : c);

  return (
    <div className="page-anim">
      <PageTitle icon="◉" title="المستخدمون"
        action={<Btn size="sm" onClick={() => { setForm({}); setModal('create'); }}>+ إضافة</Btn>}
      />
      <ErrorCard error={error} onRetry={reload} />
      <Card>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            style={{ ...{ width: 260, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', color: C.textPrimary, fontSize: 13 } }}
          />
        </div>
        {loading ? <Loading /> : (
          <Table cols={colsWithIndex} rows={rows} emptyMessage="لا يوجد مستخدمون" />
        )}
      </Card>

      <Modal open={!!modal} onClose={() => { setModal(null); setForm({}); }} title={modal === 'create' ? 'إضافة مستخدم' : 'تعديل مستخدم'}>
        {['name', 'phone', 'email'].map(f => (
          <Input key={f}
            label={f === 'name' ? 'الاسم' : f === 'phone' ? 'الهاتف' : 'البريد'}
            value={form[f] || ''}
            onChange={v => setForm(p => ({ ...p, [f]: v }))}
            dir={f !== 'name' ? 'ltr' : undefined}
          />
        ))}
        {modal === 'create' && (
          <Input label="كلمة المرور" type="password" value={form.password || ''} onChange={v => setForm(p => ({ ...p, password: v }))} />
        )}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>الدور</div>
          <select value={form.role || 'user'} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.textPrimary, fontSize: 14 }}>
            {['user','volunteer','supervisor','admin','super_admin'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'جاري الحفظ...' : '💾 حفظ'}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEER REQUESTS
// ─────────────────────────────────────────────────────────────────────────────
function RequestsPage() {
  const { data, loading, error, reload } = useFetch('/volunteer-requests');
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState('');
  const [doing, setDoing] = useState(false);

  const requests = data?.data?.requests || data?.requests || data?.data || [];

  const approve = async id => {
    setDoing(true);
    try {
      const res = await apiRequest(`/volunteer-requests/${id}/approve`, { method: 'PATCH' });
      const num = res.data?.membership_number || res.membership_number || '—';
      setSuccess(`✅ تم قبول الطلب — رقم العضوية: ${num}`);
      setAction(null); reload();
    } catch (e) { alert(e.message); }
    finally { setDoing(false); }
  };

  const reject = async id => {
    setDoing(true);
    try {
      await apiRequest(`/volunteer-requests/${id}/reject`, { method: 'PATCH', body: { reason } });
      setAction(null); setReason(''); reload();
    } catch (e) { alert(e.message); }
    finally { setDoing(false); }
  };

  const statusColor = s => s === 'approved' ? 'green' : s === 'pending' ? 'yellow' : s === 'rejected' ? 'red' : 'grey';
  const statusLabel = s => ({ approved: 'مقبول', pending: 'قيد المراجعة', rejected: 'مرفوض', info_required: 'يحتاج معلومات' }[s] || s);

  const cols = [
    { label: 'الاسم',    render: r => <strong>{r.name || r.full_name}</strong> },
    { label: 'الهاتف',   render: r => <span style={{ direction: 'ltr', display: 'inline-block' }}>{r.phone}</span> },
    { label: 'المدينة',  key: 'city' },
    { label: 'الجنسية',  key: 'nationality' },
    { label: 'الحالة',   render: r => <Badge color={statusColor(r.status)}>{statusLabel(r.status)}</Badge> },
    { label: 'التاريخ',  render: r => new Date(r.created_at).toLocaleDateString('ar') },
    {
      label: 'إجراءات',
      render: r => r.status === 'pending' ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" onClick={() => { setSelected(r); setAction('approve'); }}>✅ قبول</Btn>
          <Btn variant="danger" size="sm" onClick={() => { setSelected(r); setAction('reject'); }}>❌ رفض</Btn>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◎" title="طلبات التطوع" />
      <ErrorCard error={error} onRetry={reload} />
      {success && (
        <div style={{ background: '#0D2E18', border: `1px solid ${C.green}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: C.greenGlow, display: 'flex', justifyContent: 'space-between' }}>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: C.greenGlow, cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <Card>
        {loading ? <Loading /> : <Table cols={cols} rows={requests} emptyMessage="لا توجد طلبات" />}
      </Card>

      <Modal open={action === 'approve'} onClose={() => setAction(null)} title="تأكيد القبول">
        <p style={{ color: C.textSecond, marginBottom: 20, lineHeight: 1.6 }}>
          هل تريد قبول طلب <strong style={{ color: C.ivory }}>{selected?.name || selected?.full_name}</strong>؟<br />
          سيتم إنشاء رقم عضوية وبطاقة QR تلقائياً.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setAction(null)}>إلغاء</Btn>
          <Btn onClick={() => approve(selected?.id)} disabled={doing}>{doing ? '...' : '✅ تأكيد'}</Btn>
        </div>
      </Modal>

      <Modal open={action === 'reject'} onClose={() => setAction(null)} title="رفض الطلب">
        <Input label="سبب الرفض" value={reason} onChange={setReason} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setAction(null)}>إلغاء</Btn>
          <Btn variant="danger" onClick={() => reject(selected?.id)} disabled={doing}>{doing ? '...' : '❌ رفض'}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOLUNTEERS
// ─────────────────────────────────────────────────────────────────────────────
function VolunteersPage() {
  const { data, loading, error, reload } = useFetch('/volunteers');
  const [selected, setSelected] = useState(null);
  const volunteers = data?.data?.volunteers || data?.volunteers || data?.data || [];
  const statusColor = s => s === 'active' ? 'green' : s === 'suspended' ? 'red' : s === 'pending' ? 'yellow' : 'grey';

  const cols = [
    { label: 'الاسم',         render: v => <strong>{v.name || v.full_name}</strong> },
    { label: 'رقم العضوية',   render: v => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: C.gold }}>{v.membership_number || '—'}</span> },
    { label: 'الهاتف',        render: v => <span style={{ direction: 'ltr', display: 'inline-block' }}>{v.phone}</span> },
    { label: 'المدينة',       key: 'city' },
    { label: 'الحالة',        render: v => <Badge color={statusColor(v.status)}>{v.status}</Badge> },
    { label: 'النقاط',        render: v => v.points || 0 },
    { label: 'إجراءات',       render: v => <Btn variant="ghost" size="sm" onClick={() => setSelected(v)}>🔍 الملف</Btn> },
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◆" title="المتطوعون" />
      <ErrorCard error={error} onRetry={reload} />
      <Card>
        {loading ? <Loading /> : <Table cols={cols} rows={volunteers} emptyMessage="لا يوجد متطوعون بعد" />}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="ملف المتطوع">
        {selected && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['الاسم', selected.name || selected.full_name],
                ['رقم العضوية', selected.membership_number],
                ['الهاتف', selected.phone],
                ['المدينة', selected.city],
                ['الجنسية', selected.nationality],
                ['النقاط', selected.points],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, color: C.textDim, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 14 }}>{v || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`${API_URL}/volunteers/${selected.id}/card`} target="_blank" rel="noreferrer" style={btnStyle('outline', 'sm')}>🪪 البطاقة</a>
              <a href={`${API_URL}/qr/generate/${selected.id}`} target="_blank" rel="noreferrer" style={btnStyle('ghost', 'sm')}>📲 QR</a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────
function TasksPage() {
  const { data, loading, error, reload } = useFetch('/tasks');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const tasks = data?.data?.tasks || data?.tasks || data?.data || [];

  const statusColor = s => s === 'completed' ? 'green' : s === 'in_progress' ? 'blue' : s === 'open' || s === 'pending' ? 'yellow' : 'red';
  const statusLabel = s => ({ completed: 'مكتملة', in_progress: 'جارية', open: 'مفتوحة', pending: 'معلقة', cancelled: 'ملغاة' }[s] || s);

  const updateStatus = async (id, status) => {
    try { await apiRequest(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }); reload(); }
    catch (e) { alert(e.message); }
  };

  const create = async () => {
    try { await apiRequest('/tasks', { method: 'POST', body: form }); setModal(false); setForm({}); reload(); }
    catch (e) { alert(e.message); }
  };

  const cols = [
    { label: 'المهمة',    render: t => <strong>{t.title}</strong> },
    { label: 'النوع',     key: 'type' },
    { label: 'الموقع',   key: 'location' },
    { label: 'الحالة',   render: t => <Badge color={statusColor(t.status)}>{statusLabel(t.status)}</Badge> },
    { label: 'الأولوية', render: t => <Badge color={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'yellow' : 'grey'}>{t.priority || 'عادية'}</Badge> },
    {
      label: 'إجراءات',
      render: t => (
        <div style={{ display: 'flex', gap: 4 }}>
          {(t.status === 'open' || t.status === 'pending') && <Btn size="sm" variant="outline" onClick={() => updateStatus(t.id, 'in_progress')}>▶ بدء</Btn>}
          {t.status === 'in_progress' && <Btn size="sm" onClick={() => updateStatus(t.id, 'completed')}>✓ إنهاء</Btn>}
        </div>
      ),
    },
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◇" title="المهام" action={<Btn size="sm" onClick={() => setModal(true)}>+ مهمة جديدة</Btn>} />
      <ErrorCard error={error} onRetry={reload} />
      <Card>
        {loading ? <Loading /> : <Table cols={cols} rows={tasks} emptyMessage="لا توجد مهام" />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="مهمة جديدة">
        <Input label="عنوان المهمة" value={form.title || ''} onChange={v => setForm(p => ({ ...p, title: v }))} />
        <Input label="الموقع" value={form.location || ''} onChange={v => setForm(p => ({ ...p, location: v }))} />
        <Input label="التاريخ والوقت" type="datetime-local" value={form.scheduled_date || ''} onChange={v => setForm(p => ({ ...p, scheduled_date: v }))} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>الأولوية</div>
          <select value={form.priority || 'normal'} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
            style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.textPrimary, fontSize: 14 }}>
            <option value="low">منخفضة</option>
            <option value="normal">عادية</option>
            <option value="high">عالية</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn>
          <Btn onClick={create}>💾 إنشاء</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DONATIONS
// ─────────────────────────────────────────────────────────────────────────────
function DonationsPage() {
  const { data, loading, error, reload } = useFetch('/donations');
  const donations = data?.data?.donations || data?.donations || data?.data || [];
  const statusColor = s => s === 'received' || s === 'distributed' ? 'green' : s === 'pending' ? 'yellow' : 'red';

  const cols = [
    { label: 'المتبرع',    render: d => d.donor_name || d.user_name || '—' },
    { label: 'النوع',      key: 'type' },
    { label: 'الكمية',     key: 'quantity' },
    { label: 'المبلغ',     render: d => d.amount ? `${d.amount} ر.س` : '—' },
    { label: 'المدينة',    key: 'city' },
    { label: 'الحالة',     render: d => <Badge color={statusColor(d.status)}>{d.status || '—'}</Badge> },
    { label: 'التتبع',     render: d => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: C.textDim }}>{d.tracking_number || '—'}</span> },
    { label: 'التاريخ',    render: d => new Date(d.created_at).toLocaleDateString('ar') },
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◈" title="التبرعات"
        action={
          <a href={`${API_URL}/reports/export/donations`} target="_blank" rel="noreferrer" style={btnStyle('outline', 'sm')}>
            📥 تصدير CSV
          </a>
        }
      />
      <ErrorCard error={error} onRetry={reload} />
      <Card>
        {loading ? <Loading /> : <Table cols={cols} rows={donations} emptyMessage="لا توجد تبرعات" />}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────────────────────────────────────────
function CampaignsPage() {
  const { data, loading, error, reload } = useFetch('/campaigns');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const campaigns = data?.data?.campaigns || data?.campaigns || data?.data || [];

  const create = async () => {
    try { await apiRequest('/campaigns', { method: 'POST', body: form }); setModal(false); setForm({}); reload(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="page-anim">
      <PageTitle icon="◉" title="الحملات" action={<Btn size="sm" onClick={() => setModal(true)}>+ حملة جديدة</Btn>} />
      <ErrorCard error={error} onRetry={reload} />
      {loading ? <Loading /> : (
        campaigns.length === 0
          ? <Card><EmptyState icon="📢" message="لا توجد حملات بعد" /></Card>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {campaigns.map(c => {
              const pct = c.financial_goal > 0 ? Math.min(100, Math.round((c.total_raised || 0) / c.financial_goal * 100)) : 0;
              return (
                <Card key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</h3>
                    <Badge color={c.status === 'active' ? 'green' : 'grey'}>{c.status}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>{c.description}</p>
                  {c.financial_goal > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textSecond, marginBottom: 4 }}>
                        <span>{c.total_raised || 0} ر.س</span><span>{c.financial_goal} ر.س</span>
                      </div>
                      <div style={{ background: C.border, borderRadius: 4, height: 5 }}>
                        <div style={{ width: `${pct}%`, background: C.greenLight, borderRadius: 4, height: 5 }} />
                      </div>
                      <div style={{ fontSize: 11, color: C.gold, marginTop: 3 }}>{pct}٪ مكتمل</div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="حملة جديدة">
        <Input label="عنوان الحملة"   value={form.title || ''}          onChange={v => setForm(p => ({ ...p, title: v }))} />
        <Input label="الوصف"          value={form.description || ''}    onChange={v => setForm(p => ({ ...p, description: v }))} />
        <Input label="الهدف المالي"   type="number" value={form.financial_goal || ''} onChange={v => setForm(p => ({ ...p, financial_goal: v }))} />
        <Input label="تاريخ البداية"  type="date"   value={form.start_date || ''}    onChange={v => setForm(p => ({ ...p, start_date: v }))} />
        <Input label="تاريخ النهاية"  type="date"   value={form.end_date || ''}      onChange={v => setForm(p => ({ ...p, end_date: v }))} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setModal(false)}>إلغاء</Btn>
          <Btn onClick={create}>💾 إنشاء</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
function PaymentsPage() {
  const { data, loading, error, reload } = useFetch('/payments');
  const payments = data?.data?.payments || data?.payments || data?.data || [];
  const statusColor = s => s === 'paid' || s === 'success' ? 'green' : s === 'pending' ? 'yellow' : 'red';

  const cols = [
    { label: 'رقم العملية', render: p => <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11 }}>{p.transaction_id || p.id}</span> },
    { label: 'المتبرع',     render: p => p.donor_name || '—' },
    { label: 'المزود',      render: p => <Badge color="blue">{p.provider || 'sandbox'}</Badge> },
    { label: 'المبلغ',      render: p => `${p.amount} ${p.currency || 'SAR'}` },
    { label: 'الحالة',      render: p => <Badge color={statusColor(p.status)}>{p.status}</Badge> },
    { label: 'التاريخ',     render: p => p.created_at ? new Date(p.created_at).toLocaleDateString('ar') : '—' },
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◎" title="المدفوعات" />
      <div style={{ background: '#2E1E0022', border: `1px solid ${C.gold}33`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: C.gold }}>
        ⚠️ وضع Sandbox — لا توجد مفاتيح دفع حقيقية. للتفعيل أضف MOYASAR_API_KEY في متغيرات Render.
      </div>
      <ErrorCard error={error} onRetry={reload} />
      <Card>
        {loading ? <Loading /> : <Table cols={cols} rows={payments} emptyMessage="لا توجد مدفوعات" />}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsPage() {
  const { data, loading, error, reload } = useFetch('/notifications');
  const [form, setForm] = useState({ title: '', body: '', type: 'all' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');
  const notifications = data?.data?.notifications || data?.notifications || data?.data || [];

  const broadcast = async () => {
    if (!form.title.trim() || !form.body.trim()) { alert('يرجى إدخال العنوان والنص'); return; }
    setSending(true);
    try {
      await apiRequest('/notifications/broadcast', { method: 'POST', body: form });
      setSent('✅ تم إرسال الإشعار بنجاح');
      setForm({ title: '', body: '', type: 'all' });
      reload();
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  const cols = [
    { label: 'العنوان',    key: 'title' },
    { label: 'المستلمون', render: n => n.recipient_type || n.type || 'all' },
    { label: 'الحالة',    render: n => <Badge color={n.status === 'sent' ? 'green' : 'yellow'}>{n.status || 'sent'}</Badge> },
    { label: 'التاريخ',   render: n => n.created_at ? new Date(n.created_at).toLocaleDateString('ar') : '—' },
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◆" title="الإشعارات" />
      <ErrorCard error={error} onRetry={reload} />
      {sent && (
        <div style={{ background: '#0D2E18', border: `1px solid ${C.green}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: C.greenGlow, display: 'flex', justifyContent: 'space-between' }}>
          <span>{sent}</span>
          <button onClick={() => setSent('')} style={{ background: 'none', border: 'none', color: C.greenGlow, cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 16 }}>📤 إرسال إشعار</h3>
          <Input label="العنوان" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>نص الإشعار</div>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.textPrimary, fontSize: 13, height: 80, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>المستلمون</div>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.textPrimary, fontSize: 14 }}>
              <option value="all">الجميع</option>
              <option value="volunteers">المتطوعون</option>
              <option value="donors">المتبرعون</option>
              <option value="admins">المشرفون</option>
            </select>
          </div>
          <Btn onClick={broadcast} disabled={sending} style={{ width: '100%' }}>
            {sending ? <><Spinner size={14} /> جاري الإرسال...</> : '📤 إرسال'}
          </Btn>
          <div style={{ marginTop: 12, fontSize: 11, color: C.textDim }}>
            💡 Firebase Push يحتاج FIREBASE_PROJECT_ID — حالياً Mock
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 16 }}>📋 السجل</h3>
          {loading ? <Loading /> : <Table cols={cols} rows={notifications} emptyMessage="لا توجد إشعارات" />}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────────────────
function ReportsPage() {
  const { data, loading, error, reload } = useFetch('/reports/summary');
  const summary = data?.data || data || {};

  const exportLinks = [
    { key: 'volunteers', label: 'المتطوعون',  icon: '◆' },
    { key: 'donations',  label: 'التبرعات',   icon: '◈' },
    { key: 'tasks',      label: 'المهام',      icon: '◇' },
    { key: 'campaigns',  label: 'الحملات',    icon: '◉' },
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◇" title="التقارير" />
      <ErrorCard error={error} onRetry={reload} />
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['المستخدمون', summary.total_users  || summary.totalUsers  || '—', '◉'],
            ['المتطوعون',  summary.total_volunteers || summary.totalVolunteers || '—', '◆'],
            ['التبرعات',   summary.total_donations || summary.totalDonations || '—', '◈'],
            ['المهام',     summary.total_tasks || summary.totalTasks || '—', '◇'],
          ].map(([l, v, ic]) => (
            <div key={l} style={{ ...{background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 14px'} }}>
              <div style={{ fontSize: 20, color: C.gold, marginBottom: 6 }}>{ic}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: C.ivory }}>{v}</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {exportLinks.map(r => (
          <Card key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, color: C.gold }}>{r.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</span>
            </div>
            <a href={`${API_URL}/reports/export/${r.key}`} target="_blank" rel="noreferrer" style={btnStyle('outline', 'sm')}>
              📥 CSV
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QR
// ─────────────────────────────────────────────────────────────────────────────
function QRPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!code.trim()) return;
    setLoading(true); setResult(null); setVerifyError(null);
    try {
      const res = await apiRequest(`/qr/verify/${code.trim()}`);
      setResult(res.data || res);
    } catch (e) { setVerifyError(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-anim">
      <PageTitle icon="◈" title="التحقق من QR" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 14 }}>🔍 تحقق من كود</h3>
          <input
            value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="أدخل كود QR..."
            dir="ltr"
            style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.textPrimary, fontSize: 14, marginBottom: 12 }}
          />
          <Btn onClick={verify} disabled={loading} style={{ width: '100%' }}>
            {loading ? <Spinner size={16} /> : '🔍 تحقق'}
          </Btn>
          <ErrorCard error={verifyError} compact />
          {result && (
            <div style={{ marginTop: 16, padding: 14, background: C.bg, borderRadius: 8, border: `1px solid ${result.is_valid ? C.green : C.error}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{result.name}</strong>
                <Badge color={result.is_valid ? 'green' : 'red'}>{result.is_valid ? '✅ معتمد' : '❌ غير معتمد'}</Badge>
              </div>
              <div style={{ fontSize: 12, color: C.textSecond }}>رقم العضوية: <span style={{ color: C.gold, fontFamily: 'IBM Plex Mono' }}>{result.membership_number}</span></div>
            </div>
          )}
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 14 }}>ℹ️ نظام QR</h3>
          <div style={{ fontSize: 13, color: C.textSecond, lineHeight: 1.9 }}>
            {['كل متطوع معتمد يحصل على QR فريد', 'يُنشأ تلقائياً عند قبول طلب التطوع', 'يمكن إلغاؤه وإعادة إصداره', 'كل عمليات المسح مسجّلة', 'صفحة التحقق العامة متاحة بدون تسجيل دخول'].map(t => (
              <div key={t} style={{ padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>• {t}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILES
// ─────────────────────────────────────────────────────────────────────────────
function FilesPage() {
  const { data, loading, error, reload } = useFetch('/files');
  const files = data?.data?.files || data?.files || data?.data || [];

  const approve = async id => { try { await apiRequest(`/files/${id}/approve`, { method: 'PATCH' }); reload(); } catch(e){ alert(e.message); }};
  const reject  = async id => { try { await apiRequest(`/files/${id}/reject`,  { method: 'PATCH', body: { reason: 'مرفوض من الإدارة' } }); reload(); } catch(e){ alert(e.message); }};

  const cols = [
    { label: 'اسم الملف',  render: f => f.original_name || f.filename || '—' },
    { label: 'النوع',      key: 'file_type' },
    { label: 'الحجم',      render: f => f.file_size ? `${Math.round(f.file_size/1024)} KB` : '—' },
    { label: 'المالك',     render: f => f.user_name || f.uploaded_by || '—' },
    { label: 'الحالة',     render: f => <Badge color={f.status === 'approved' ? 'green' : f.status === 'rejected' ? 'red' : 'yellow'}>{f.status || 'pending'}</Badge> },
    { label: 'التاريخ',    render: f => f.created_at ? new Date(f.created_at).toLocaleDateString('ar') : '—' },
    { label: 'إجراءات',   render: f => (
      <div style={{ display: 'flex', gap: 4 }}>
        {f.status !== 'approved' && <Btn size="sm" onClick={() => approve(f.id)}>✅</Btn>}
        {f.status !== 'rejected' && <Btn size="sm" variant="danger" onClick={() => reject(f.id)}>❌</Btn>}
      </div>
    )},
  ];

  return (
    <div className="page-anim">
      <PageTitle icon="◉" title="إدارة الملفات" />
      <div style={{ background: '#2E1E0022', border: `1px solid ${C.gold}33`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: C.gold }}>
        ⚠️ تخزين Render مؤقت — فعّل Cloudinary عبر CLOUDINARY_URL في متغيرات السيرفر
      </div>
      <ErrorCard error={error} onRetry={reload} />
      <Card>
        {loading ? <Loading /> : <Table cols={cols} rows={files} emptyMessage="لا توجد ملفات مرفوعة" />}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY
// ─────────────────────────────────────────────────────────────────────────────
function IdentityPage() {
  return (
    <div className="page-anim">
      <PageTitle icon="◎" title="التحقق من الهوية" />
      <FutureServiceCard
        icon="🪪"
        title="التحقق من هويات المتطوعين"
        description="مراجعة واعتماد الهوية الوطنية والإقامة والجواز. OCR تلقائي متاح عند التفعيل. تنبيه عند قرب انتهاء الصلاحية."
      />
      <div style={{ marginTop: 16 }}>
        <Card>
          <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 12 }}>حالات التحقق</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[['غير مكتمل','grey'],['قيد المراجعة','yellow'],['معتمد','green'],['مرفوض','red'],['منتهي','red']].map(([l,c]) => (
              <Badge key={l} color={c}>{l}</Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NUSUK
// ─────────────────────────────────────────────────────────────────────────────
function NusukPage() {
  const [form, setForm] = useState({ permit_number: '', id_number: '', visitor_type: 'pilgrim' });
  const [result, setResult] = useState(null);
  const [nusukError, setNusukError] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true); setResult(null); setNusukError(null);
    try {
      const res = await apiRequest('/nusuk/verify', { method: 'POST', body: form });
      setResult(res.data || res);
    } catch (e) { setNusukError(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-anim">
      <PageTitle icon="◆" title="نسك — ضيوف الرحمن" />
      <div style={{ background: '#0A1A2E', border: `1px solid #1A3A5E`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#64B5F6' }}>
        ℹ️ هذه الواجهة تعمل بـ Mock Provider. الربط الرسمي يحتاج API من وزارة الحج والعمرة.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 14 }}>التحقق من الزائر</h3>
          <Input label="رقم التصريح" value={form.permit_number} onChange={v => setForm(p=>({...p,permit_number:v}))} dir="ltr" />
          <Input label="رقم الهوية / الجواز" value={form.id_number} onChange={v => setForm(p=>({...p,id_number:v}))} dir="ltr" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: C.textSecond, marginBottom: 5 }}>نوع الزائر</div>
            <select value={form.visitor_type} onChange={e => setForm(p=>({...p,visitor_type:e.target.value}))}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.textPrimary, fontSize: 14 }}>
              <option value="pilgrim">حاج</option>
              <option value="umrah">معتمر</option>
              <option value="visitor">زائر</option>
            </select>
          </div>
          <Btn onClick={verify} disabled={loading} style={{ width: '100%' }}>{loading ? '...' : '🔍 تحقق'}</Btn>
          <ErrorCard error={nusukError} compact />
          {result && (
            <div style={{ marginTop: 14, padding: 12, background: C.bg, borderRadius: 8 }}>
              <Badge color={result.status === 'approved' ? 'green' : 'red'}>{result.status_label || result.status}</Badge>
              {result.name && <div style={{ marginTop: 6, fontSize: 12, color: C.textSecond }}>الاسم: {result.name}</div>}
            </div>
          )}
        </Card>
        <FutureServiceCard icon="🕌" title="نسك — ربط رسمي" description="عند توفر API الرسمي من وزارة الحج والعمرة، سيتم ربط هذه الواجهة للتحقق الفوري من تصاريح ضيوف الرحمن." />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAFATH
// ─────────────────────────────────────────────────────────────────────────────
function NafathPage() {
  return (
    <div className="page-anim">
      <PageTitle icon="◇" title="نفاذ — التحقق الوطني" />
      <FutureServiceCard
        icon="🔐"
        title="نفاذ — نظام التحقق السعودي"
        description="نفاذ هو نظام الهوية الرقمية الوطني السعودي. الربط يحتاج تسجيلاً رسمياً مع المنصة الوطنية للخدمات المشتركة وإعداد OIDC."
      />
      <Card style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, color: C.textSecond, marginBottom: 14 }}>الإعدادات (تحضير)</h3>
        {[['Client ID', 'client_id'], ['Client Secret', 'client_secret'], ['Callback URL', 'callback_url']].map(([l, k]) => (
          <Input key={k} label={l} value="" onChange={() => {}} dir="ltr" />
        ))}
        <Btn variant="ghost" style={{ width: '100%' }}>💾 حفظ (غير مفعّل)</Btn>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function SettingsPage() {
  const { data, loading, error, reload } = useFetch('/settings');
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    const s = data.data?.settings || data.settings || data.data || {};
    if (Array.isArray(s)) {
      const obj = {};
      s.forEach(item => { if (item.key) obj[item.key] = item.value; });
      setForm(obj);
    } else {
      setForm(s);
    }
  }, [data]);

  const save = async () => {
    try {
      await apiRequest('/settings', { method: 'PATCH', body: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="page-anim">
      <PageTitle icon="⚙" title="الإعدادات" />
      <ErrorCard error={error} onRetry={reload} />
      {saved && (
        <div style={{ background: '#0D2E18', border: `1px solid ${C.green}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: C.greenGlow }}>✅ تم حفظ الإعدادات</div>
      )}
      {loading ? <Loading /> : (
        <>
          {[
            { title: 'عام', fields: [['app_name','اسم التطبيق'],['support_email','بريد الدعم'],['privacy_url','رابط الخصوصية']] },
            { title: 'SMS', fields: [['sms_provider','مزود SMS'],['sms_sender','اسم المرسل']] },
            { title: 'QR',  fields: [['qr_expiry_days','مدة الصلاحية (أيام)']] },
          ].map(sec => (
            <Card key={sec.title} style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, color: C.gold, marginBottom: 14 }}>{sec.title}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {sec.fields.map(([f, l]) => (
                  <Input key={f} label={l} value={form[f] || ''} onChange={v => setForm(p => ({ ...p, [f]: v }))} dir="ltr" />
                ))}
              </div>
            </Card>
          ))}
          <Btn onClick={save} size="lg">💾 حفظ الإعدادات</Btn>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const PAGES = {
  dashboard:     DashboardPage,
  users:         UsersPage,
  requests:      RequestsPage,
  volunteers:    VolunteersPage,
  tasks:         TasksPage,
  donations:     DonationsPage,
  campaigns:     CampaignsPage,
  payments:      PaymentsPage,
  notifications: NotificationsPage,
  reports:       ReportsPage,
  qr:            QRPage,
  files:         FilesPage,
  identity:      IdentityPage,
  nusuk:         NusukPage,
  nafath:        NafathPage,
  settings:      SettingsPage,
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function Sidebar({ active, onNavigate, user, onLogout }) {
  return (
    <div style={{
      width: 230,
      background: C.bgSide,
      borderLeft: `1px solid ${C.border}`,
      position: 'fixed',
      top: 0, right: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 5 9 5 14C5 17.9 8.1 21 12 21C15.9 21 19 17.9 19 14C19 9 12 2 12 2Z" fill="white" opacity="0.9"/>
              <circle cx="12" cy="14" r="3" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ivory }}>سقيا الحرمين</div>
            <div style={{ fontSize: 11, color: C.textDim }}>لوحة الإدارة</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 16px', border: 'none',
                background: isActive ? `${C.green}22` : 'transparent',
                color: isActive ? C.greenGlow : C.textSecond,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', textAlign: 'right',
                borderRight: isActive ? `3px solid ${C.greenLight}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.7 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name || user?.phone || 'المشرف'}
        </div>
        <Badge color="green">{user?.role || 'admin'}</Badge>
        <button
          onClick={onLogout}
          style={{
            marginTop: 10, width: '100%', padding: '7px', border: `1px solid ${C.error}55`,
            borderRadius: 7, background: `${C.error}11`, color: '#E87070',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sagya_user')); } catch { return null; }
  });
  const [page, setPage] = useState('dashboard');

  // Inject global styles once
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = globalCSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const hasToken = !!localStorage.getItem('sagya_token');

  if (!user || !hasToken) {
    return <LoginPage onLogin={u => setUser(u)} />;
  }

  const logout = () => {
    localStorage.removeItem('sagya_token');
    localStorage.removeItem('sagya_refresh_token');
    localStorage.removeItem('sagya_user');
    setUser(null);
  };

  const PageComponent = PAGES[page] || DashboardPage;
  const currentNav = NAV.find(n => n.id === page);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      <Sidebar active={page} onNavigate={setPage} user={user} onLogout={logout} />

      <div style={{ marginRight: 230, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <div style={{
          background: C.bgSide,
          borderBottom: `1px solid ${C.border}`,
          padding: '13px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.ivory, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.gold }}>{currentNav?.icon}</span>
            {currentNav?.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.greenGlow, display: 'inline-block', boxShadow: `0 0 6px ${C.greenGlow}` }} />
            <span style={{ fontSize: 12, color: C.textSecond }}>متصل</span>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          <PageComponent />
        </main>
      </div>
    </div>
  );
}
