import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SettingsProvider, useSettings } from '../context/SettingsContext'
import NotificationBell from './NotificationBell'

const SIDEBAR_BG = 'linear-gradient(160deg, #080b24 0%, #0d1140 100%)'

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
         ${isActive ? 'text-white' : 'text-white/50 hover:text-white/85 hover:bg-white/[0.05]'}`
      }
      style={({ isActive }) => isActive ? {
        background: 'rgba(255,255,255,0.08)',
        boxShadow: 'inset 2px 0 0 #ff2e7e',
      } : {}}>
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      {label}
    </NavLink>
  )
}

function LayoutInner() {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen" style={{ background: 'var(--el-soft)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col flex-shrink-0 relative" style={{ background: SIDEBAR_BG }}>
        {/* dot pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

        {/* top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #ff2e7e, #00e0ff)' }} />

        {/* Org header */}
        <div className="relative px-4 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            {settings.orgLogo
              ? <img src={settings.orgLogo} alt="logo" className="w-9 h-9 object-contain rounded-lg flex-shrink-0 bg-white/10" />
              : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ff2e7e, #00e0ff)' }}>
                  {settings.orgName?.charAt(0)}
                </div>
            }
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm leading-tight truncate">{settings.orgName}</h1>
              <p className="text-white/40 text-xs truncate">{settings.orgTagline}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItem to="/dashboard" label="Dashboard" icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          } />
          <NavItem to="/requests" label="คำขอของฉัน" icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          } />
          {(user?.role === 'approver' || user?.role === 'admin') && (
            <NavItem to="/approvals" label="รออนุมัติ" icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            } />
          )}

          <NotificationBell />

          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-1 px-1">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Admin</p>
              </div>
              <NavItem to="/admin/templates" label="Workflow Templates" icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              } />
              <NavItem to="/admin/users" label="จัดการผู้ใช้" icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              } />
              <NavItem to="/admin/reports" label="รายงาน" icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              } />
              <NavItem to="/admin/settings" label="ตั้งค่าระบบ" icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              } />
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="relative px-3 py-2.5 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl">
            <NavLink to="/profile" className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff2e7e, #00e0ff)' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                <p className="text-white/40 text-[10px] truncate">{user?.email}</p>
              </div>
            </NavLink>
            <button onClick={handleLogout}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.07] transition-colors flex-shrink-0"
              title="ออกจากระบบ">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto el-bg">
        <Outlet />
      </main>
    </div>
  )
}

export default function Layout() {
  return (
    <SettingsProvider>
      <LayoutInner />
    </SettingsProvider>
  )
}
