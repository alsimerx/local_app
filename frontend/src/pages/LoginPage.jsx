import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ============================================================
   Login — Electric palette (magenta × cyan on ink)
   Drop-in replacement for src/pages/LoginPage.jsx
   Requires: Tailwind (already configured), Sarabun font (already loaded),
             react-router-dom, AuthContext (already in project).
   ============================================================ */

const TEST_ACCOUNTS = [
  { role: 'ผู้ดูแลระบบ', email: 'admin@company.com',    pass: 'admin123'    },
  { role: 'ผู้อนุมัติ',   email: 'manager@company.com',  pass: 'approver123' },
  { role: 'ผู้ใช้งาน',    email: 'employee@company.com', pass: 'user123'     },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  const fillTest = a => { setForm({ email: a.email, password: a.pass }); setError('') }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col text-white"
      style={{
        background: `
          radial-gradient(ellipse at 20% -10%, rgba(255,46,126,.35) 0%, transparent 55%),
          radial-gradient(ellipse at 110% 110%, rgba(0,224,255,.28) 0%, transparent 55%),
          linear-gradient(180deg, #0a0d2e 0%, #050720 100%)
        `,
      }}
    >
      {/* ── background blobs ── */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full opacity-55"
          style={{ background: 'radial-gradient(circle at 35% 30%, #00e0ff, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute top-20 -right-20 w-[320px] h-[460px] opacity-50 rotate-[-25deg]"
          style={{ background: 'radial-gradient(circle at 60% 40%, #ff2e7e, transparent 75%)', filter: 'blur(50px)', borderRadius: '60% 40% 60% 40% / 50% 50% 50% 50%' }}
        />
        <div
          className="absolute bottom-10 left-[12%] w-[240px] h-[240px] rounded-full opacity-45"
          style={{ background: 'radial-gradient(circle, #ffd23f, transparent 80%)', filter: 'blur(50px)' }}
        />
        {/* line decoration */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1280 800" preserveAspectRatio="none">
          <path d="M-50 720 Q 400 580 720 660 T 1330 580" stroke="rgba(255,210,63,.55)" strokeWidth="1.5" fill="none" />
          <path d="M-50 760 Q 400 620 720 700 T 1330 620" stroke="rgba(0,224,255,.4)" strokeWidth="1" fill="none" />
        </svg>
        {/* faint grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
        {/* dot noise */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.06) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      {/* ── top bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-10 py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            หน้าหลัก
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white p-0.5 shadow-lg">
            <img src="/logo.jpg" alt="" className="w-full h-full object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">อบต.แหลมสน</div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-white/55">e-Workflow</div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs text-white/60 bg-white/5 border border-white/10 backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#00e0ff] animate-pulse" />
          ระบบใช้งานปกติ
        </div>
      </header>

      {/* ── card ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* glow behind card */}
        <div
          className="pointer-events-none absolute w-[420px] h-[420px] rounded-full opacity-35"
          style={{ background: 'radial-gradient(circle, #ff2e7e 0%, transparent 65%)', filter: 'blur(80px)' }}
        />

        <div
          className="relative w-full max-w-[440px] rounded-3xl px-9 pt-7 pb-8 backdrop-blur-xl"
          style={{
            background: 'rgba(15,18,50,.72)',
            border: '1px solid rgba(255,255,255,.08)',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.04), inset 0 1px 0 rgba(255,255,255,.1)',
          }}
        >
          {/* gradient border glow */}
          <div
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-40 -z-10 blur-[1px]"
            style={{ background: 'linear-gradient(135deg, #ff2e7e 0%, transparent 30%, transparent 70%, #00e0ff 100%)' }}
          />

          {/* seal */}
          <div className="relative w-[84px] h-[84px] mx-auto -mt-16">
            <div className="absolute -inset-[10px] rounded-full border-2 border-dashed border-amber-300/80 animate-[spin_28s_linear_infinite]" />
            <div className="absolute inset-1 rounded-full border border-cyan-300/40" />
            <img
              src="/logo.jpg"
              alt="ตราหน่วยงาน"
              className="relative z-10 w-full h-full rounded-full bg-white p-1.5 object-contain"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,.5), 0 0 0 4px rgba(255,255,255,.06), 0 0 30px #ff2e7e' }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          </div>

          {/* head */}
          <div className="text-center mt-4 mb-6">
            <div
              className="text-[11px] font-bold tracking-[0.22em] uppercase"
              style={{ background: 'linear-gradient(90deg, #ff2e7e, #00e0ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >
              ระบบขออนุมัติเอกสารออนไลน์
            </div>
            <h1 className="text-3xl font-extrabold mt-1 tracking-tight">เข้าสู่ระบบ</h1>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className="w-7 h-px" style={{ background: 'linear-gradient(90deg, transparent, #ffd23f, transparent)' }} />
              <span className="w-2 h-2 rotate-45 bg-amber-300 shadow-[0_0_12px_#ffd23f]" />
              <span className="w-7 h-px" style={{ background: 'linear-gradient(90deg, transparent, #ffd23f, transparent)' }} />
            </div>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field icon="mail" filled={!!form.email}>
              <input
                type="email" required
                value={form.email}
                placeholder="อีเมลของท่าน"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/35 py-0.5"
              />
            </Field>
            <Field icon="lock" filled={!!form.password}>
              <input
                type={showPass ? 'text' : 'password'} required
                value={form.password}
                placeholder="รหัสผ่าน"
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/35 py-0.5"
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="text-white/35 hover:text-cyan-300">
                <Icon name={showPass ? 'eyeOff' : 'eye'} className="w-4 h-4" />
              </button>
            </Field>

            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-2 text-[13px] text-white/55 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="hidden peer" />
                <span className="w-4 h-4 rounded border-[1.5px] border-white/25 inline-flex items-center justify-center peer-checked:bg-cyan-300 peer-checked:border-cyan-300 peer-checked:shadow-[0_0_12px_rgba(0,224,255,.6)] peer-checked:[&>svg]:opacity-100">
                  <svg viewBox="0 0 12 12" className="w-3 h-3 opacity-0">
                    <path d="M2 6 5 9 10 3" fill="none" stroke="#0a0d2e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                จดจำฉันไว้
              </label>
              <button type="button" className="text-[13px] font-semibold text-cyan-300 hover:underline">ลืมรหัสผ่าน?</button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm border" style={{ background: 'rgba(244,63,94,.12)', borderColor: 'rgba(244,63,94,.35)', color: '#fca5a5' }}>
                <Icon name="alert" className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative h-[50px] rounded-xl font-bold text-sm tracking-wide overflow-hidden transition-transform hover:-translate-y-px disabled:opacity-80 disabled:cursor-wait"
              style={{
                background: 'linear-gradient(135deg, #ff2e7e, #00e0ff)',
                boxShadow: '0 12px 32px -8px rgba(255,46,126,.6), inset 0 0 0 1px rgba(255,255,255,.15)',
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Icon name="spinner" className="w-4 h-4" /> กำลังตรวจสอบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </span>
            </button>

            <div className="flex items-center gap-3 text-[11px] text-white/35">
              <span className="flex-1 h-px bg-white/10" /> หรือ <span className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-2.5 h-[46px] rounded-xl text-sm font-semibold border-[1.5px] border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-cyan-300 transition"
            >
              <span
                className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[11px] font-extrabold"
                style={{ background: 'linear-gradient(135deg, #d52b1e, #002868)', boxShadow: '0 2px 8px rgba(213,43,30,.4)' }}
              >TH</span>
              เข้าสู่ระบบด้วย ThaID
            </button>
          </form>

          {/* test accounts */}
          <div className="mt-5 pt-4 border-t border-dashed border-white/10">
            <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/35 mb-2">บัญชีทดสอบ</div>
            <div className="grid grid-cols-3 gap-1.5">
              {TEST_ACCOUNTS.map(a => (
                <button
                  key={a.email} type="button" onClick={() => fillTest(a)}
                  className="text-left flex flex-col gap-0.5 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-cyan-300 transition"
                >
                  <span className="text-[11px] font-bold text-white">{a.role}</span>
                  <span className="text-[10px] text-white/40 truncate">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-[11px] text-white/35">© องค์การบริหารส่วนตำบลแหลมสน · พัฒนาโดยกองการศึกษาฯ</p>
      </main>
    </div>
  )
}

/* ── small helpers ── */
function Field({ icon, filled, children }) {
  return (
    <label
      className={
        'flex items-center gap-3 px-3.5 py-3 rounded-xl border-[1.5px] transition-all ' +
        'bg-white/[0.04] border-white/[0.12] focus-within:bg-white/[0.06] focus-within:border-cyan-300 focus-within:shadow-[0_0_0_4px_rgba(0,224,255,0.18)] ' +
        (filled ? 'text-cyan-300' : 'text-white/35')
      }
    >
      <Icon name={icon} className="w-[18px] h-[18px]" />
      {children}
    </label>
  )
}

function Icon({ name, className }) {
  const props = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'mail':   return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
    case 'lock':   return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
    case 'eye':    return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'eyeOff': return <svg {...props}><path d="M3 3l18 18" /><path d="M10.6 6.1A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.2 4M6.6 6.6A18 18 0 0 0 2 12s3.5 6 10 6a10 10 0 0 0 4.4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
    case 'alert':  return <svg {...props} strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>
    case 'spinner':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
          </path>
        </svg>
      )
    default: return null
  }
}
