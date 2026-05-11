import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import dayjs from 'dayjs'

export default function ApprovalsPage() {
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/approvals').then(r => setSteps(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-7">
        <div className="el-eyebrow">Approvals</div>
        <h2 className="text-[32px] font-bold text-[#0a0d2e]">รออนุมัติ</h2>
        <p className="text-[18px] text-[#6b7390] mt-1">คำขอที่รอการอนุมัติจากคุณ</p>
      </div>

      {loading && <div className="text-center py-12" style={{ color: 'var(--el-muted)' }}>กำลังโหลด...</div>}

      {!loading && steps.length === 0 && (
        <div className="el-card text-center py-16">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: 'var(--el-ink)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold" style={{ color: 'var(--el-muted)' }}>ไม่มีคำขอรออนุมัติ</p>
          <p className="text-sm mt-1" style={{ color: 'var(--el-muted)' }}>คุณทันงานแล้ว!</p>
        </div>
      )}

      <div className="space-y-3">
        {steps.map(s => (
          <Link key={s.id} to={`/requests/${s.request.id}`}
            className="block el-card p-5 hover:shadow-md transition-all"
            style={{ borderColor: 'var(--el-line)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--el-pink)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--el-line)'}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>{s.request.requestNumber}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, var(--el-pink), var(--el-cyan))' }}>
                    {s.templateStep?.name}
                  </span>
                  {s.isDelegate && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'var(--el-amber-soft)', color: '#b97600' }}>
                      มอบหมายแทน {s.delegatingFor}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--el-ink)' }}>{s.request.title}</h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--el-muted)' }}>
                  {s.request.template?.name} · ส่งโดย {s.request.requester?.name}
                  {s.request.requester?.department ? ` (${s.request.requester.department})` : ''}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs mb-1" style={{ color: 'var(--el-muted)' }}>{dayjs(s.createdAt).format('D/M/YYYY')}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--el-pink)' }}>
                  ดูและอนุมัติ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
