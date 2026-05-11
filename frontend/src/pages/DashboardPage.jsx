import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

const STAT_CARDS = [
  {
    key: 'myPending',
    label: 'รออนุมัติ',
    color: 'var(--el-pink)', soft: 'var(--el-pink-soft)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    key: 'myApproved',
    label: 'อนุมัติแล้ว',
    color: '#0099b3', soft: 'var(--el-cyan-soft)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    key: 'myRejected',
    label: 'ถูกปฏิเสธ',
    color: '#dc2626', soft: '#fee2e2',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    key: 'waitingForMe',
    label: 'รอฉันอนุมัติ',
    color: '#b97600', soft: 'var(--el-amber-soft)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
]

function StatCard({ label, value, color, soft, icon }) {
  return (
    <div className="el-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: soft }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color }}>{icon}</svg>
      </div>
      <div>
        <p className="text-[28px] font-bold leading-tight" style={{ color: 'var(--el-ink)' }}>{value ?? '—'}</p>
        <p className="text-sm" style={{ color: 'var(--el-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 bg-el-line rounded-lg mb-1" />
        <div className="h-4 w-32 bg-el-line rounded mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-el-line rounded-2xl" />)}
        </div>
      </div>
    </div>
  )

  const { stats, recentRequests, pendingApprovals } = data || {}

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h2 className="text-[32px] font-bold text-[#0a0d2e]">สวัสดี, {user?.name} 👋</h2>
          <p className="text-[18px] text-[#6b7390] mt-1">{dayjs().locale('th').format('dddd D MMMM YYYY')}</p>
        </div>
        <Link to="/requests/new" className="el-btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างคำขอใหม่
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {STAT_CARDS.map(c => (
          <StatCard key={c.key} label={c.label} value={stats?.[c.key]} color={c.color} soft={c.soft} icon={c.icon} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Requests */}
        <div className="el-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-el-line">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(var(--el-pink), var(--el-cyan))' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--el-ink)' }}>คำขอล่าสุดของฉัน</h3>
            </div>
            <Link to="/requests"
              className="text-xs font-semibold px-3 py-1 rounded-lg border border-el-line hover:border-el-pink transition-colors"
              style={{ color: 'var(--el-muted)' }}>
              ดูทั้งหมด
            </Link>
          </div>
          <div className="divide-y divide-el-line">
            {recentRequests?.length === 0 && (
              <div className="flex flex-col items-center py-10" style={{ color: 'var(--el-muted)' }}>
                <svg className="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">ยังไม่มีคำขอ</p>
              </div>
            )}
            {recentRequests?.map(r => (
              <Link key={r.id} to={`/requests/${r.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-el-soft transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--el-ink)' }}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--el-muted)' }}>{r.requestNumber} · {r.template?.name}</p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <StatusBadge status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        {(user?.role === 'approver' || user?.role === 'admin') && (
          <div className="el-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-el-line">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(var(--el-cyan), #0099b3)' }} />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--el-ink)' }}>รอฉันอนุมัติ</h3>
              </div>
              <Link to="/approvals"
                className="text-xs font-semibold px-3 py-1 rounded-lg border border-el-line hover:border-el-cyan transition-colors"
                style={{ color: 'var(--el-muted)' }}>
                ดูทั้งหมด
              </Link>
            </div>
            <div className="divide-y divide-el-line">
              {pendingApprovals?.length === 0 && (
                <div className="flex flex-col items-center py-10" style={{ color: 'var(--el-muted)' }}>
                  <svg className="w-8 h-8 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">ไม่มีคำขอรออนุมัติ</p>
                </div>
              )}
              {pendingApprovals?.map(s => (
                <Link key={s.id} to={`/requests/${s.request.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-el-soft transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--el-ink)' }}>{s.request.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--el-muted)' }}>{s.request.requester?.name} · {s.request.template?.name}</p>
                  </div>
                  <span className="ml-3 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, var(--el-pink), var(--el-cyan))' }}>
                    {s.templateStep?.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
