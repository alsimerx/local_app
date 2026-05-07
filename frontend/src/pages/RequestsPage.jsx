import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import dayjs from 'dayjs'

const STATUSES = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'รออนุมัติ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'rejected', label: 'ปฏิเสธ' },
  { value: 'returned', label: 'ส่งกลับแก้ไข' },
  { value: 'cancelled', label: 'ยกเลิก' },
]

export default function RequestsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [requests, setRequests] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = { page, limit: 15 }
    if (status) params.status = status
    if (search) params.search = search
    api.get('/requests', { params })
      .then(r => { setRequests(r.data.data); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [status, search, page])

  const handleDelete = async (r) => {
    if (!confirm(`ลบคำขอ "${r.title}" (${r.requestNumber}) หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return
    try {
      await api.delete(`/requests/${r.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  const totalPages = Math.ceil(total / 15)
  const colSpan = isAdmin ? 6 : 5

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isAdmin ? 'คำขอทั้งหมดในระบบ' : 'คำขอของฉัน'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin ? `ทั้งหมด ${total} รายการ` : 'รายการคำขออนุมัติทั้งหมดของคุณ'}
          </p>
        </div>
        {!isAdmin && (
          <Link to="/requests/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            สร้างคำขอใหม่
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder={isAdmin ? 'ค้นหาชื่อ, เลขที่คำขอ, หรือผู้สร้าง...' : 'ค้นหาชื่อหรือเลขที่คำขอ...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => { setStatus(s.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === s.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-600">เลขที่คำขอ</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">ชื่อเรื่อง</th>
              {isAdmin && <th className="text-left px-5 py-3 font-medium text-gray-600">ผู้สร้าง</th>}
              <th className="text-left px-5 py-3 font-medium text-gray-600">ประเภท</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">วันที่สร้าง</th>
              {isAdmin && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={colSpan} className="text-center py-12 text-gray-400">กำลังโหลด...</td></tr>
            )}
            {!loading && requests.length === 0 && (
              <tr><td colSpan={colSpan} className="text-center py-12 text-gray-400">ไม่พบคำขอ</td></tr>
            )}
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link to={`/requests/${r.id}`} className="text-blue-600 hover:underline font-mono text-xs">{r.requestNumber}</Link>
                </td>
                <td className="px-5 py-3">
                  <Link to={`/requests/${r.id}`} className="font-medium text-gray-900 hover:text-blue-600">{r.title}</Link>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3">
                    <p className="text-gray-700 text-xs font-medium">{r.requester?.name}</p>
                    {r.requester?.department && <p className="text-gray-400 text-xs">{r.requester.department}</p>}
                  </td>
                )}
                <td className="px-5 py-3 text-gray-500">{r.template?.name}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-gray-400 text-xs">{dayjs(r.createdAt).format('D/M/YYYY HH:mm')}</td>
                {isAdmin && (
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(r)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                      ลบ
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">ทั้งหมด {total} รายการ</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 hover:bg-gray-50">
                ก่อนหน้า
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">หน้า {page}/{totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40 hover:bg-gray-50">
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
