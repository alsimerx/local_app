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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">รออนุมัติ</h2>
        <p className="text-sm text-gray-500 mt-0.5">คำขอที่รอการอนุมัติจากคุณ</p>
      </div>

      {loading && <div className="text-gray-400 text-center py-12">กำลังโหลด...</div>}

      {!loading && steps.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
          <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 font-medium">ไม่มีคำขอรออนุมัติ</p>
          <p className="text-gray-400 text-sm mt-1">คุณทันงานแล้ว!</p>
        </div>
      )}

      <div className="space-y-3">
        {steps.map(s => (
          <Link key={s.id} to={`/requests/${s.request.id}`}
            className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">{s.request.requestNumber}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{s.templateStep?.name}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{s.request.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {s.request.template?.name} · ส่งโดย {s.request.requester?.name}
                  {s.request.requester?.department ? ` (${s.request.requester.department})` : ''}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-400">{dayjs(s.createdAt).format('D/M/YYYY')}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
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
