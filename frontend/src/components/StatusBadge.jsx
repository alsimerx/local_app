const LABELS = {
  draft:     'Draft',
  pending:   'รออนุมัติ',
  approved:  'อนุมัติแล้ว',
  rejected:  'ปฏิเสธ',
  returned:  'ส่งกลับแก้ไข',
  cancelled: 'ยกเลิก',
}

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status
  return (
    <span className={`el-badge el-badge-${status || 'draft'}`}>
      {label}
    </span>
  )
}
