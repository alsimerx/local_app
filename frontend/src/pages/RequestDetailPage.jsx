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
    <div className="el-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="el-section-title">
          ไฟล์แนบ
          {attachments.length > 0 && <span className="font-normal text-xs ml-1" style={{ color: 'var(--el-muted)' }}>({attachments.length})</span>}
        </h3>
        {canUpload && (
          <>
            <button onClick={() => inputRef.current.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-sm disabled:opacity-50 px-3 py-1.5 border rounded-lg transition-colors hover:bg-el-soft"
              style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}
            </button>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp" />
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--el-muted)' }}>ยังไม่มีไฟล์แนบ</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map(a => {
            const isImage = a.mimeType?.startsWith('image/')
            return (
              <li key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-el-soft group transition-colors"
                style={{ border: '1px solid var(--el-line)' }}>
                {isImage ? (
                  <img src={a.filePath} alt={a.filename}
                    className="w-10 h-10 object-cover rounded-lg flex-shrink-0 cursor-pointer"
                    style={{ border: '1px solid var(--el-line)' }}
                    onClick={() => setPreview(a)} />
                ) : (
                  <span className="text-2xl flex-shrink-0 w-10 text-center">{fileIcon(a.mimeType)}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--el-ink)' }}>{a.filename}</p>
                  <p className="text-xs" style={{ color: 'var(--el-muted)' }}>{formatSize(a.fileSize)} · {dayjs(a.uploadedAt).format('D/M/YYYY HH:mm')}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={a.filePath} download={a.filename}
                    className="p-1.5 rounded-lg transition-colors hover:bg-el-soft"
                    style={{ color: 'var(--el-muted)' }} title="ดาวน์โหลด">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </a>
                  {canUpload && (
                    <button onClick={() => handleDelete(a)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: 'var(--el-muted)' }} title="ลบ">
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
  // group by stepOrder so parallel steps show together
  const grouped = steps.reduce((acc, s) => {
    const key = s.stepOrder
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([order, group]) => {
        const orderNum = Number(order)
        const isActive = orderNum === currentStep && requestStatus === 'pending'
        const isParallel = group[0]?.templateStep?.stepType === 'parallel'
        const allApproved = group.every(s => s.status === 'approved')
        const anyRejected = group.some(s => s.status === 'rejected')
        const anyReturned = group.some(s => s.status === 'returned')
        const groupStatus = anyRejected ? 'rejected' : anyReturned ? 'returned' : allApproved ? 'approved' : isActive ? 'pending' : 'draft'

        return (
          <div key={order} className={`p-3 rounded-lg border ${isActive ? 'border-yellow-300 bg-yellow-50' : groupStatus === 'approved' ? 'border-gray-100 bg-gray-50' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                ${groupStatus === 'approved' ? 'bg-green-500 text-white' :
                  groupStatus === 'rejected' ? 'bg-red-500 text-white' :
                  groupStatus === 'returned' ? 'bg-orange-500 text-white' :
                  isActive ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {groupStatus === 'approved' ? '✓' : groupStatus === 'rejected' ? '✕' : orderNum}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-800">{group[0]?.templateStep?.name}</p>
                  {isParallel && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">⚡ Parallel</span>
                  )}
                </div>
              </div>
            </div>

            {isParallel && group.length > 1
              ? (
                <div className="space-y-1.5 pl-9">
                  {group.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'approved' ? 'bg-green-500' : s.status === 'rejected' ? 'bg-red-500' : s.status === 'returned' ? 'bg-orange-500' : 'bg-yellow-400'}`} />
                      <span className="text-xs text-gray-600 flex-1">{s.approver?.name}</span>
                      <span className={`text-[10px] font-medium ${s.status === 'approved' ? 'text-green-600' : s.status === 'rejected' ? 'text-red-600' : s.status === 'returned' ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {s.status === 'approved' ? 'อนุมัติ' : s.status === 'rejected' ? 'ปฏิเสธ' : s.status === 'returned' ? 'ส่งกลับ' : 'รออยู่'}
                      </span>
                    </div>
                  ))}
                  {group.some(s => s.comment) && (
                    <p className="text-xs text-gray-600 mt-1 bg-white rounded px-2 py-1 border border-gray-200">
                      "{group.find(s => s.comment)?.comment}"
                    </p>
                  )}
                </div>
              )
              : (
                <div className="pl-9">
                  <p className="text-xs text-gray-500">{group[0]?.approver?.name}</p>
                  {group[0]?.comment && <p className="text-xs text-gray-600 mt-1 bg-white rounded px-2 py-1 border border-gray-200">"{group[0].comment}"</p>}
                  {group[0]?.actionedAt && <p className="text-xs text-gray-400 mt-0.5">{dayjs(group[0].actionedAt).format('D/M/YYYY HH:mm')}</p>}
                </div>
              )}
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
  const [pdfLoading, setPdfLoading] = useState(false)

  const load = () => {
    api.get(`/requests/${id}`).then(r => setRequest(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  if (loading) return <div className="p-8 text-gray-400">กำลังโหลด...</div>
  if (!request) return <div className="p-8 text-gray-400">ไม่พบข้อมูล</div>

  const isRequester = request.requester?.id === user?.id
  const isAdmin = user?.role === 'admin'
  const myStep = request.approvalSteps?.find(s => s.approverId === user?.id && s.stepOrder === request.currentStep && s.status === 'pending')
    ?? (request.delegateStepId ? request.approvalSteps?.find(s => s.id === request.delegateStepId) : null)
  const isDelegateAction = !request.approvalSteps?.some(s => s.approverId === user?.id && s.stepOrder === request.currentStep) && !!myStep
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

  const handleExportPdf = async () => {
    setPdfLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      const el = document.getElementById('pdf-export-area')
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, allowTaint: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const W = pdf.internal.pageSize.getWidth() - 20
      const H = pdf.internal.pageSize.getHeight() - 20
      const totalH = canvas.height * (W / canvas.width)
      let yOffset = 0
      while (yOffset < totalH) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, 10 - yOffset, W, totalH)
        yOffset += H
      }
      pdf.save(`${request.requestNumber}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/requests" className="flex items-center gap-1 text-sm mb-4 w-fit hover:underline"
          style={{ color: 'var(--el-muted)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          กลับ
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm font-semibold" style={{ color: 'var(--el-muted)' }}>{request.requestNumber}</span>
              <StatusBadge status={request.status} size="lg" />
            </div>
            <h2 className="text-[32px] font-bold text-[#0a0d2e]">{request.title}</h2>
            <button onClick={handleExportPdf} disabled={pdfLoading}
              className="mt-2 flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors hover:bg-el-soft"
              style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {pdfLoading ? 'กำลังสร้าง PDF...' : 'Export PDF'}
            </button>
            <p className="text-sm mt-1" style={{ color: 'var(--el-muted)' }}>
              {request.template?.name} · สร้างโดย {request.requester?.name}
              {request.requester?.department ? ` (${request.requester.department})` : ''}
              · {dayjs(request.createdAt).format('D/M/YYYY HH:mm')}
            </p>
          </div>
        </div>
      </div>

      <div id="pdf-export-area" className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Form Data */}
          <div className="el-card p-5">
            <h3 className="el-section-title mb-4">รายละเอียดคำขอ</h3>
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
            <div className="el-card p-5">
              <h3 className="el-section-title mb-3">การดำเนินการ</h3>
              <div className="flex gap-3">
                {canSubmit && (
                  <button onClick={handleSubmit} disabled={actionLoading} className="el-btn-primary disabled:opacity-50">
                    ส่งคำขอ
                  </button>
                )}
                {canCancel && (
                  <button onClick={handleCancel} disabled={actionLoading}
                    className="px-5 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors">
                    ยกเลิกคำขอ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Approver Actions */}
          {canApprove && (
            <div className="el-card p-5" style={{ borderColor: 'rgba(255,46,126,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="el-section-title">อนุมัติ / ปฏิเสธ</h3>
                {isDelegateAction && request.delegatingForName && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'var(--el-amber-soft)', color: '#b97600' }}>
                    มอบหมายแทน {request.delegatingForName}
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                placeholder="ความเห็น (บังคับสำหรับการปฏิเสธและส่งกลับ)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="el-textarea mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => handleApprovalAction('approved')} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                  ✓ อนุมัติ
                </button>
                <button onClick={() => handleApprovalAction('returned')} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  ↩ ส่งกลับ
                </button>
                <button onClick={() => handleApprovalAction('rejected')} disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
                  ✕ ปฏิเสธ
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="el-card p-5">
            <h3 className="el-section-title mb-4">ประวัติการดำเนินการ</h3>
            <Timeline logs={request.auditLogs} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="el-card p-5">
            <h3 className="el-section-title mb-3">ขั้นตอนอนุมัติ</h3>
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
