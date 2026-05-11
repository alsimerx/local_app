import { useState, useEffect } from 'react'
import api from '../../lib/axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

const STATUS_COLORS = {
  approved: '#00e0ff',
  pending: '#ff2e7e',
  rejected: '#EF4444',
  returned: '#F97316',
  cancelled: '#9CA3AF',
  draft: '#CBD5E1',
}

const STATUS_LABEL = {
  approved: 'อนุมัติแล้ว',
  pending: 'รอดำเนินการ',
  rejected: 'ปฏิเสธ',
  returned: 'ส่งกลับ',
  cancelled: 'ยกเลิก',
  draft: 'ร่าง',
}

function SectionCard({ title, children }) {
  return (
    <div className="el-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--el-line)' }}>
        <div className="w-1 h-4 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(var(--el-pink), var(--el-cyan))' }} />
        <h3 className="font-semibold text-sm" style={{ color: 'var(--el-ink)' }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatCard({ label, value, grad, icon }) {
  return (
    <div className="el-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: grad }}>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: 'var(--el-ink)' }}>{value ?? 0}</p>
        <p className="text-xs" style={{ color: 'var(--el-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="el-card p-3 text-xs">
      <p className="font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {STATUS_LABEL[p.dataKey] ?? p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [overview, setOverview] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [byTemplate, setByTemplate] = useState([])
  const [approvers, setApprovers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/reports/overview'),
      api.get(`/reports/monthly?year=${year}`),
      api.get('/reports/by-template'),
      api.get('/reports/approvers'),
    ]).then(([ov, mo, tpl, ap]) => {
      setOverview(ov.data)
      setMonthly(mo.data)
      setByTemplate(tpl.data)
      setApprovers(ap.data)
    }).finally(() => setLoading(false))
  }, [year])

  const handleExportCsv = async () => {
    const res = await api.get('/reports/export-csv', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `requests-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // pie data from overview
  const pieData = overview
    ? ['approved', 'pending', 'rejected', 'returned', 'cancelled']
        .map(k => ({ name: STATUS_LABEL[k], value: overview[k] || 0, key: k }))
        .filter(d => d.value > 0)
    : []

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-5">
        <div className="h-7 w-40 rounded-lg" style={{ background: 'var(--el-line)' }} />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-2xl" style={{ background: 'var(--el-line)' }} />)}
        </div>
        <div className="h-72 rounded-2xl" style={{ background: 'var(--el-line)' }} />
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="el-eyebrow">Admin</div>
          <h2 className="text-[32px] font-bold text-[#0a0d2e]">รายงานสถิติ</h2>
          <p className="text-[18px] text-[#6b7390] mt-1">ภาพรวมการใช้งานระบบ Workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="el-input"
            style={{ width: '7rem', height: '38px', fontSize: '14px', padding: '0 12px' }}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handleExportCsv} className="el-btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="ทั้งหมด" value={overview?.total}
          grad="linear-gradient(135deg,var(--el-pink),var(--el-cyan))"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} />
        <StatCard label="รอดำเนินการ" value={overview?.pending}
          grad="linear-gradient(135deg,#F59E0B,#D97706)"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} />
        <StatCard label="อนุมัติแล้ว" value={overview?.approved}
          grad="linear-gradient(135deg,#00e0ff,#0099b3)"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />} />
        <StatCard label="ปฏิเสธ" value={overview?.rejected}
          grad="linear-gradient(135deg,#EF4444,#DC2626)"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />} />
        <StatCard label="ส่งกลับ" value={overview?.returned}
          grad="linear-gradient(135deg,#F97316,#EA580C)"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />} />
        <StatCard label="ยกเลิก" value={overview?.cancelled}
          grad="linear-gradient(135deg,#9CA3AF,#6B7280)"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Monthly bar chart */}
        <div className="lg:col-span-2">
          <SectionCard title={`จำนวนคำขอรายเดือน (${year})`} accent="linear-gradient(#845EC2,#2C73D2)">
            {monthly.every(m => m.total === 0)
              ? <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--el-muted)' }}>ไม่มีข้อมูลในปีนี้</div>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={v => STATUS_LABEL[v] ?? v} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="approved" stackId="a" fill={STATUS_COLORS.approved} radius={[0,0,0,0]} />
                    <Bar dataKey="pending" stackId="a" fill={STATUS_COLORS.pending} />
                    <Bar dataKey="rejected" stackId="a" fill={STATUS_COLORS.rejected} />
                    <Bar dataKey="returned" stackId="a" fill={STATUS_COLORS.returned} />
                    <Bar dataKey="cancelled" stackId="a" fill={STATUS_COLORS.cancelled} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </SectionCard>
        </div>

        {/* Pie chart */}
        <SectionCard title="สัดส่วนสถานะ" accent="linear-gradient(#008E9B,#2C73D2)">
          {pieData.length === 0
            ? <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--el-muted)' }}>ไม่มีข้อมูล</div>
            : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                      dataKey="value" nameKey="name" paddingAngle={2}>
                      {pieData.map(d => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1 w-full">
                  {pieData.map(d => (
                    <div key={d.key} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[d.key] }} />
                      <span className="text-xs truncate" style={{ color: 'var(--el-muted)' }}>{d.name}</span>
                      <span className="text-xs font-semibold ml-auto" style={{ color: 'var(--el-ink)' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </SectionCard>
      </div>

      {/* Template stats */}
      <SectionCard title="สถิติตาม Workflow Template" accent="linear-gradient(#845EC2,#008E9B)">
        {byTemplate.length === 0
          ? <p className="text-sm text-center py-6" style={{ color: 'var(--el-muted)' }}>ยังไม่มีข้อมูล</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--el-line)' }}>
                    <th className="text-left py-2 pr-4 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>Template</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>ทั้งหมด</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>อนุมัติ</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>ปฏิเสธ</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>รอ</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>ยกเลิก</th>
                  </tr>
                </thead>
                <tbody>
                  {byTemplate.map(t => (
                    <tr key={t.id} className="hover:bg-el-soft transition-colors" style={{ borderBottom: '1px solid var(--el-line)' }}>
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-sm" style={{ color: 'var(--el-ink)' }}>{t.name}</p>
                        {t.category && <p className="text-xs" style={{ color: 'var(--el-muted)' }}>{t.category}</p>}
                      </td>
                      <td className="text-center py-2.5 px-3 font-bold" style={{ color: 'var(--el-ink)' }}>{t.total}</td>
                      <td className="text-center py-2.5 px-3 font-medium" style={{ color: '#00c48c' }}>{t.approved || 0}</td>
                      <td className="text-center py-2.5 px-3 font-medium" style={{ color: '#EF4444' }}>{t.rejected || 0}</td>
                      <td className="text-center py-2.5 px-3 font-medium" style={{ color: 'var(--el-amber)' }}>{t.pending || 0}</td>
                      <td className="text-center py-2.5 px-3" style={{ color: 'var(--el-muted)' }}>{t.cancelled || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>

      {/* Approver stats */}
      <SectionCard title="สถิติผู้อนุมัติ" accent="linear-gradient(#2C73D2,#008E9B)">
        {approvers.length === 0
          ? <p className="text-sm text-center py-6" style={{ color: 'var(--el-muted)' }}>ยังไม่มีข้อมูล</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--el-line)' }}>
                    <th className="text-left py-2 pr-4 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>ชื่อ</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>แผนก</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>ดำเนินการแล้ว</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>อนุมัติ</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>ปฏิเสธ</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>ส่งกลับ</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: 'var(--el-muted)' }}>เฉลี่ย (วัน)</th>
                  </tr>
                </thead>
                <tbody>
                  {approvers.map(a => (
                    <tr key={a.id} className="hover:bg-el-soft transition-colors" style={{ borderBottom: '1px solid var(--el-line)' }}>
                      <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--el-ink)' }}>{a.name}</td>
                      <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--el-muted)' }}>{a.department || '—'}</td>
                      <td className="text-center py-2.5 px-3 font-bold" style={{ color: 'var(--el-ink)' }}>{a.total}</td>
                      <td className="text-center py-2.5 px-3 font-medium" style={{ color: '#00c48c' }}>{a.approved}</td>
                      <td className="text-center py-2.5 px-3 font-medium" style={{ color: '#EF4444' }}>{a.rejected}</td>
                      <td className="text-center py-2.5 px-3 font-medium" style={{ color: '#F97316' }}>{a.returned}</td>
                      <td className="text-center py-2.5 px-3" style={{ color: 'var(--el-muted)' }}>{a.avgDays ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>
    </div>
  )
}
