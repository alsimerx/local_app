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
    grad: 'linear-gradient(135deg,#845EC2,#6a4aad)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    key: 'myApproved',
    label: 'อนุมัติแล้ว',
    grad: 'linear-gradient(135deg,#008E9B,#007a85)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    key: 'myRejected',
    label: 'ถูกปฏิเสธ',
    grad: 'linear-gradient(135deg,#e05252,#c43d3d)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    key: 'waitingForMe',
    label: 'รอฉันอนุมัติ',
    grad: 'linear-gradient(135deg,#2C73D2,#1a5bbf)',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
]

function StatCard({ label, value, grad, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: grad }}>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
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
        <div className="h-7 w-48 bg-gray-100 rounded-lg mb-1" />
        <div className="h-4 w-32 bg-gray-100 rounded mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
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
          <h2 className="text-xl font-bold text-gray-900">สวัสดี, {user?.name} 👋</h2>
          <p className="text-gray-400 text-sm mt-0.5">{dayjs().locale('th').format('dddd D MMMM YYYY')}</p>
        </div>
        <Link to="/requests/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#845EC2,#2C73D2)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างคำขอใหม่
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {STAT_CARDS.map(c => (
          <StatCard key={c.key} label={c.label} value={stats?.[c.key]} grad={c.grad} icon={c.icon} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(#845EC2,#2C73D2)' }} />
              <h3 className="font-semibold text-gray-800 text-sm">คำขอล่าสุดของฉัน</h3>
            </div>
            <Link to="/requests" className="text-xs font-medium px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentRequests?.length === 0 && (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">ยังไม่มีคำขอ</p>
              </div>
            )}
            {recentRequests?.map(r => (
              <Link key={r.id} to={`/requests/${r.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.requestNumber} · {r.template?.name}</p>
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(#2C73D2,#008E9B)' }} />
                <h3 className="font-semibold text-gray-800 text-sm">รอฉันอนุมัติ</h3>
              </div>
              <Link to="/approvals" className="text-xs font-medium px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingApprovals?.length === 0 && (
                <div className="flex flex-col items-center py-10 text-gray-400">
                  <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">ไม่มีคำขอรออนุมัติ</p>
                </div>
              )}
              {pendingApprovals?.map(s => (
                <Link key={s.id} to={`/requests/${s.request.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.request.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.request.requester?.name} · {s.request.template?.name}</p>
                  </div>
                  <span className="ml-3 flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg,#2C73D2,#008E9B)' }}>
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
