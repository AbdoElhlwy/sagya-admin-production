import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || 'https://sagya-backend-production.onrender.com/api';

// ─── API CLIENT ──────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const token = localStorage.getItem('sagya_token');
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    });
  } catch (_) {
    const e = new Error('فشل الاتصال — السيرفر قد يكون في وضع Sleep (انتظر 30 ثانية)');
    e.status = 0; e.endpoint = path; throw e;
  }
  let data;
  try { data = await res.json(); } catch (_) {
    const e = new Error('رد غير صالح من السيرفر');
    e.status = res.status; e.endpoint = path; throw e;
  }
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.clear();
      window.location.reload();
    }
    const e = new Error(data.message || `خطأ ${res.status}`);
    e.status = res.status; e.endpoint = path; e.data = data; throw e;
  }
  return data;
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useFetch(endpoint, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try { setState({ data: await api(endpoint), loading: false, error: null }); }
    catch (e) { setState({ data: null, loading: false, error: e }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);
  useEffect(() => { load(); }, [load, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: load };
}

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#09100A', bgCard: '#0E1610', bgSide: '#070E08',
  border: '#162416', borderHi: '#1E3420',
  green: '#1A6B35', greenLt: '#2A9B50', greenGlow: '#3DBB6A',
  gold: '#C9A84C', goldLt: '#E8C96A',
  ivory: '#F0EDE4', ivoryDim: '#A8A090',
  error: '#7A1A1A', errorLt: '#C03030',
  warn: '#6A4A00', warnLt: '#D4900A',
  txt: '#E0DDD4', txtSub: '#788870', txtDim: '#445044',
};

// ─── GLOBAL CSS ──────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Noto Naskh Arabic','Segoe UI',sans-serif;background:${C.bg};color:${C.txt};direction:rtl;-webkit-font-smoothing:antialiased;min-height:100vh}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:${C.bg}}
  ::-webkit-scrollbar-thumb{background:${C.green};border-radius:2px}
  button,select,input,textarea{font-family:inherit}
  a{color:inherit;text-decoration:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .anim{animation:fadeUp .25s ease both}
  .spin{animation:spin .8s linear infinite}
  .pulse{animation:pulse 1.5s ease infinite}
`;

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────
function Spinner({ s = 20 }) {
  return <svg className="spin" width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={C.border} strokeWidth="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke={C.greenGlow} strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}

function Loading() {
  return <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner s={32}/></div>;
}

function Badge({ color='grey', children }) {
  const m = {
    green: ['#0C2E18','#4CAF80','#1B5E30'], yellow: ['#2E1E00','#FFB84D','#5E3C00'],
    red:   ['#2E0A0A','#E57373','#5E1A1A'], blue:   ['#0A1A2E','#64B5F6','#1A3A5E'],
    gold:  ['#2E1E00',C.gold,'#5E3C00'],   grey:   [C.bgCard,C.txtSub,C.border],
  };
  const [bg,fg,bd] = m[color]||m.grey;
  return <span style={{display:'inline-block',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:bg,color:fg,border:`1px solid ${bd}`,whiteSpace:'nowrap'}}>{children}</span>;
}

const btnBase = {border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .15s',whiteSpace:'nowrap',fontFamily:'inherit'};
function btn(v='primary',sz='md') {
  const sizes = {sm:{padding:'5px 12px',fontSize:12},md:{padding:'9px 18px',fontSize:14},lg:{padding:'12px 24px',fontSize:15}};
  const vars = {
    primary:{background:`linear-gradient(135deg,${C.green},${C.greenLt})`,color:'#fff'},
    gold:{background:`linear-gradient(135deg,#6A4A00,${C.gold})`,color:'#fff'},
    danger:{background:`linear-gradient(135deg,${C.error},${C.errorLt})`,color:'#fff'},
    ghost:{background:'transparent',color:C.txtSub,border:`1px solid ${C.border}`},
    outline:{background:'transparent',color:C.greenLt,border:`1px solid ${C.green}`},
    warn:{background:`linear-gradient(135deg,${C.warn},${C.warnLt})`,color:'#fff'},
  };
  return {...btnBase,...sizes[sz],...(vars[v]||vars.primary)};
}

function Btn({ v='primary', sz='md', onClick, children, disabled, style={} }) {
  return <button onClick={onClick} disabled={disabled} style={{...btn(v,sz),opacity:disabled?.5:1,...style}}>{children}</button>;
}

function Card({ children, style={} }) {
  return <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...style}}>{children}</div>;
}

function ErrBanner({ error, onRetry }) {
  if (!error) return null;
  return <div style={{background:`${C.error}22`,border:`1px solid ${C.error}55`,borderRadius:10,padding:'14px 18px',margin:'10px 0'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
      <div style={{flex:1}}>
        <div style={{color:'#E87070',fontWeight:700,fontSize:14,marginBottom:4}}>
          {error.status===401?'🔐 انتهت الجلسة':error.status===404?'🔍 مسار غير موجود':error.status===0?'📡 فشل الاتصال':'⚠️ خطأ في البيانات'}
        </div>
        {error.endpoint && <div style={{color:C.txtDim,fontSize:11,marginBottom:3}}>
          <span style={{color:C.gold,fontFamily:'IBM Plex Mono'}}>{API_URL}{error.endpoint}</span>
        </div>}
        <div style={{color:C.ivoryDim,fontSize:13}}>{error.status?`HTTP ${error.status} — `:''}{error.message}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
        {onRetry && <Btn v="outline" sz="sm" onClick={onRetry}>↻ إعادة</Btn>}
        <a href={`${API_URL.replace('/api','')}/health`} target="_blank" rel="noreferrer" style={{...btn('ghost','sm'),textAlign:'center'}}>🔍 Health</a>
      </div>
    </div>
  </div>;
}

function Empty({ icon='📭', msg='لا توجد بيانات' }) {
  return <div style={{textAlign:'center',padding:'48px 20px',color:C.txtDim}}>
    <div style={{fontSize:36,marginBottom:10}}>{icon}</div>
    <div style={{fontSize:14}}>{msg}</div>
  </div>;
}

function PageHead({ icon, title, action }) {
  return <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:20,color:C.gold}}>{icon}</span>
      <h2 style={{fontSize:19,fontWeight:700,color:C.ivory}}>{title}</h2>
    </div>
    {action}
  </div>;
}

function Modal({ open, onClose, title, width=520, children }) {
  if (!open) return null;
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:C.bgCard,border:`1px solid ${C.borderHi}`,borderRadius:16,padding:28,width,maxWidth:'95vw',maxHeight:'90vh',overflowY:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:C.ivory}}>{title}</h3>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.txtSub,fontSize:20,cursor:'pointer'}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

const inputStyle = {width:'100%',background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 14px',color:C.txt,fontSize:14,outline:'none'};
const selectStyle = {...inputStyle};

function Field({ label, children }) {
  return <div style={{marginBottom:14}}>
    {label && <div style={{fontSize:13,color:C.txtSub,marginBottom:5}}>{label}</div>}
    {children}
  </div>;
}

function TField({ label, value, onChange, type='text', dir, placeholder='' }) {
  return <Field label={label}>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} dir={dir} placeholder={placeholder}
      style={inputStyle} />
  </Field>;
}

