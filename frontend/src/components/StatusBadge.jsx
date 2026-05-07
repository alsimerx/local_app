const config = {
  draft:     { label: 'Draft',       style: { background: '#f1f5f9', color: '#64748b' } },
  pending:   { label: 'รออนุมัติ',   style: { background: 'linear-gradient(135deg,#845EC2,#6a4aad)', color: '#fff' } },
  approved:  { label: 'อนุมัติแล้ว', style: { background: 'linear-gradient(135deg,#008E9B,#007280)', color: '#fff' } },
  rejected:  { label: 'ปฏิเสธ',      style: { background: '#fee2e2', color: '#dc2626' } },
  returned:  { label: 'ส่งกลับแก้ไข',style: { background: '#fff7ed', color: '#ea580c' } },
  cancelled: { label: 'ยกเลิก',      style: { background: '#f1f5f9', color: '#94a3b8' } },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const { label, style } = config[status] || { label: status, style: { background: '#f1f5f9', color: '#64748b' } }
  const sz = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sz}`} style={style}>
      {label}
    </span>
  )
}
