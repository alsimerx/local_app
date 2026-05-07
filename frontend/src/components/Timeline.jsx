import dayjs from 'dayjs'
import 'dayjs/locale/th'

const actionLabel = {
  created:   { label: 'สร้างคำขอ', color: 'bg-blue-500' },
  submitted: { label: 'ส่งคำขอ', color: 'bg-blue-600' },
  approved:  { label: 'อนุมัติ', color: 'bg-green-500' },
  rejected:  { label: 'ปฏิเสธ', color: 'bg-red-500' },
  returned:  { label: 'ส่งกลับแก้ไข', color: 'bg-orange-500' },
  cancelled: { label: 'ยกเลิก', color: 'bg-gray-500' },
  commented: { label: 'แสดงความเห็น', color: 'bg-purple-400' },
}

export default function Timeline({ logs = [] }) {
  if (!logs.length) return <p className="text-sm text-gray-400">ยังไม่มีประวัติการดำเนินการ</p>

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
      <ul className="space-y-4">
        {logs.map((log, i) => {
          const { label, color } = actionLabel[log.action] || { label: log.action, color: 'bg-gray-400' }
          return (
            <li key={log.id || i} className="flex gap-4 relative">
              <div className={`w-6 h-6 rounded-full ${color} flex-shrink-0 flex items-center justify-center mt-0.5 z-10`}>
                <span className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-800">{log.actor?.name}</span>
                  <span className="text-sm text-gray-600">{label}</span>
                  {log.newStatus && log.oldStatus && log.newStatus !== log.oldStatus && (
                    <span className="text-xs text-gray-400">({log.oldStatus} → {log.newStatus})</span>
                  )}
                </div>
                {log.comment && (
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-3 py-1.5 border border-gray-100">
                    "{log.comment}"
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {dayjs(log.createdAt).locale('th').format('D MMM YYYY HH:mm')}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
