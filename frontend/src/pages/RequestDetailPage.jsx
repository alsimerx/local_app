import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import Timeline from '../components/Timeline'
import dayjs from 'dayjs'

function fileIcon(mimeType = '') {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  return '📎'
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentsSection({ requestId, attachments, canUpload, onReload }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const inputRef = useRef()

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/requests/${requestId}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onReload()
    } catch (err) {
      alert(err.response?.data?.error || 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (a) => {
    if (!confirm(`ลบไฟล์ "${a.filename}" หรือไม่?`)) return
    try {
      await api.delete(`/requests/${requestId}/attachments/${a.id}`)
      onReload()
    } catch (err) {
      alert(err.response?.data?.error || 'ลบไฟล์ไม่สำเร็จ')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">ไฟล์แนบ {attachments.length > 0 && <span className="text-gray-400 font-normal text-sm">({attachments.length})</span>}</h3>
        {canUpload && (
          <>
            <button onClick={() => inputRef.current.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}
            </button>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp" />
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">ยังไม่มีไฟล์แนบ</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map(a => {
            const isImage = a.mimeType?.startsWith('image/')
            return (
              <li key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 group">
                {isImage ? (
                  <img src={a.filePath} alt={a.filename}
                    className="w-10 h-10 object-cover rounded border border-gray-200 cursor-pointer flex-shrink-0"
                    onClick={() => setPreview(a)} />
                ) : (
                  <span className="text-2xl flex-shrink-0 w-10 text-center">{fileIcon(a.mimeType)}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate font-medium">{a.filename}</p>
                  <p className="text-xs text-gray-400">{formatSize(a.fileSize)} · {dayjs(a.uploadedAt).format('D/M/YYYY HH:mm')}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={a.filePath} download={a.filename}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="ดาวน์โหลด">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </a>
                  {canUpload && (
                    <button onClick={() => handleDelete(a)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="ลบ">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Image preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={preview.filePath} alt={preview.filename} className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl" />
            <button onClick={() => setPreview(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-gray-600 hover:text-gray-900">✕</button>
            <p className="text-white text-sm text-center mt-2 opacity-75">{preview.filename}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ApprovalStepsPanel({ steps, currentStep, requestStatus }) {
  return (
    <div className="space-y-3">
      {steps.map(step => {
        const isActive = step.stepOrder === currentStep && requestStatus === 'pending'
        const isDone = step.status !== 'pending'
        return (
          <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isActive ? 'border-yellow-300 bg-yellow-50' : isDone ? 'border-gray-100 bg-gray-50' : 'border-gray-100'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5
              ${step.status === 'approved' ? 'bg-green-500 text-white' :
                step.status === 'rejected' ? 'bg-red-500 text-white' :
                step.status === 'returned' ? 'bg-orange-500 text-white' :
                isActive ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✕' : step.stepOrder}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{step.templateStep?.name}</p>
              <p className="text-xs text-gray-500">{step.approver?.name}</p>
              {step.comment && <p className="text-xs text-gray-600 mt-1 bg-white rounded px-2 py-1 border border-gray-200">"{step.comment}"</p>}
              {step.actionedAt && <p className="text-xs text-gray-400 mt-1">{dayjs(step.actionedAt).format('D/M/YYYY HH:mm')}</p>}
            </div>
            <StatusBadge status={step.status === 'pending' && isActive ? 'pending' : step.status === 'pending' ? 'draft' : step.status} />
          </div>
        )
      })}
    </div>
  )
}

export default function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [comment, setComment] = useState('')

  const load = () => {
    api.get(`/requests/${id}`).then(r => setRequest(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  if (loading) return <div className="p-8 text-gray-400">กำลังโหลด...</div>
  if (!request) return <div className="p-8 text-gray-400">ไม่พบข้อมูล</div>

  const isRequester = request.requester?.id === user?.id
  const isAdmin = user?.role === 'admin'
  const myStep = request.approvalSteps?.find(s => s.approverId === user?.id && s.stepOrder === request.currentStep && s.status === 'pending')
  const canApprove = !!myStep && request.status === 'pending'
  const canSubmit = isRequester && ['draft', 'returned'].includes(request.status)
  const canCancel = isRequester && !['approved', 'rejected', 'cancelled'].includes(request.status)
  const canUpload = (isRequester || isAdmin) && !['approved', 'rejected', 'cancelled'].includes(request.status)

  const handleSubmit = async () => {
    if (!confirm('ต้องการส่งคำขอนี้หรือไม่?')) return
    setActionLoading(true)
    try {
      await api.post(`/requests/${id}/submit`)
      load()
    } catch (err) { alert(err.response?.data?.error || 'เกิดข้อผิดพลาด') }
    finally { setActionLoading(false) }
  }

  const handleCancel = async () => {
    if (!confirm('ต้องการยกเลิกคำขอนี้หรือไม่?')) return
    setActionLoading(true)
    try {
      await api.post(`/requests/${id}/cancel`)
      load()
    } catch (err) { alert(err.response?.data?.error || 'เกิดข้อผิดพลาด') }
    finally { setActionLoading(false) }
  }

  const handleApprovalAction = async (action) => {
    if (action !== 'approved' && !comment.trim()) {
      alert('กรุณาระบุเหตุผล')
      return
    }
    setActionLoading(true)
    try {
      await api.post(`/approvals/${myStep.id}/${action === 'approved' ? 'approve' : action === 'rejected' ? 'reject' : 'return'}`, { comment })
      setComment('')
      load()
    } catch (err) { alert(err.response?.data?.error || 'เกิดข้อผิดพลาด') }
    finally { setActionLoading(false) }
  }

  const formData = request.formData ? JSON.parse(request.formData) : {}

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/requests" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          กลับ
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-gray-400">{request.requestNumber}</span>
              <StatusBadge status={request.status} size="lg" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{request.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {request.template?.name} · สร้างโดย {request.requester?.name}
              {request.requester?.department ? ` (${request.requester.department})` : ''}
              · {dayjs(request.createdAt).format('D/M/YYYY HH:mm')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Form Data */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">รายละเอียดคำขอ</h3>
            <dl className="space-y-3">
              {request.template?.fields?.map(field => {
                const val = formData[field.id]
                if (val === undefined || val === null || val === '') return null
                return (
                  <div key={field.id} className="grid grid-cols-3 gap-2">
                    <dt className="text-sm text-gray-500 col-span-1">{field.label}</dt>
                    <dd className="text-sm text-gray-900 col-span-2 font-medium">
                      {field.fieldType === 'checkbox' ? (val ? 'ใช่' : 'ไม่') : String(val)}
                    </dd>
                  </div>
                )
              })}
              {Object.keys(formData).length === 0 && <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>}
            </dl>
          </div>

          {/* Attachments */}
          <AttachmentsSection
            requestId={id}
            attachments={request.attachments || []}
            canUpload={canUpload}
            onReload={load}
          />

          {/* Actions */}
          {(canSubmit || canCancel) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">การดำเนินการ</h3>
              <div className="flex gap-3">
                {canSubmit && (
                  <button onClick={handleSubmit} disabled={actionLoading}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    ส่งคำขอ
                  </button>
                )}
                {canCancel && (
                  <button onClick={handleCancel} disabled={actionLoading}
                    className="px-5 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
                    ยกเลิกคำขอ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Approver Actions */}
          {canApprove && (
            <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">อนุมัติ / ปฏิเสธ</h3>
              <textarea
                rows={3}
                placeholder="ความเห็น (บังคับสำหรับการปฏิเสธและส่งกลับ)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => handleApprovalAction('approved')} disabled={actionLoading}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                  ✓ อนุมัติ
                </button>
                <button onClick={() => handleApprovalAction('returned')} disabled={actionLoading}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  ↩ ส่งกลับแก้ไข
                </button>
                <button onClick={() => handleApprovalAction('rejected')} disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                  ✕ ปฏิเสธ
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">ประวัติการดำเนินการ</h3>
            <Timeline logs={request.auditLogs} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">ขั้นตอนอนุมัติ</h3>
            <ApprovalStepsPanel
              steps={request.approvalSteps || []}
              currentStep={request.currentStep}
              requestStatus={request.status}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
