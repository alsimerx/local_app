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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="el-eyebrow">{isAdmin ? 'Admin' : 'Requests'}</p>
          <h2 className="text-[32px] font-bold text-[#0a0d2e]">
            {isAdmin ? 'คำขอทั้งหมดในระบบ' : 'คำขอของฉัน'}
          </h2>
          <p className="text-[18px] text-[#6b7390] mt-1">
            {isAdmin ? `ทั้งหมด ${total} รายการ` : 'รายการคำขออนุมัติทั้งหมดของคุณ'}
          </p>
        </div>
        {!isAdmin && (
          <Link to="/requests/new" className="el-btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            สร้างคำขอใหม่
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <input
          type="text"
          placeholder={isAdmin ? 'ค้นหาชื่อ, เลขที่คำขอ, หรือผู้สร้าง...' : 'ค้นหาชื่อหรือเลขที่คำขอ...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="el-input w-72"
          style={{ height: '36px', fontSize: '14px', padding: '0 12px' }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => { setStatus(s.value); setPage(1) }}
              className={`el-chip ${status === s.value ? 'active' : ''}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="el-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--el-line)', background: 'var(--el-soft)' }}>
              <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--el-muted)' }}>เลขที่คำขอ</th>
              <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--el-muted)' }}>ชื่อเรื่อง</th>
              {isAdmin && <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--el-muted)' }}>ผู้สร้าง</th>}
              <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--el-muted)' }}>ประเภท</th>
              <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--el-muted)' }}>สถานะ</th>
              <th className="text-left px-5 py-3 font-semibold text-xs" style={{ color: 'var(--el-muted)' }}>วันที่สร้าง</th>
              {isAdmin && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={colSpan} className="text-center py-12" style={{ color: 'var(--el-muted)' }}>กำลังโหลด...</td></tr>
            )}
            {!loading && requests.length === 0 && (
              <tr><td colSpan={colSpan} className="text-center py-12" style={{ color: 'var(--el-muted)' }}>ไม่พบคำขอ</td></tr>
            )}
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-el-soft transition-colors" style={{ borderTop: '1px solid var(--el-line)' }}>
                <td className="px-5 py-3">
                  <Link to={`/requests/${r.id}`} className="font-mono text-xs font-semibold" style={{ color: 'var(--el-pink)' }}>{r.requestNumber}</Link>
                </td>
                <td className="px-5 py-3">
                  <Link to={`/requests/${r.id}`} className="font-medium hover:underline" style={{ color: 'var(--el-ink)' }}>{r.title}</Link>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3">
                    <p className="font-medium text-xs" style={{ color: 'var(--el-ink)' }}>{r.requester?.name}</p>
                    {r.requester?.department && <p className="text-xs" style={{ color: 'var(--el-muted)' }}>{r.requester.department}</p>}
                  </td>
                )}
                <td className="px-5 py-3 text-xs" style={{ color: 'var(--el-muted)' }}>{r.template?.name}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-xs" style={{ color: 'var(--el-muted)' }}>{dayjs(r.createdAt).format('D/M/YYYY HH:mm')}</td>
                {isAdmin && (
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(r)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      ลบ
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--el-line)' }}>
            <p className="text-sm" style={{ color: 'var(--el-muted)' }}>ทั้งหมด {total} รายการ</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-el-line rounded-lg text-sm disabled:opacity-40 hover:bg-el-soft transition-colors"
                style={{ color: 'var(--el-muted)' }}>
                ก่อนหน้า
              </button>
              <span className="px-3 py-1.5 text-sm" style={{ color: 'var(--el-ink)' }}>หน้า {page}/{totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border border-el-line rounded-lg text-sm disabled:opacity-40 hover:bg-el-soft transition-colors"
                style={{ color: 'var(--el-muted)' }}>
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