function DataTable({ cols, rows, empty='لا توجد بيانات' }) {
  if (!rows||rows.length===0) return <Empty msg={empty}/>;
  return <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead>
        <tr style={{borderBottom:`1px solid ${C.borderHi}`}}>
          {cols.map(c=><th key={c.label} style={{textAlign:'right',padding:'10px 14px',color:C.txtDim,fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row,i)=>(
          <tr key={row.id||i} style={{borderBottom:`1px solid ${C.border}`,transition:'background .1s'}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bgSide}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {cols.map(c=><td key={c.label} style={{padding:'11px 14px',fontSize:13,color:C.txt}}>
              {c.render?c.render(row,i):row[c.key]??'—'}
            </td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>;
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = [
  {id:'dashboard',    label:'لوحة التحكم',        icon:'◈'},
  {id:'users',        label:'المستخدمون',          icon:'◉'},
  {id:'requests',     label:'طلبات التطوع',        icon:'◎'},
  {id:'volunteers',   label:'المتطوعون',           icon:'◆'},
  {id:'tasks',        label:'المهام',              icon:'◇'},
  {id:'donations',    label:'التبرعات',            icon:'◈'},
  {id:'campaigns',    label:'الحملات',             icon:'◉'},
  {id:'payments',     label:'المدفوعات',           icon:'◎'},
  {id:'notifications',label:'الإشعارات',           icon:'◆'},
  {id:'reports',      label:'التقارير',            icon:'◇'},
  {id:'qr',           label:'QR التحقق',          icon:'◈'},
  {id:'files',        label:'الملفات',             icon:'◉'},
  {id:'identity',     label:'التحقق من الهوية',   icon:'◎'},
  {id:'nusuk',        label:'نسك — ضيوف الرحمن', icon:'◆'},
  {id:'nafath',       label:'نفاذ',               icon:'◇'},
  {id:'settings',     label:'الإعدادات',          icon:'⚙'},
];

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [pass, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!phone.trim()||!pass.trim()) { setErr('يرجى إدخال رقم الهاتف وكلمة المرور'); return; }
    setLoading(true); setErr('');
    try {
      const res = await api('/auth/admin-login', { method:'POST', body:{ phone:phone.trim(), password:pass } });
      const token = res.token || res.data?.token;
      if (!token) throw new Error('لم يُستلم توكن من السيرفر');
      localStorage.setItem('sagya_token', token);
      localStorage.setItem('sagya_refresh', res.refreshToken||res.data?.refreshToken||'');
      localStorage.setItem('sagya_user', JSON.stringify(res.user||res.data?.user||{}));
      onLogin(res.user||res.data?.user||{});
    } catch (e) {
      setErr(e.status===401?'بيانات الدخول غير صحيحة':e.status===0?'فشل الاتصال — انتظر 30 ثانية وأعد المحاولة':e.message||'خطأ غير معروف');
    } finally { setLoading(false); }
  };

  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
    background:`radial-gradient(ellipse at 30% 20%,${C.green}18 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,${C.gold}0A 0%,transparent 60%),${C.bg}`,padding:24}}>
    <div style={{width:'100%',maxWidth:400}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <div style={{width:68,height:68,borderRadius:'50%',background:`linear-gradient(135deg,${C.green},${C.greenLt})`,
          display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',boxShadow:`0 0 28px ${C.green}44`}}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path d="M17 3C17 3 7 12 7 19C7 24.5 11.5 29 17 29C22.5 29 27 24.5 27 19C27 12 17 3Z" fill="white" opacity=".9"/>
            <circle cx="17" cy="20" r="4" fill="white" opacity=".5"/>
          </svg>
        </div>
        <h1 style={{fontSize:24,fontWeight:700,color:C.ivory,marginBottom:6}}>سقيا الحرمين</h1>
        <p style={{fontSize:13,color:C.txtSub}}>لوحة إدارة المتطوعين والتبرعات</p>
      </div>

      <div style={{background:C.bgCard,border:`1px solid ${C.borderHi}`,borderRadius:16,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        <form onSubmit={submit}>
          <Field label="رقم الهاتف">
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+966500000001" dir="ltr" autoComplete="username" style={{...inputStyle,fontSize:15,letterSpacing:'.5px'}}/>
          </Field>
          <Field label="كلمة المرور">
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••••" autoComplete="current-password" style={{...inputStyle,fontSize:15}}/>
          </Field>

          {err && <div style={{background:`${C.error}22`,border:`1px solid ${C.error}66`,borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#E87070',fontSize:13,lineHeight:1.5}}>⚠️ {err}</div>}

          <button type="submit" disabled={loading} style={{...btn('primary','lg'),width:'100%',opacity:loading?.7:1,boxShadow:loading?'none':`0 4px 16px ${C.green}44`}}>
            {loading?<><Spinner s={18}/> جاري التحقق...</>:'دخول'}
          </button>
        </form>
      </div>
      <div style={{textAlign:'center',marginTop:20,color:C.txtDim,fontSize:12}}>سقيا الحرمين © {new Date().getFullYear()}</div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
function DashboardPage() {
  const { data, loading, error, reload } = useFetch('/admin/dashboard');
  const healthUrl = useRef(API_URL.replace('/api','')+'/api/status');
  const [svc, setSvc] = useState({});
  useEffect(() => {
    fetch(healthUrl.current).then(r=>r.ok?r.json():null).then(d=>d&&setSvc(d.status||{})).catch(()=>{});
  }, []);

  const raw = data?.data||{};
  const stats = {
    total_users:       raw.totalUsers||0,
    total_volunteers:  raw.totalVolunteers||0,
    approved:          raw.approvedVolunteers||0,
    pending_requests:  raw.pendingRequests||0,
    donations_today:   raw.todayDonations||0,
    total_donations:   raw.totalDonations||0,
    open_tasks:        raw.openTasks||0,
    completed_tasks:   raw.completedTasks||0,
    active_campaigns:  raw.activeCampaigns||0,
    notif_sent:        raw.notificationsSent||0,
  };

  const cards = [
    {l:'المستخدمون',     v:stats.total_users,       c:C.greenLt},
    {l:'المتطوعون',      v:stats.total_volunteers,  c:C.gold},
    {l:'معتمدون',        v:stats.approved,          c:C.greenGlow},
    {l:'طلبات جديدة',    v:stats.pending_requests,  c:'#E67E00'},
    {l:'تبرعات اليوم',   v:`${stats.donations_today} ر.س`, c:C.greenLt},
    {l:'إجمالي التبرعات',v:`${stats.total_donations} ر.س`, c:C.gold},
    {l:'مهام مفتوحة',    v:stats.open_tasks,        c:'#E67E00'},
    {l:'مهام مكتملة',    v:stats.completed_tasks,   c:C.greenGlow},
    {l:'حملات نشطة',     v:stats.active_campaigns,  c:C.greenLt},
    {l:'إشعارات مرسلة',  v:stats.notif_sent,        c:C.txtSub},
  ];

  const svcC = v=>v==='ok'||v==='configured'||v==='cloudinary'?'green':v==='sandbox'||v==='local'?'yellow':v==='not_configured'?'grey':'red';

  return <div className="anim">
    <PageHead icon="◈" title="لوحة التحكم" action={<Btn v="outline" sz="sm" onClick={reload}>↻ تحديث</Btn>}/>
    <ErrBanner error={error} onRetry={reload}/>
    {loading&&!data?<Loading/>:<>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {cards.map(c=><div key={c.l} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'14px',borderTop:`2px solid ${c.c}`}}>
          <div style={{fontSize:22,fontWeight:700,color:C.ivory,lineHeight:1,marginBottom:4}}>{c.v}</div>
          <div style={{fontSize:11,color:C.txtDim}}>{c.l}</div>
        </div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Card>
          <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>⚡ حالة الخدمات</h3>
          {[['قاعدة البيانات',svc.database],['SMS',svc.sms],['الدفع',svc.payment],['Firebase',svc.firebase],['التخزين',svc.storage]].map(([n,v])=>
            <div key={n} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13}}>{n}</span><Badge color={svcC(v)}>{v||'unknown'}</Badge>
            </div>)}
        </Card>
        <Card>
          <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>📅 آخر الأنشطة</h3>
          {(raw.recentActivity||[]).length===0?<Empty icon="📭" msg="لا توجد أنشطة بعد"/>
            :(raw.recentActivity||[]).slice(0,8).map((a,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
              <span style={{color:C.txt}}>{a.title||a.action||'—'}</span>
              <span style={{color:C.txtDim}}>{a.created_at?new Date(a.created_at).toLocaleDateString('ar'):''}</span>
            </div>)}
        </Card>
      </div>
    </>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════
function UsersPage() {
  const { data, loading, error, reload } = useFetch('/users');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const users = (data?.data?.users||data?.users||data?.data||[])
    .filter(u=>!search||(u.name||'').includes(search)||(u.phone||'').includes(search)||(u.email||'').includes(search));

  const roleC = r=>r==='super_admin'?'red':r==='admin'?'blue':r==='supervisor'?'yellow':r==='volunteer'?'green':'grey';
  const statusC = s=>s==='active'?'green':'red';

  const save = async()=>{
    setSaving(true);
    try {
      if(modal==='create') await api('/users',{method:'POST',body:form});
      else await api(`/users/${form.id}`,{method:'PATCH',body:form});
      setModal(null);setForm({});reload();
    } catch(e){alert(e.message);} finally{setSaving(false);}
  };

  const changeRole = async(u,role)=>{
    try { await api(`/users/${u.id}/role`,{method:'PATCH',body:{role}}); reload(); }
    catch(e){alert(e.message);}
  };

  const toggleStatus = async u=>{
    try { await api(`/users/${u.id}/status`,{method:'PATCH',body:{status:u.status==='active'?'inactive':'active'}}); reload(); }
    catch(e){alert(e.message);}
  };

  const del = async id=>{
    if(!window.confirm('حذف هذا المستخدم؟')) return;
    try { await api(`/users/${id}`,{method:'DELETE'}); reload(); }
    catch(e){alert(e.message);}
  };

  const cols = [
    {label:'#',render:(_,i)=>i+1},
    {label:'الاسم',render:u=><strong>{u.name}</strong>},
    {label:'الهاتف',render:u=><span style={{direction:'ltr',display:'inline-block'}}>{u.phone}</span>},
    {label:'البريد',render:u=>u.email||'—'},
    {label:'الدور',render:u=><div style={{display:'flex',alignItems:'center',gap:6}}>
      <Badge color={roleC(u.role)}>{u.role}</Badge>
      <select value={u.role} onChange={e=>changeRole(u,e.target.value)}
        style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.txtSub,fontSize:11,padding:'2px 4px'}}>
        {['user','volunteer','supervisor','admin','super_admin'].map(r=><option key={r} value={r}>{r}</option>)}
      </select>
    </div>},
    {label:'الحالة',render:u=><Badge color={statusC(u.status)}>{u.status==='active'?'نشط':'معطل'}</Badge>},
    {label:'آخر دخول',render:u=>u.last_login?new Date(u.last_login).toLocaleDateString('ar'):'—'},
    {label:'إجراءات',render:u=><div style={{display:'flex',gap:5}}>
      <Btn v="ghost" sz="sm" onClick={()=>{setForm(u);setModal('edit');}}>✏️</Btn>
      <Btn v={u.status==='active'?'warn':'outline'} sz="sm" onClick={()=>toggleStatus(u)}>{u.status==='active'?'🔒':'🔓'}</Btn>
      <Btn v="danger" sz="sm" onClick={()=>del(u.id)}>🗑️</Btn>
    </div>},
  ];

  return <div className="anim">
    <PageHead icon="◉" title="المستخدمون" action={<Btn sz="sm" onClick={()=>{setForm({});setModal('create');}}>+ إضافة</Btn>}/>
    <ErrBanner error={error} onRetry={reload}/>
    <Card>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو البريد..." style={{...inputStyle,width:280}}/>
        <Btn v="ghost" sz="sm" onClick={reload}>↻</Btn>
      </div>
      {loading?<Loading/>:<DataTable cols={cols} rows={users} empty="لا يوجد مستخدمون"/>}
    </Card>

    <Modal open={!!modal} onClose={()=>{setModal(null);setForm({});}} title={modal==='create'?'إضافة مستخدم':'تعديل مستخدم'}>
      <TField label="الاسم" value={form.name||''} onChange={v=>setForm(p=>({...p,name:v}))}/>
      <TField label="الهاتف" value={form.phone||''} onChange={v=>setForm(p=>({...p,phone:v}))} dir="ltr"/>
      <TField label="البريد" value={form.email||''} onChange={v=>setForm(p=>({...p,email:v}))} dir="ltr"/>
      {modal==='create'&&<TField label="كلمة المرور" type="password" value={form.password||''} onChange={v=>setForm(p=>({...p,password:v}))}/>}
      <Field label="الدور">
        <select value={form.role||'user'} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={selectStyle}>
          {['user','volunteer','supervisor','admin','super_admin'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:6}}>
        <Btn v="ghost" onClick={()=>setModal(null)}>إلغاء</Btn>
        <Btn onClick={save} disabled={saving}>{saving?'...':'💾 حفظ'}</Btn>
      </div>
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// VOLUNTEER REQUESTS
// ═══════════════════════════════════════════════════════════════
function RequestsPage() {
  const { data, loading, error, reload } = useFetch('/volunteer-requests');
  const [sel, setSel] = useState(null);
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [doing, setDoing] = useState(false);
  const [success, setSuccess] = useState('');

  const reqs = data?.data?.requests||data?.requests||data?.data||[];

  const approve = async id=>{
    setDoing(true);
    try {
      const res = await api(`/volunteer-requests/${id}/approve`,{method:'PATCH'});
      setSuccess(`✅ تم القبول — رقم العضوية: ${res.data?.membership_number||res.membership_number||'—'}`);
      setAction(null); reload();
    } catch(e){alert(e.message);} finally{setDoing(false);}
  };

  const reject = async id=>{
    setDoing(true);
    try {
      await api(`/volunteer-requests/${id}/reject`,{method:'PATCH',body:{reason}});
      setAction(null);setReason('');reload();
    } catch(e){alert(e.message);} finally{setDoing(false);}
  };

  const requestInfo = async id=>{
    const note = prompt('اكتب المعلومات المطلوبة:');
    if(!note) return;
    try { await api(`/volunteer-requests/${id}/request-more-info`,{method:'PATCH',body:{notes:note}}); reload(); }
    catch(e){alert(e.message);}
  };

  const sC = s=>s==='approved'?'green':s==='pending'?'yellow':s==='rejected'?'red':'grey';
  const sL = s=>({approved:'مقبول',pending:'قيد المراجعة',rejected:'مرفوض',info_required:'يحتاج معلومات'}[s]||s);

  const cols = [
    {label:'الاسم',render:r=><strong style={{cursor:'pointer',color:C.greenLt}} onClick={()=>setSel(r)}>{r.name||r.full_name}</strong>},
    {label:'الهاتف',render:r=><span style={{direction:'ltr',display:'inline-block'}}>{r.phone}</span>},
    {label:'المدينة',key:'city'},
    {label:'الجنسية',key:'nationality'},
    {label:'الحالة',render:r=><Badge color={sC(r.status)}>{sL(r.status)}</Badge>},
    {label:'التاريخ',render:r=>new Date(r.created_at).toLocaleDateString('ar')},
    {label:'إجراءات',render:r=>r.status==='pending'?<div style={{display:'flex',gap:5}}>
      <Btn sz="sm" onClick={()=>{setSel(r);setAction('approve');}}>✅ قبول</Btn>
      <Btn v="danger" sz="sm" onClick={()=>{setSel(r);setAction('reject');}}>❌ رفض</Btn>
      <Btn v="gold" sz="sm" onClick={()=>requestInfo(r.id)}>📋 معلومات</Btn>
    </div>:null},
  ];

  return <div className="anim">
    <PageHead icon="◎" title="طلبات التطوع"/>
    <ErrBanner error={error} onRetry={reload}/>
    {success&&<div style={{background:'#0C2E18',border:`1px solid ${C.green}`,borderRadius:8,padding:'10px 16px',marginBottom:14,color:C.greenGlow,display:'flex',justifyContent:'space-between'}}>
      <span>{success}</span><button onClick={()=>setSuccess('')} style={{background:'none',border:'none',color:C.greenGlow,cursor:'pointer'}}>✕</button>
    </div>}
    <Card>{loading?<Loading/>:<DataTable cols={cols} rows={reqs} empty="لا توجد طلبات"/>}</Card>

    {/* تفاصيل الطلب */}
    <Modal open={!!sel&&!action} onClose={()=>setSel(null)} title="تفاصيل طلب التطوع" width={580}>
      {sel&&<div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
          {[['الاسم الكامل',sel.name||sel.full_name],['رقم الهاتف',sel.phone],['البريد الإلكتروني',sel.email],
            ['تاريخ الميلاد',sel.birth_date],['الجنس',sel.gender],['الجنسية',sel.nationality],
            ['المدينة',sel.city],['المنطقة',sel.region],['المستوى التعليمي',sel.education],
            ['المهنة',sel.profession],['الخبرات',sel.experience],['الحالة',sL(sel.status)]
          ].map(([l,v])=><div key={l}>
            <div style={{fontSize:11,color:C.txtDim,marginBottom:2}}>{l}</div>
            <div style={{fontSize:13,color:C.ivory}}>{v||'—'}</div>
          </div>)}
        </div>
        {sel.notes&&<div style={{background:C.bg,borderRadius:8,padding:12,marginBottom:16}}>
          <div style={{fontSize:11,color:C.txtDim,marginBottom:4}}>ملاحظات</div>
          <div style={{fontSize:13}}>{sel.notes}</div>
        </div>}
        {sel.status==='pending'&&<div style={{display:'flex',gap:8}}>
          <Btn onClick={()=>setAction('approve')}>✅ قبول</Btn>
          <Btn v="danger" onClick={()=>setAction('reject')}>❌ رفض</Btn>
          <Btn v="ghost" onClick={()=>setSel(null)}>إغلاق</Btn>
        </div>}
      </div>}
    </Modal>

    <Modal open={action==='approve'} onClose={()=>setAction(null)} title="تأكيد قبول الطلب">
      <p style={{color:C.txtSub,marginBottom:20,lineHeight:1.7}}>
        هل تريد قبول طلب <strong style={{color:C.ivory}}>{sel?.name||sel?.full_name}</strong>؟<br/>
        سيتم تلقائياً: إنشاء حساب متطوع + رقم عضوية + بطاقة QR.
      </p>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Btn v="ghost" onClick={()=>setAction(null)}>إلغاء</Btn>
        <Btn onClick={()=>approve(sel?.id)} disabled={doing}>{doing?'...':'✅ تأكيد القبول'}</Btn>
      </div>
    </Modal>

    <Modal open={action==='reject'} onClose={()=>setAction(null)} title="رفض الطلب">
      <Field label="سبب الرفض (اختياري)">
        <textarea value={reason} onChange={e=>setReason(e.target.value)} style={{...inputStyle,height:90,resize:'vertical'}}/>
      </Field>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Btn v="ghost" onClick={()=>setAction(null)}>إلغاء</Btn>
        <Btn v="danger" onClick={()=>reject(sel?.id)} disabled={doing}>{doing?'...':'❌ تأكيد الرفض'}</Btn>
      </div>
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// VOLUNTEERS
// ═══════════════════════════════════════════════════════════════
function VolunteersPage() {
  const { data, loading, error, reload } = useFetch('/volunteers');
  const [sel, setSel] = useState(null);
  const [tasks, setTasks] = useState([]);

  const vols = data?.data?.volunteers||data?.volunteers||data?.data||[];

  const loadTasks = async id=>{
    try { const r=await api(`/volunteers/${id}/tasks`); setTasks(r.data?.tasks||r.tasks||r.data||[]); }
    catch(_){ setTasks([]); }
  };

  const openProfile = v=>{ setSel(v); loadTasks(v.id); };

  const changeStatus = async(id,status)=>{
    try { await api(`/volunteers/${id}/status`,{method:'PATCH',body:{status}}); reload(); }
    catch(e){alert(e.message);}
  };

  const sC = s=>s==='active'?'green':s==='suspended'?'red':s==='pending'?'yellow':'grey';

  const cols = [
    {label:'الاسم',render:v=><span style={{cursor:'pointer',color:C.greenLt,fontWeight:600}} onClick={()=>openProfile(v)}>{v.name||v.full_name}</span>},
    {label:'رقم العضوية',render:v=><span style={{fontFamily:'IBM Plex Mono',fontSize:12,color:C.gold}}>{v.membership_number||'—'}</span>},
    {label:'الهاتف',render:v=><span style={{direction:'ltr',display:'inline-block'}}>{v.phone}</span>},
    {label:'المدينة',key:'city'},
    {label:'الجنسية',key:'nationality'},
    {label:'الحالة',render:v=><Badge color={sC(v.status)}>{v.status}</Badge>},
    {label:'النقاط',render:v=><span style={{color:C.gold,fontWeight:600}}>{v.points||0}</span>},
    {label:'التقييم',render:v=>v.rating?`⭐ ${v.rating}`:'—'},
    {label:'إجراءات',render:v=><div style={{display:'flex',gap:5}}>
      <Btn v="ghost" sz="sm" onClick={()=>openProfile(v)}>🔍</Btn>
      {v.status==='active'?<Btn v="warn" sz="sm" onClick={()=>changeStatus(v.id,'suspended')}>🔒 إيقاف</Btn>
        :<Btn v="outline" sz="sm" onClick={()=>changeStatus(v.id,'active')}>🔓 تفعيل</Btn>}
    </div>},
  ];

  return <div className="anim">
    <PageHead icon="◆" title="المتطوعون" action={<Btn v="ghost" sz="sm" onClick={reload}>↻</Btn>}/>
    <ErrBanner error={error} onRetry={reload}/>
    <Card>{loading?<Loading/>:<DataTable cols={cols} rows={vols} empty="لا يوجد متطوعون بعد"/>}</Card>

    <Modal open={!!sel} onClose={()=>{setSel(null);setTasks([]);}} title="ملف المتطوع الكامل" width={620}>
      {sel&&<div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          {[['الاسم',sel.name||sel.full_name],['رقم العضوية',sel.membership_number],
            ['الهاتف',sel.phone],['المدينة',sel.city],['الجنسية',sel.nationality],
            ['الحالة',sel.status],['النقاط',sel.points||0],['التقييم',sel.rating||'—'],
            ['تاريخ الانضمام',sel.created_at?new Date(sel.created_at).toLocaleDateString('ar'):'—'],
            ['آخر نشاط',sel.last_active?new Date(sel.last_active).toLocaleDateString('ar'):'—'],
          ].map(([l,v])=><div key={l}>
            <div style={{fontSize:11,color:C.txtDim,marginBottom:2}}>{l}</div>
            <div style={{fontSize:13,color:C.ivory}}>{v||'—'}</div>
          </div>)}
        </div>

        <div style={{marginBottom:16}}>
          <h4 style={{fontSize:13,color:C.txtSub,marginBottom:10}}>المهام المُسندة ({tasks.length})</h4>
          {tasks.length===0?<div style={{color:C.txtDim,fontSize:13}}>لا توجد مهام مُسندة</div>
            :tasks.slice(0,5).map(t=><div key={t.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
              <span>{t.title}</span>
              <Badge color={t.status==='completed'?'green':t.status==='in_progress'?'blue':'yellow'}>{t.status}</Badge>
            </div>)}
        </div>

        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <a href={`${API_URL}/volunteers/${sel.id}/card`} target="_blank" rel="noreferrer" style={btn('outline','sm')}>🪪 البطاقة الرقمية</a>
          <a href={`${API_URL}/qr/generate/${sel.id}`} target="_blank" rel="noreferrer" style={btn('ghost','sm')}>📲 QR Code</a>
          {sel.status==='active'
            ?<Btn v="warn" sz="sm" onClick={()=>changeStatus(sel.id,'suspended')}>🔒 إيقاف مؤقت</Btn>
            :<Btn v="outline" sz="sm" onClick={()=>changeStatus(sel.id,'active')}>🔓 إعادة تفعيل</Btn>}
        </div>
      </div>}
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════
function TasksPage() {
  const { data, loading, error, reload } = useFetch('/tasks');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [sel, setSel] = useState(null);
  const [selDetail, setSelDetail] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [volSearch, setVolSearch] = useState('');
  const [volList, setVolList] = useState([]);
  const [selected_vols, setSelectedVols] = useState([]);
  const [saving, setSaving] = useState(false);

  const tasks = data?.data?.tasks||data?.data||data?.data||[];

  const loadDetail = async id=>{
    try { const r=await api(`/tasks/${id}`); setSelDetail(r.data||r); }
    catch(e){alert(e.message);}
  };

  const loadVols = async()=>{
    try { const r=await api('/volunteers'); setVolList(r.data?.volunteers||r.volunteers||r.data||[]); }
    catch(_){}
  };

  const create = async()=>{
    if(!form.title){alert('عنوان المهمة مطلوب');return;}
    setSaving(true);
    try { await api('/tasks',{method:'POST',body:form}); setModal(null);setForm({});reload(); }
    catch(e){alert(e.message);} finally{setSaving(false);}
  };

  const updateStatus = async(id,status)=>{
    try { await api(`/tasks/${id}/status`,{method:'PATCH',body:{status}}); reload(); if(selDetail?.id===id) loadDetail(id); }
    catch(e){alert(e.message);}
  };

  const complete = async id=>{
    try { await api(`/tasks/${id}/complete`,{method:'POST'}); reload(); setSelDetail(null); }
    catch(e){alert(e.message);}
  };

  const assign = async()=>{
    if(!selected_vols.length){alert('اختر متطوعاً على الأقل');return;}
    try {
      await api(`/tasks/${sel.id}/assign`,{method:'POST',body:{volunteer_ids:selected_vols}});
      setAssignModal(false);setSelectedVols([]);loadDetail(sel.id);
    } catch(e){alert(e.message);}
  };

  const del = async id=>{
    if(!window.confirm('حذف هذه المهمة؟'))return;
    try { await api(`/tasks/${id}`,{method:'DELETE'}); reload(); }
    catch(e){alert(e.message);}
  };

  const sC = s=>s==='completed'?'green':s==='in_progress'?'blue':s==='open'||s==='pending'?'yellow':s==='cancelled'?'red':'grey';
  const sL = s=>({completed:'مكتملة',in_progress:'جارية',open:'مفتوحة',pending:'معلقة',cancelled:'ملغاة',started:'بدأت'}[s]||s);
  const pC = p=>p==='high'?'red':p==='medium'?'yellow':'grey';

  const filteredVols = volList.filter(v=>!volSearch||(v.name||v.full_name||'').includes(volSearch));

  const cols = [
    {label:'المهمة',render:t=><span style={{cursor:'pointer',color:C.greenLt,fontWeight:600}} onClick={()=>{setSel(t);loadDetail(t.id);}}>{t.title}</span>},
    {label:'النوع',key:'type'},
    {label:'الموقع',key:'location'},
    {label:'التاريخ',render:t=>t.scheduled_date?new Date(t.scheduled_date).toLocaleDateString('ar'):'—'},
    {label:'المُسندون',render:t=><span style={{color:C.gold}}>{t.assigned_count||0} متطوع</span>},
    {label:'الحالة',render:t=><Badge color={sC(t.status)}>{sL(t.status)}</Badge>},
    {label:'الأولوية',render:t=><Badge color={pC(t.priority)}>{t.priority||'عادية'}</Badge>},
    {label:'إجراءات',render:t=><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
      {(t.status==='open'||t.status==='pending')&&<Btn sz="sm" v="outline" onClick={()=>updateStatus(t.id,'in_progress')}>▶ بدء</Btn>}
      {t.status==='in_progress'&&<Btn sz="sm" onClick={()=>complete(t.id)}>✓ إنهاء</Btn>}
      <Btn sz="sm" v="gold" onClick={()=>{setSel(t);loadVols();setAssignModal(true);}}>👤 إسناد</Btn>
      <Btn sz="sm" v="ghost" onClick={()=>{setSel(t);loadDetail(t.id);}}>🔍</Btn>
      <Btn sz="sm" v="danger" onClick={()=>del(t.id)}>🗑️</Btn>
    </div>},
  ];

  const types = ['توزيع مياه','توزيع زمزم','توزيع وجبات','إرشاد وتوجيه','دعم كبار السن','دعم ذوي الإعاقة','تنظيم','طوارئ','لوجستيات','أخرى'];

  return <div className="anim">
    <PageHead icon="◇" title="المهام" action={<Btn sz="sm" onClick={()=>{setForm({priority:'medium',volunteers_needed:1,reward_points:10});setModal('create');}}>+ مهمة جديدة</Btn>}/>
    <ErrBanner error={error} onRetry={reload}/>
    <Card>{loading?<Loading/>:<DataTable cols={cols} rows={tasks} empty="لا توجد مهام"/>}</Card>

    {/* إنشاء مهمة */}
    <Modal open={modal==='create'} onClose={()=>setModal(null)} title="إنشاء مهمة جديدة" width={580}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{gridColumn:'1/-1'}}><TField label="عنوان المهمة *" value={form.title||''} onChange={v=>setForm(p=>({...p,title:v}))}/></div>
        <Field label="نوع المهمة">
          <select value={form.type||''} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={selectStyle}>
            <option value="">اختر...</option>
            {types.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="الأولوية">
          <select value={form.priority||'medium'} onChange={e=>setForm(p=>({...p,priority:e.target.value}))} style={selectStyle}>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
          </select>
        </Field>
        <TField label="الموقع" value={form.location||''} onChange={v=>setForm(p=>({...p,location:v}))}/>
        <TField label="تاريخ ووقت التنفيذ" type="datetime-local" value={form.scheduled_date||''} onChange={v=>setForm(p=>({...p,scheduled_date:v}))}/>
        <TField label="عدد المتطوعين المطلوبين" type="number" value={form.volunteers_needed||1} onChange={v=>setForm(p=>({...p,volunteers_needed:parseInt(v)||1}))}/>
        <TField label="نقاط المكافأة" type="number" value={form.reward_points||10} onChange={v=>setForm(p=>({...p,reward_points:parseInt(v)||10}))}/>
        <div style={{gridColumn:'1/-1'}}>
          <Field label="تعليمات المهمة">
            <textarea value={form.instructions||''} onChange={e=>setForm(p=>({...p,instructions:e.target.value}))} style={{...inputStyle,height:80,resize:'vertical'}}/>
          </Field>
        </div>
        <div style={{gridColumn:'1/-1'}}>
          <Field label="الوصف">
            <textarea value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{...inputStyle,height:60,resize:'vertical'}}/>
          </Field>
        </div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:6}}>
        <Btn v="ghost" onClick={()=>setModal(null)}>إلغاء</Btn>
        <Btn onClick={create} disabled={saving}>{saving?'...':'💾 إنشاء'}</Btn>
      </div>
    </Modal>

    {/* تفاصيل المهمة */}
    <Modal open={!!selDetail&&!assignModal} onClose={()=>setSelDetail(null)} title="تفاصيل المهمة" width={600}>
      {selDetail&&<div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {[['العنوان',selDetail.title],['النوع',selDetail.type],['الموقع',selDetail.location],
            ['الأولوية',selDetail.priority],['الحالة',sL(selDetail.status)],
            ['المتطوعون المطلوبون',selDetail.volunteers_needed],
            ['نقاط المكافأة',selDetail.reward_points],
            ['المشرف',selDetail.supervisor_name||'—'],
            ['التاريخ',selDetail.scheduled_date?new Date(selDetail.scheduled_date).toLocaleDateString('ar'):'—'],
          ].map(([l,v])=><div key={l}>
            <div style={{fontSize:11,color:C.txtDim,marginBottom:2}}>{l}</div>
            <div style={{fontSize:13,color:C.ivory}}>{v||'—'}</div>
          </div>)}
        </div>
        {selDetail.instructions&&<div style={{background:C.bg,borderRadius:8,padding:12,marginBottom:16}}>
          <div style={{fontSize:11,color:C.txtDim,marginBottom:4}}>التعليمات</div>
          <div style={{fontSize:13}}>{selDetail.instructions}</div>
        </div>}
        <h4 style={{fontSize:13,color:C.txtSub,marginBottom:10}}>المتطوعون المُسندون ({(selDetail.assignments||[]).length})</h4>
        {(selDetail.assignments||[]).length===0?<div style={{color:C.txtDim,fontSize:13,marginBottom:16}}>لم يُسند أي متطوع بعد</div>
          :(selDetail.assignments||[]).map(a=><div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
            <span>{a.full_name}</span>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{direction:'ltr'}}>{a.phone}</span>
              <span style={{fontFamily:'IBM Plex Mono',color:C.gold,fontSize:11}}>{a.membership_number}</span>
            </div>
          </div>)}
        <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
          {(selDetail.status==='open'||selDetail.status==='pending')&&<Btn sz="sm" v="outline" onClick={()=>updateStatus(selDetail.id,'in_progress')}>▶ بدء المهمة</Btn>}
          {selDetail.status==='in_progress'&&<Btn sz="sm" onClick={()=>complete(selDetail.id)}>✓ إنهاء وتوزيع النقاط</Btn>}
          {selDetail.status!=='cancelled'&&selDetail.status!=='completed'&&
            <Btn sz="sm" v="danger" onClick={()=>updateStatus(selDetail.id,'cancelled')}>✕ إلغاء</Btn>}
        </div>
      </div>}
    </Modal>

    {/* إسناد متطوعين */}
    <Modal open={assignModal} onClose={()=>{setAssignModal(false);setSelectedVols([]);}} title={`إسناد متطوعين — ${sel?.title||''}`} width={560}>
      <input value={volSearch} onChange={e=>setVolSearch(e.target.value)} placeholder="بحث بالاسم..." style={{...inputStyle,marginBottom:12}}/>
      <div style={{maxHeight:280,overflowY:'auto',border:`1px solid ${C.border}`,borderRadius:8}}>
        {filteredVols.filter(v=>v.status==='active').map(v=><div key={v.id}
          onClick={()=>setSelectedVols(p=>p.includes(v.id)?p.filter(x=>x!==v.id):[...p,v.id])}
          style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',cursor:'pointer',
            background:selected_vols.includes(v.id)?`${C.green}22`:C.bgCard,borderBottom:`1px solid ${C.border}`}}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selected_vols.includes(v.id)?C.greenLt:C.border}`,
            background:selected_vols.includes(v.id)?C.greenLt:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',flexShrink:0}}>
            {selected_vols.includes(v.id)?'✓':''}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600}}>{v.name||v.full_name}</div>
            <div style={{fontSize:11,color:C.txtDim,direction:'ltr'}}>{v.phone} | {v.membership_number||'—'}</div>
          </div>
          <span style={{color:C.gold,fontSize:12}}>{v.points||0} نقطة</span>
        </div>)}
        {filteredVols.filter(v=>v.status==='active').length===0&&<div style={{padding:20,textAlign:'center',color:C.txtDim,fontSize:13}}>لا يوجد متطوعون نشطون</div>}
      </div>
      <div style={{marginTop:12,fontSize:13,color:C.txtSub}}>تم اختيار {selected_vols.length} متطوع</div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:12}}>
        <Btn v="ghost" onClick={()=>{setAssignModal(false);setSelectedVols([]);}}>إلغاء</Btn>
        <Btn onClick={assign} disabled={!selected_vols.length}>👤 تأكيد الإسناد</Btn>
      </div>
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// DONATIONS
// ═══════════════════════════════════════════════════════════════
function DonationsPage() {
  const { data, loading, error, reload } = useFetch('/donations');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState(null);

  const donations = data?.data?.donations||data?.donations||data?.data||[];
  const total = donations.reduce((s,d)=>s+(parseFloat(d.amount)||0),0);

  const create = async()=>{
    setSaving(true);
    try { await api('/donations',{method:'POST',body:form}); setModal(false);setForm({});reload(); }
    catch(e){alert(e.message);} finally{setSaving(false);}
  };

  const changeStatus = async(id,status)=>{
    try { await api(`/donations/${id}/status`,{method:'PATCH',body:{status}}); reload();setStatusModal(null); }
    catch(e){alert(e.message);}
  };

  const sC = s=>s==='received'||s==='distributed'?'green':s==='pending'?'yellow':s==='cancelled'?'red':'grey';

  const types = ['مياه','زمزم','وجبات ساخنة','وجبات جافة','تمر','عصائر','دعم مالي','دعم عيني','دعم لوجستي','أخرى'];

  const cols = [
    {label:'المتبرع',render:d=><strong>{d.donor_name||d.user_name||'—'}</strong>},
    {label:'الهاتف',render:d=><span style={{direction:'ltr',display:'inline-block'}}>{d.phone||'—'}</span>},
    {label:'النوع',key:'type'},
    {label:'الكمية',key:'quantity'},
    {label:'المبلغ',render:d=>d.amount?<span style={{color:C.gold,fontWeight:600}}>{d.amount} ر.س</span>:'—'},
    {label:'المدينة',key:'city'},
    {label:'الحالة',render:d=><div style={{display:'flex',gap:6,alignItems:'center'}}>
      <Badge color={sC(d.status)}>{d.status||'—'}</Badge>
      <select value={d.status||''} onChange={e=>changeStatus(d.id,e.target.value)}
        style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.txtSub,fontSize:11,padding:'2px 4px'}}>
        {['pending','received','distributed','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
      </select>
    </div>},
    {label:'رقم التتبع',render:d=><span style={{fontFamily:'IBM Plex Mono',fontSize:11,color:C.txtDim}}>{d.tracking_number||'—'}</span>},
    {label:'التاريخ',render:d=>new Date(d.created_at).toLocaleDateString('ar')},
    {label:'إجراءات',render:d=><a href={`${API_URL}/donations/${d.id}/receipt`} target="_blank" rel="noreferrer" style={{...btn('ghost','sm')}}>🧾</a>},
  ];

  return <div className="anim">
    <PageHead icon="◈" title="التبرعات" action={<div style={{display:'flex',gap:8}}>
      <a href={`${API_URL}/reports/export/donations`} target="_blank" rel="noreferrer" style={btn('outline','sm')}>📥 CSV</a>
      <Btn sz="sm" onClick={()=>{setForm({});setModal(true);}}>+ تبرع يدوي</Btn>
    </div>}/>
    <ErrBanner error={error} onRetry={reload}/>
    {!loading&&donations.length>0&&<div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 20px',marginBottom:14,display:'flex',gap:24}}>
      <div><span style={{color:C.txtSub,fontSize:12}}>إجمالي التبرعات: </span><span style={{color:C.gold,fontWeight:700}}>{total.toFixed(2)} ر.س</span></div>
      <div><span style={{color:C.txtSub,fontSize:12}}>عدد التبرعات: </span><span style={{color:C.greenGlow,fontWeight:700}}>{donations.length}</span></div>
    </div>}
    <Card>{loading?<Loading/>:<DataTable cols={cols} rows={donations} empty="لا توجد تبرعات"/>}</Card>

    <Modal open={modal} onClose={()=>setModal(false)} title="إضافة تبرع يدوي">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <TField label="اسم المتبرع" value={form.donor_name||''} onChange={v=>setForm(p=>({...p,donor_name:v}))}/>
        <TField label="الهاتف" value={form.phone||''} onChange={v=>setForm(p=>({...p,phone:v}))} dir="ltr"/>
        <Field label="نوع التبرع">
          <select value={form.type||''} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={selectStyle}>
            <option value="">اختر...</option>
            {types.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <TField label="الكمية" value={form.quantity||''} onChange={v=>setForm(p=>({...p,quantity:v}))}/>
        <TField label="المبلغ (ر.س)" type="number" value={form.amount||''} onChange={v=>setForm(p=>({...p,amount:v}))}/>
        <TField label="المدينة" value={form.city||''} onChange={v=>setForm(p=>({...p,city:v}))}/>
        <div style={{gridColumn:'1/-1'}}>
          <Field label="ملاحظات">
            <textarea value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{...inputStyle,height:60,resize:'vertical'}}/>
          </Field>
        </div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:6}}>
        <Btn v="ghost" onClick={()=>setModal(false)}>إلغاء</Btn>
        <Btn onClick={create} disabled={saving}>{saving?'...':'💾 حفظ'}</Btn>
      </div>
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════
function CampaignsPage() {
  const { data, loading, error, reload } = useFetch('/campaigns');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const camps = data?.data?.campaigns||data?.campaigns||data?.data||[];

  const save = async()=>{
    setSaving(true);
    try {
      if(modal==='create') await api('/campaigns',{method:'POST',body:form});
      else await api(`/campaigns/${form.id}`,{method:'PATCH',body:form});
      setModal(null);setForm({});reload();
    } catch(e){alert(e.message);} finally{setSaving(false);}
  };

  const del = async id=>{
    if(!window.confirm('حذف هذه الحملة؟'))return;
    try { await api(`/campaigns/${id}`,{method:'DELETE'}); reload(); }
    catch(e){alert(e.message);}
  };

  return <div className="anim">
    <PageHead icon="◉" title="الحملات" action={<Btn sz="sm" onClick={()=>{setForm({status:'active'});setModal('create');}}>+ حملة جديدة</Btn>}/>
    <ErrBanner error={error} onRetry={reload}/>
    {loading?<Loading/>:camps.length===0?<Card><Empty icon="📢" msg="لا توجد حملات بعد"/></Card>:
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
        {camps.map(c=>{
          const pct=c.financial_goal>0?Math.min(100,Math.round((c.total_raised||0)/c.financial_goal*100)):0;
          return <Card key={c.id}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <h3 style={{fontSize:14,fontWeight:700,flex:1,marginLeft:8}}>{c.title}</h3>
              <Badge color={c.status==='active'?'green':c.status==='ended'?'grey':'yellow'}>{c.status}</Badge>
            </div>
            <p style={{fontSize:12,color:C.txtDim,marginBottom:12,lineHeight:1.6}}>{c.description}</p>
            {c.financial_goal>0&&<div style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.txtSub,marginBottom:4}}>
                <span>{c.total_raised||0} ر.س</span><span>{c.financial_goal} ر.س</span>
              </div>
              <div style={{background:C.border,borderRadius:4,height:5}}>
                <div style={{width:`${pct}%`,background:C.greenLt,borderRadius:4,height:5}}/>
              </div>
              <div style={{fontSize:11,color:C.gold,marginTop:3}}>{pct}٪ مكتمل</div>
            </div>}
            <div style={{fontSize:11,color:C.txtDim,marginBottom:10}}>
              {c.start_date&&`من ${new Date(c.start_date).toLocaleDateString('ar')}`}
              {c.end_date&&` إلى ${new Date(c.end_date).toLocaleDateString('ar')}`}
            </div>
            <div style={{display:'flex',gap:6}}>
              <Btn sz="sm" v="ghost" onClick={()=>{setForm(c);setModal('edit');}}>✏️ تعديل</Btn>
              <Btn sz="sm" v="danger" onClick={()=>del(c.id)}>🗑️</Btn>
            </div>
          </Card>;
        })}
      </div>}

    <Modal open={!!modal} onClose={()=>setModal(null)} title={modal==='create'?'حملة جديدة':'تعديل الحملة'}>
      <TField label="عنوان الحملة *" value={form.title||''} onChange={v=>setForm(p=>({...p,title:v}))}/>
      <Field label="الوصف">
        <textarea value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{...inputStyle,height:80,resize:'vertical'}}/>
      </Field>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <TField label="الهدف المالي (ر.س)" type="number" value={form.financial_goal||''} onChange={v=>setForm(p=>({...p,financial_goal:v}))}/>
        <Field label="الحالة">
          <select value={form.status||'active'} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={selectStyle}>
            <option value="active">نشطة</option>
            <option value="paused">متوقفة مؤقتاً</option>
            <option value="ended">منتهية</option>
          </select>
        </Field>
        <TField label="تاريخ البداية" type="date" value={form.start_date||''} onChange={v=>setForm(p=>({...p,start_date:v}))}/>
        <TField label="تاريخ النهاية" type="date" value={form.end_date||''} onChange={v=>setForm(p=>({...p,end_date:v}))}/>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:6}}>
        <Btn v="ghost" onClick={()=>setModal(null)}>إلغاء</Btn>
        <Btn onClick={save} disabled={saving}>{saving?'...':'💾 حفظ'}</Btn>
      </div>
    </Modal>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════
function PaymentsPage() {
  const { data, loading, error, reload } = useFetch('/payments');
  const payments = data?.data?.payments||data?.payments||data?.data||[];
  const sC = s=>s==='paid'||s==='success'?'green':s==='pending'?'yellow':s==='failed'||s==='refunded'?'red':'grey';

  const cols = [
    {label:'رقم العملية',render:p=><span style={{fontFamily:'IBM Plex Mono',fontSize:11,color:C.txtDim}}>{(p.transaction_id||p.id||'').toString().slice(0,16)}</span>},
    {label:'المتبرع',render:p=>p.donor_name||'—'},
    {label:'المزود',render:p=><Badge color="blue">{p.provider||'sandbox'}</Badge>},
    {label:'المبلغ',render:p=><span style={{color:C.gold,fontWeight:600}}>{p.amount} {p.currency||'SAR'}</span>},
    {label:'الحالة',render:p=><Badge color={sC(p.status)}>{p.status}</Badge>},
    {label:'التاريخ',render:p=>p.created_at?new Date(p.created_at).toLocaleDateString('ar'):'—'},
  ];

  return <div className="anim">
    <PageHead icon="◎" title="المدفوعات"/>
    <div style={{background:'#2E1E0022',border:`1px solid ${C.gold}33`,borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13,color:C.gold}}>
      ⚠️ وضع Sandbox — أضف MOYASAR_API_KEY في Render لتفعيل بوابة الدفع الحقيقية
    </div>
    <ErrBanner error={error} onRetry={reload}/>
    <Card>{loading?<Loading/>:<DataTable cols={cols} rows={payments} empty="لا توجد مدفوعات"/>}</Card>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginTop:16}}>
      {['Moyasar','HyperPay','Tap','Stripe','Paymob'].map(g=><Card key={g} style={{textAlign:'center',padding:12}}>
        <div style={{fontSize:13,fontWeight:600}}>{g}</div>
        <div style={{marginTop:6}}><Badge color="yellow">Sandbox</Badge></div>
      </Card>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
function NotificationsPage() {
  const { data, loading, error, reload } = useFetch('/notifications');
  const [form, setForm] = useState({title:'',body:'',type:'all'});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');
  const notifs = data?.data?.notifications||data?.notifications||data?.data||[];

  const broadcast = async()=>{
    if(!form.title.trim()||!form.body.trim()){alert('يرجى إدخال العنوان والنص');return;}
    setSending(true);
    try { await api('/notifications/broadcast',{method:'POST',body:form}); setSent('✅ تم الإرسال بنجاح'); setForm({title:'',body:'',type:'all'}); reload(); }
    catch(e){alert(e.message);} finally{setSending(false);}
  };

  const cols = [
    {label:'العنوان',key:'title'},
    {label:'المستلمون',render:n=>n.recipient_type||n.type||'all'},
    {label:'الحالة',render:n=><Badge color={n.status==='sent'?'green':'yellow'}>{n.status||'sent'}</Badge>},
    {label:'التاريخ',render:n=>n.created_at?new Date(n.created_at).toLocaleDateString('ar'):'—'},
  ];

  return <div className="anim">
    <PageHead icon="◆" title="الإشعارات"/>
    <ErrBanner error={error} onRetry={reload}/>
    {sent&&<div style={{background:'#0C2E18',border:`1px solid ${C.green}`,borderRadius:8,padding:'10px 14px',marginBottom:14,color:C.greenGlow,display:'flex',justifyContent:'space-between'}}>
      <span>{sent}</span><button onClick={()=>setSent('')} style={{background:'none',border:'none',color:C.greenGlow,cursor:'pointer'}}>✕</button>
    </div>}
    <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
      <Card>
        <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>📤 إرسال إشعار جديد</h3>
        <TField label="العنوان" value={form.title} onChange={v=>setForm(p=>({...p,title:v}))}/>
        <Field label="نص الإشعار">
          <textarea value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))}
            style={{...inputStyle,height:90,resize:'vertical'}}/>
        </Field>
        <Field label="المستلمون">
          <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={selectStyle}>
            <option value="all">الجميع</option>
            <option value="volunteers">المتطوعون فقط</option>
            <option value="donors">المتبرعون فقط</option>
            <option value="admins">المشرفون فقط</option>
          </select>
        </Field>
        <Btn onClick={broadcast} disabled={sending} style={{width:'100%'}}>
          {sending?<><Spinner s={14}/> جاري الإرسال...</>:'📤 إرسال'}
        </Btn>
        <div style={{marginTop:10,fontSize:11,color:C.txtDim,lineHeight:1.7}}>
          💡 Firebase Push يحتاج FIREBASE_PROJECT_ID<br/>
          SMS يحتاج TWILIO_SID<br/>
          حالياً: Mock (لا يصل للأجهزة)
        </div>
      </Card>
      <Card>
        <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>📋 سجل الإشعارات</h3>
        {loading?<Loading/>:<DataTable cols={cols} rows={notifs} empty="لا توجد إشعارات"/>}
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════
function ReportsPage() {
  const { data, loading, error, reload } = useFetch('/reports/summary');
  const summary = data?.data||data||{};

  const types = [
    {k:'volunteers',l:'تقرير المتطوعين',ic:'◆'},
    {k:'donations',l:'تقرير التبرعات',ic:'◈'},
    {k:'tasks',l:'تقرير المهام',ic:'◇'},
    {k:'campaigns',l:'تقرير الحملات',ic:'◉'},
  ];

  return <div className="anim">
    <PageHead icon="◇" title="التقارير"/>
    <ErrBanner error={error} onRetry={reload}/>
    {!loading&&<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
      {[['المستخدمون',summary.total_users||summary.totalUsers||0,'◉'],
        ['المتطوعون',summary.total_volunteers||summary.totalVolunteers||0,'◆'],
        ['التبرعات (ر.س)',summary.total_donations||summary.totalDonations||0,'◈'],
        ['المهام',summary.total_tasks||summary.totalTasks||0,'◇'],
      ].map(([l,v,ic])=><div key={l} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 14px'}}>
        <div style={{fontSize:18,color:C.gold}}>{ic}</div>
        <div style={{fontSize:26,fontWeight:700,color:C.ivory,marginTop:4}}>{v}</div>
        <div style={{fontSize:11,color:C.txtDim,marginTop:2}}>{l}</div>
      </div>)}
    </div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
      {types.map(r=><Card key={r.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18,color:C.gold}}>{r.ic}</span>
          <span style={{fontSize:14,fontWeight:600}}>{r.l}</span>
        </div>
        <a href={`${API_URL}/reports/export/${r.k}`} target="_blank" rel="noreferrer" style={btn('outline','sm')}>📥 تصدير CSV</a>
      </Card>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// QR
// ═══════════════════════════════════════════════════════════════
function QRPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [qrErr, setQrErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async()=>{
    if(!code.trim())return;
    setLoading(true);setResult(null);setQrErr(null);
    try { const r=await api(`/qr/verify/${code.trim()}`); setResult(r.data||r); }
    catch(e){setQrErr(e);} finally{setLoading(false);}
  };

  return <div className="anim">
    <PageHead icon="◈" title="نظام QR"/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>🔍 التحقق من كود QR</h3>
        <input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&verify()}
          placeholder="أدخل كود QR أو رقم العضوية..." dir="ltr"
          style={{...inputStyle,marginBottom:10,letterSpacing:'1px'}}/>
        <Btn onClick={verify} disabled={loading} style={{width:'100%',marginBottom:12}}>
          {loading?<Spinner s={16}/>:'🔍 تحقق الآن'}
        </Btn>
        <ErrBanner error={qrErr}/>
        {result&&<div style={{padding:16,background:C.bg,borderRadius:10,border:`1px solid ${result.is_valid?C.greenLt:C.errorLt}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <strong style={{fontSize:15}}>{result.name}</strong>
            <Badge color={result.is_valid?'green':'red'}>{result.is_valid?'✅ معتمد':'❌ غير معتمد'}</Badge>
          </div>
          {[['رقم العضوية',result.membership_number],['الحالة',result.status],
            ['تاريخ الاعتماد',result.approved_at?new Date(result.approved_at).toLocaleDateString('ar'):'—'],
            ['المدينة',result.city],
          ].map(([l,v])=>v&&<div key={l} style={{fontSize:12,color:C.txtSub,marginBottom:4}}>
            {l}: <span style={{color:C.ivory}}>{v}</span>
          </div>)}
        </div>}
      </Card>
      <Card>
        <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>ℹ️ كيف يعمل نظام QR</h3>
        <div style={{fontSize:13,color:C.txtSub,lineHeight:2}}>
          {['كل متطوع معتمد يحصل على QR فريد تلقائياً عند قبول طلبه',
            'QR مشفّر ويحتوي على معرّف المتطوع وتاريخ الانتهاء',
            'يمكن للمشرف إلغاء QR وإعادة إصداره من ملف المتطوع',
            'صفحة التحقق العامة لا تتطلب تسجيل دخول',
            'كل عمليات المسح مسجّلة في سجل التدقيق',
          ].map(t=><div key={t} style={{borderBottom:`1px solid ${C.border}`,padding:'6px 0'}}>• {t}</div>)}
        </div>
        <div style={{marginTop:16,padding:12,background:C.bg,borderRadius:8}}>
          <div style={{fontSize:11,color:C.txtDim,marginBottom:4}}>رابط التحقق العام:</div>
          <code style={{fontSize:11,color:C.gold,wordBreak:'break-all'}}>
            {API_URL}/qr/verify/[code]
          </code>
        </div>
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// FILES
// ═══════════════════════════════════════════════════════════════
function FilesPage() {
  const { data, loading, error, reload } = useFetch('/files');
  const files = data?.data?.files||data?.files||data?.data||[];

  const approve = async id=>{ try{await api(`/files/${id}/approve`,{method:'PATCH'});reload();}catch(e){alert(e.message);} };
  const reject  = async id=>{ try{await api(`/files/${id}/reject`,{method:'PATCH',body:{reason:'مرفوض من الإدارة'}});reload();}catch(e){alert(e.message);} };
  const del     = async id=>{ if(!window.confirm('حذف هذا الملف؟'))return; try{await api(`/files/${id}`,{method:'DELETE'});reload();}catch(e){alert(e.message);} };

  const cols = [
    {label:'اسم الملف',render:f=>f.original_name||f.filename||'—'},
    {label:'النوع',render:f=>f.file_type||f.type||'—'},
    {label:'الحجم',render:f=>f.file_size?`${Math.round(f.file_size/1024)} KB`:'—'},
    {label:'المالك',render:f=>f.user_name||f.uploaded_by||'—'},
    {label:'الحالة',render:f=><Badge color={f.status==='approved'?'green':f.status==='rejected'?'red':'yellow'}>{f.status||'pending'}</Badge>},
    {label:'التاريخ',render:f=>f.created_at?new Date(f.created_at).toLocaleDateString('ar'):'—'},
    {label:'إجراءات',render:f=><div style={{display:'flex',gap:4}}>
      {f.status!=='approved'&&<Btn sz="sm" onClick={()=>approve(f.id)}>✅</Btn>}
      {f.status!=='rejected'&&<Btn v="danger" sz="sm" onClick={()=>reject(f.id)}>❌</Btn>}
      <Btn v="ghost" sz="sm" onClick={()=>del(f.id)}>🗑️</Btn>
    </div>},
  ];

  return <div className="anim">
    <PageHead icon="◉" title="إدارة الملفات"/>
    <div style={{background:'#2E1E0022',border:`1px solid ${C.gold}33`,borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:12,color:C.gold}}>
      ⚠️ تخزين Render مؤقت — أضف CLOUDINARY_URL في متغيرات Render لحفظ الملفات بشكل دائم
    </div>
    <ErrBanner error={error} onRetry={reload}/>
    <Card>{loading?<Loading/>:<DataTable cols={cols} rows={files} empty="لا توجد ملفات مرفوعة"/>}</Card>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// IDENTITY
// ═══════════════════════════════════════════════════════════════
function IdentityPage() {
  return <div className="anim">
    <PageHead icon="◎" title="التحقق من الهوية"/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:12}}>🪪 إدارة مستندات الهوية</h3>
        <div style={{fontSize:13,color:C.txtSub,lineHeight:2,marginBottom:16}}>
          {['الهوية الوطنية السعودية','الإقامة','جواز السفر','الصورة الشخصية','شهادات المؤهلات','شهادات الخبرة'].map(d=>
            <div key={d} style={{borderBottom:`1px solid ${C.border}`,padding:'5px 0'}}>• {d}</div>)}
        </div>
        <h4 style={{fontSize:12,color:C.txtDim,marginBottom:8}}>حالات التحقق:</h4>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {[['غير مكتمل','grey'],['قيد المراجعة','yellow'],['معتمد','green'],['مرفوض','red'],['منتهي الصلاحية','red']].map(([l,c])=>
            <Badge key={l} color={c}>{l}</Badge>)}
        </div>
      </Card>
      <Card style={{textAlign:'center',padding:36}}>
        <div style={{fontSize:48,marginBottom:12}}>🪪</div>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:8}}>هذه الخدمة جاهزة في لوحة التحكم</h3>
        <p style={{fontSize:13,color:C.txtSub,lineHeight:1.8,marginBottom:16}}>
          مراجعة واعتماد مستندات هوية المتطوعين.<br/>
          تنبيه تلقائي قبل انتهاء الصلاحية بـ 30 يوم.<br/>
          إدارة المستندات متاحة من ملف كل متطوع.
        </p>
        <Badge color="yellow">تنتظر تفعيل endpoint في Backend</Badge>
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// NUSUK
// ═══════════════════════════════════════════════════════════════
function NusukPage() {
  const [form,setForm]=useState({permit_number:'',id_number:'',visitor_type:'pilgrim'});
  const [result,setResult]=useState(null);
  const [nErr,setNErr]=useState(null);
  const [loading,setLoading]=useState(false);
  const { data: logsData, loading: logsLoading } = useFetch('/nusuk/logs');
  const logs = logsData?.data?.logs||logsData?.logs||[];

  const verify=async()=>{
    setLoading(true);setResult(null);setNErr(null);
    try{const r=await api('/nusuk/verify',{method:'POST',body:form});setResult(r.data||r);}
    catch(e){setNErr(e);}finally{setLoading(false);}
  };

  const cols=[
    {label:'رقم التصريح',key:'permit_number'},
    {label:'نوع الزائر',key:'visitor_type'},
    {label:'الحالة',render:l=><Badge color={l.status==='approved'?'green':'red'}>{l.status}</Badge>},
    {label:'التاريخ',render:l=>l.created_at?new Date(l.created_at).toLocaleDateString('ar'):'—'},
  ];

  return <div className="anim">
    <PageHead icon="◆" title="نسك — ضيوف الرحمن"/>
    <div style={{background:'#0A1A2E',border:'1px solid #1A3A5E',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#64B5F6'}}>
      ℹ️ تعمل بـ Mock Provider — الربط الرسمي يحتاج API من وزارة الحج والعمرة
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16,marginBottom:16}}>
      <Card>
        <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>التحقق من زائر</h3>
        <TField label="رقم التصريح" value={form.permit_number} onChange={v=>setForm(p=>({...p,permit_number:v}))} dir="ltr"/>
        <TField label="رقم الهوية / الجواز" value={form.id_number} onChange={v=>setForm(p=>({...p,id_number:v}))} dir="ltr"/>
        <Field label="نوع الزائر">
          <select value={form.visitor_type} onChange={e=>setForm(p=>({...p,visitor_type:e.target.value}))} style={selectStyle}>
            <option value="pilgrim">حاج</option>
            <option value="umrah">معتمر</option>
            <option value="visitor">زائر</option>
          </select>
        </Field>
        <Btn onClick={verify} disabled={loading} style={{width:'100%'}}>{loading?'...':'🔍 تحقق'}</Btn>
        <ErrBanner error={nErr}/>
        {result&&<div style={{marginTop:14,padding:12,background:C.bg,borderRadius:8}}>
          <Badge color={result.status==='approved'?'green':'red'}>{result.status_label||result.status}</Badge>
          {result.name&&<div style={{marginTop:6,fontSize:12,color:C.txtSub}}>الاسم: <span style={{color:C.ivory}}>{result.name}</span></div>}
        </div>}
      </Card>
      <Card>
        <h3 style={{fontSize:13,color:C.txtSub,marginBottom:14}}>سجل عمليات التحقق</h3>
        {logsLoading?<Loading/>:<DataTable cols={cols} rows={logs} empty="لا توجد سجلات"/>}
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// NAFATH
// ═══════════════════════════════════════════════════════════════
function NafathPage() {
  const [enabled,setEnabled]=useState(false);
  const [form,setForm]=useState({client_id:'',client_secret:'',callback_url:''});
  return <div className="anim">
    <PageHead icon="◇" title="نفاذ — التحقق الوطني"/>
    <div style={{background:'#0A1A2E',border:'1px solid #1A3A5E',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#64B5F6'}}>
      ℹ️ نفاذ هو نظام الهوية الرقمية الوطني السعودي — يحتاج تسجيلاً رسمياً مع المنصة الوطنية
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card>
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:14}}>إعدادات الربط</h3>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:12,background:C.bg,borderRadius:8}}>
          <label style={{fontSize:14,flex:1}}>تفعيل نفاذ</label>
          <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} style={{width:18,height:18}}/>
          <Badge color={enabled?'yellow':'grey'}>{enabled?'Mock':'معطل'}</Badge>
        </div>
        <TField label="Client ID" value={form.client_id} onChange={v=>setForm(p=>({...p,client_id:v}))} dir="ltr" placeholder="من بوابة نفاذ الرسمية"/>
        <TField label="Client Secret" value={form.client_secret} onChange={v=>setForm(p=>({...p,client_secret:v}))} dir="ltr"/>
        <TField label="Callback URL" value={form.callback_url} onChange={v=>setForm(p=>({...p,callback_url:v}))} dir="ltr" placeholder="https://sagya-backend-production.onrender.com/api/auth/nafath/callback"/>
        <Btn v="ghost" style={{width:'100%',opacity:.7}}>💾 حفظ (يحتاج موافقة رسمية)</Btn>
      </Card>
      <Card style={{padding:36,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>🔐</div>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:8}}>نفاذ — التحقق الرسمي</h3>
        <p style={{fontSize:13,color:C.txtSub,lineHeight:1.8}}>
          يتيح للمتطوعين تسجيل الدخول بهوياتهم الوطنية<br/>
          والتحقق الفوري من هويات المتطوعين الجدد<br/>
          يتطلب تسجيلاً رسمياً في المنصة الوطنية
        </p>
        <div style={{marginTop:16}}><Badge color="yellow">قيد التطوير</Badge></div>
      </Card>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════
function SettingsPage() {
  const { data, loading, error, reload } = useFetch('/settings');
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    if(!data)return;
    const s=data.data?.settings||data.settings||data.data||{};
    if(Array.isArray(s)){const o={};s.forEach(i=>i.key&&(o[i.key]=i.value));setForm(o);}
    else setForm(s);
  },[data]);

  const save=async()=>{
    setSaving(true);
    try { await api('/settings',{method:'PATCH',body:form}); setSaved(true); setTimeout(()=>setSaved(false),3000); }
    catch(e){alert(e.message);} finally{setSaving(false);}
  };

  const sections=[
    {t:'عام',f:[['app_name','اسم التطبيق'],['support_email','بريد الدعم'],['support_phone','هاتف الدعم'],['privacy_url','رابط الخصوصية'],['terms_url','رابط الشروط']]},
    {t:'SMS',f:[['sms_provider','مزود SMS'],['sms_sender','اسم المرسل'],['sms_template_otp','قالب OTP']]},
    {t:'QR',f:[['qr_expiry_days','مدة الصلاحية (أيام)'],['qr_size','حجم QR']]},
    {t:'خرائط',f:[['maps_provider','مزود الخرائط'],['maps_api_key','Maps API Key']]},
  ];

  return <div className="anim">
    <PageHead icon="⚙" title="الإعدادات"/>
    <ErrBanner error={error} onRetry={reload}/>
    {saved&&<div style={{background:'#0C2E18',border:`1px solid ${C.green}`,borderRadius:8,padding:'10px 14px',marginBottom:14,color:C.greenGlow}}>✅ تم حفظ الإعدادات بنجاح</div>}
    {loading?<Loading/>:<>
      {sections.map(sec=><Card key={sec.t} style={{marginBottom:14}}>
        <h3 style={{fontSize:14,color:C.gold,marginBottom:14}}>{sec.t}</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {sec.f.map(([f,l])=><TField key={f} label={l} value={form[f]||''} onChange={v=>setForm(p=>({...p,[f]:v}))} dir="ltr"/>)}
        </div>
      </Card>)}
      <Btn onClick={save} disabled={saving} sz="lg">{saving?'جاري الحفظ...':'💾 حفظ جميع الإعدادات'}</Btn>
    </>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
function Sidebar({ active, onNav, user, onLogout }) {
  return <div style={{width:225,background:C.bgSide,borderLeft:`1px solid ${C.border}`,position:'fixed',top:0,right:0,bottom:0,display:'flex',flexDirection:'column',zIndex:100}}>
    <div style={{padding:'18px 14px 12px',borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:34,height:34,borderRadius:'50%',background:`linear-gradient(135deg,${C.green},${C.greenLt})`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 5 8 5 13C5 17 8 20 12 20C16 20 19 17 19 13C19 8 12 2 12 2Z" fill="white" opacity=".9"/>
            <circle cx="12" cy="14" r="3" fill="white" opacity=".5"/>
          </svg>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.ivory}}>سقيا الحرمين</div>
          <div style={{fontSize:10,color:C.txtDim}}>لوحة الإدارة</div>
        </div>
      </div>
    </div>
    <nav style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
      {NAV.map(item=>{
        const isA=active===item.id;
        return <button key={item.id} onClick={()=>onNav(item.id)} style={{
          display:'flex',alignItems:'center',gap:9,width:'100%',padding:'8px 14px',border:'none',
          background:isA?`${C.green}22`:'transparent',
          color:isA?C.greenGlow:C.txtSub,
          fontSize:12,fontWeight:isA?600:400,cursor:'pointer',textAlign:'right',
          borderRight:isA?`3px solid ${C.greenLt}`:'3px solid transparent',
          transition:'all .15s',
        }}><span style={{fontSize:10,opacity:.6}}>{item.icon}</span><span>{item.label}</span></button>;
      })}
    </nav>
    <div style={{padding:'10px 14px',borderTop:`1px solid ${C.border}`}}>
      <div style={{fontSize:11,color:C.txtDim,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||user?.phone||'المشرف'}</div>
      <Badge color="green">{user?.role||'admin'}</Badge>
      <button onClick={onLogout} style={{marginTop:10,width:'100%',padding:7,border:`1px solid ${C.error}55`,borderRadius:7,background:`${C.error}11`,color:'#E87070',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
        تسجيل الخروج
      </button>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════
const PAGES = {
  dashboard:DashboardPage, users:UsersPage, requests:RequestsPage,
  volunteers:VolunteersPage, tasks:TasksPage, donations:DonationsPage,
  campaigns:CampaignsPage, payments:PaymentsPage, notifications:NotificationsPage,
  reports:ReportsPage, qr:QRPage, files:FilesPage,
  identity:IdentityPage, nusuk:NusukPage, nafath:NafathPage, settings:SettingsPage,
};

export default function App() {
  const [user, setUser] = useState(()=>{ try{return JSON.parse(localStorage.getItem('sagya_user'));}catch{return null;} });
  const [page, setPage] = useState('dashboard');

  useEffect(()=>{
    const s=document.createElement('style');
    s.textContent=CSS;
    document.head.appendChild(s);
    return ()=>document.head.removeChild(s);
  },[]);

  if(!user||!localStorage.getItem('sagya_token')) {
    return <LoginPage onLogin={u=>setUser(u)}/>;
  }

  const logout=()=>{ localStorage.clear(); setUser(null); };
  const PageComp = PAGES[page]||DashboardPage;
  const nav = NAV.find(n=>n.id===page);

  return <div style={{display:'flex',minHeight:'100vh',background:C.bg}}>
    <Sidebar active={page} onNav={setPage} user={user} onLogout={logout}/>
    <div style={{marginRight:225,flex:1,display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <div style={{background:C.bgSide,borderBottom:`1px solid ${C.border}`,padding:'12px 26px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:50}}>
        <div style={{fontSize:15,fontWeight:600,color:C.ivory,display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:C.gold}}>{nav?.icon}</span>{nav?.label}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:C.greenGlow,display:'inline-block',boxShadow:`0 0 5px ${C.greenGlow}`}}/>
          <span style={{fontSize:12,color:C.txtSub}}>متصل</span>
          <span style={{fontSize:12,color:C.txtDim}}>{user?.name||user?.phone}</span>
          <Badge color="green">{user?.role||'admin'}</Badge>
        </div>
      </div>
      <main style={{flex:1,padding:'22px 26px',overflowY:'auto'}}>
        <PageComp/>
      </main>
    </div>
  </div>;
}
