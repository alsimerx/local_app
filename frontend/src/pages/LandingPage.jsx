import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const goStaff = () => navigate(user ? '/dashboard' : '/login')

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: `
        radial-gradient(ellipse at 15% -5%, rgba(255,46,126,.38) 0%, transparent 50%),
        radial-gradient(ellipse at 90% 105%, rgba(0,224,255,.28) 0%, transparent 50%),
        linear-gradient(180deg, #080b24 0%, #050720 100%)
      `,
    }}>
      {/* dot grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-lg flex-shrink-0">
            <img src="/logo.jpg" alt="" className="w-full h-full rounded-full object-contain"
              onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">อบต.แหลมสน</div>
            <div className="text-white/45 text-[10px] tracking-[0.18em] uppercase">e-Service Online</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_#00e0ff]" />
          ระบบพร้อมให้บริการ
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="text-center mb-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 border"
            style={{ background: 'rgba(255,46,126,0.1)', borderColor: 'rgba(255,46,126,0.3)', color: '#ff7eb3' }}>
            ✦ ระบบบริการออนไลน์ครบวงจร
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
            บริการประชาชน<br />
            <span style={{ background: 'linear-gradient(90deg, #ff2e7e, #00e0ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              ออนไลน์ ง่าย รวดเร็ว
            </span>
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            ยื่นคำร้อง ติดตามสถานะ และรับบริการจากองค์การบริหารส่วนตำบลแหลมสน<br className="hidden lg:block" />
            ได้ทุกที่ ทุกเวลา ไม่ต้องเดินทาง
          </p>
        </div>

        {/* Two cards */}
        <div className="grid sm:grid-cols-2 gap-5 w-full max-w-2xl">

          {/* Card 1 — ประชาชน */}
          <button onClick={() => navigate('/petition')}
            className="group relative rounded-2xl p-7 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            style={{
              background: 'rgba(15,18,50,0.7)',
              border: '1px solid rgba(255,46,126,0.25)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,46,126,0.6)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,46,126,0.25)'}>

            {/* glow */}
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl transition-opacity"
              style={{ background: 'linear-gradient(90deg, transparent, #ff2e7e, transparent)', opacity: 0.6 }} />

            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(255,46,126,0.15)', border: '1px solid rgba(255,46,126,0.3)' }}>
              <svg className="w-6 h-6" fill="none" stroke="#ff2e7e" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5" style={{ color: '#ff7eb3' }}>
              สำหรับประชาชน
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ยื่นคำร้องออนไลน์</h2>
            <p className="text-white/45 text-sm leading-relaxed mb-5">
              แจ้งซ่อม ร้องเรียน ขอเอกสาร และบริการต่างๆ โดยไม่ต้องสมัครสมาชิก
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3" style={{ color: '#ff2e7e' }}>
              ยื่นคำร้องเลย
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>

          {/* Card 2 — เจ้าหน้าที่ */}
          <button onClick={goStaff}
            className="group relative rounded-2xl p-7 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            style={{
              background: 'rgba(15,18,50,0.7)',
              border: '1px solid rgba(0,224,255,0.2)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,224,255,0.55)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,224,255,0.2)'}>

            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, #00e0ff, transparent)', opacity: 0.5 }} />

            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(0,224,255,0.1)', border: '1px solid rgba(0,224,255,0.25)' }}>
              <svg className="w-6 h-6" fill="none" stroke="#00e0ff" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5" style={{ color: '#00e0ff' }}>
              สำหรับเจ้าหน้าที่
            </div>
            <h2 className="text-xl font-bold text-white mb-2">ระบบจัดการคำร้อง</h2>
            <p className="text-white/45 text-sm leading-relaxed mb-5">
              อนุมัติ ติดตาม และจัดการคำร้องทั้งหมด พร้อมรายงานสถิติ
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold transition-all group-hover:gap-3" style={{ color: '#00e0ff' }}>
              {user ? 'เข้าสู่ระบบ' : 'เข้าสู่ระบบเจ้าหน้าที่'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8 mt-12 text-center">
          {[['ไม่ต้องเดินทาง', '24/7'], ['ติดตามสถานะ', 'Real-time'], ['ปลอดภัย', '100%']].map(([label, val]) => (
            <div key={label}>
              <div className="text-xl font-extrabold text-white">{val}</div>
              <div className="text-white/35 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center py-5 text-white/20 text-xs border-t border-white/[0.05]">
        © องค์การบริหารส่วนตำบลแหลมสน · พัฒนาโดยกองการศึกษาฯ
      </footer>
    </div>
  )
}
