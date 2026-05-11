import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'

function DynamicField({ field, value, onChange }) {
  const opts = field.options ? JSON.parse(field.options) : []

  if (field.fieldType === 'textarea') return (
    <textarea rows={3} className="el-textarea" required={field.required}
      value={value || ''} onChange={e => onChange(e.target.value)} />
  )
  if (field.fieldType === 'dropdown') return (
    <select className="el-input" required={field.required}
      value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">-- เลือก --</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  if (field.fieldType === 'checkbox') return (
    <input type="checkbox" className="w-5 h-5 rounded accent-el-pink" checked={!!value} onChange={e => onChange(e.target.checked)} />
  )
  return (
    <input
      type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
      className="el-input"
      required={field.required}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

function fileIcon(file) {
  const t = file.type
  if (t.startsWith('image/')) return '🖼️'
  if (t === 'application/pdf') return '📄'
  if (t.includes('word') || t.includes('document')) return '📝'
  if (t.includes('sheet') || t.includes('excel')) return '📊'
  return '📎'
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CATEGORY_COLOR = {
  HR:          { bg: 'var(--el-pink-soft)',  text: 'var(--el-pink)' },
  Finance:     { bg: 'var(--el-cyan-soft)',  text: '#0099b3' },
  Procurement: { bg: 'var(--el-amber-soft)', text: '#b97600' },
}

export default function NewRequestPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState(null)
  const [title, setTitle] = useState('')
  const [formData, setFormData] = useState({})
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    api.get('/templates?activeOnly=true').then(r => setTemplates(r.data))
  }, [])

  const handleSelectTemplate = t => {
    setSelected(t)
    setTitle(t.name + ' — ')
    setFormData({})
    setFiles([])
    setStep(2)
  }

  const handleFieldChange = (fieldId, value) => {
    setFormData(d => ({ ...d, [fieldId]: value }))
  }

  const handleFileAdd = (e) => {
    const added = Array.from(e.target.files)
    setFiles(prev => [...prev, ...added])
    e.target.value = ''
  }

  const handleFileRemove = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (isDraft) => {
    setSubmitting(true)
    try {
      setSubmitProgress('กำลังสร้างคำขอ...')
      const req = await api.post('/requests', { templateId: selected.id, title, formData })
      const requestId = req.data.id

      if (files.length > 0) {
        setSubmitProgress(`กำลังอัปโหลดไฟล์แนบ (0/${files.length})...`)
        for (let i = 0; i < files.length; i++) {
          const fd = new FormData()
          fd.append('file', files[i])
          await api.post(`/requests/${requestId}/attachments`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          setSubmitProgress(`กำลังอัปโหลดไฟล์แนบ (${i + 1}/${files.length})...`)
        }
      }

      if (!isDraft) {
        setSubmitProgress('กำลังส่งคำขอ...')
        await api.post(`/requests/${requestId}/submit`)
      }

      navigate(`/requests/${requestId}`)
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
      setSubmitProgress('')
    }
  }

  /* ── Step 1: เลือก Template ── */
  if (step === 1) return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-7">
        <div className="el-eyebrow">New Request</div>
        <h2 className="text-[32px] font-bold text-[#0a0d2e]">สร้างคำขอใหม่</h2>
        <p className="text-[18px] text-[#6b7390] mt-1">เลือกประเภทคำขอที่ต้องการ</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => {
          const clr = CATEGORY_COLOR[t.category] || { bg: 'var(--el-soft)', text: 'var(--el-muted)' }
          return (
            <button key={t.id} onClick={() => handleSelectTemplate(t)}
              className="el-card text-left p-5 hover:shadow-md transition-all group cursor-pointer"
              style={{ borderColor: 'var(--el-line)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--el-pink)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--el-line)'}>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold mb-3"
                style={{ background: clr.bg, color: clr.text }}>
                {t.category}
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-el-pink transition-colors" style={{ color: 'var(--el-ink)' }}>{t.name}</h3>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--el-muted)' }}>{t.description}</p>
              <p className="text-xs mt-3" style={{ color: 'var(--el-muted)' }}>{t.steps?.length} ขั้นตอนอนุมัติ · {t.fields?.length} ฟิลด์</p>
            </button>
          )
        })}
        {templates.length === 0 && (
          <p className="col-span-3 text-center py-12" style={{ color: 'var(--el-muted)' }}>ยังไม่มี Template — กรุณาให้ Admin สร้าง Template ก่อน</p>
        )}
      </div>
    </div>
  )

  /* ── Step 2: กรอกแบบฟอร์ม ── */
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm mb-4 hover:underline"
          style={{ color: 'var(--el-muted)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          เลือกประเภทอื่น
        </button>
        <h2 className="text-[32px] font-bold text-[#0a0d2e]">{selected?.name}</h2>
        <p className="text-[18px] text-[#6b7390] mt-1">{selected?.description}</p>
      </div>

      {/* Approval steps preview */}
      <div className="mb-5 rounded-2xl p-4" style={{ background: 'var(--el-pink-soft)' }}>
        <p className="el-eyebrow mb-2">ขั้นตอนการอนุมัติ</p>
        <div className="flex flex-wrap gap-2 items-center">
          {selected?.steps?.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--el-ink)' }}>
              {i > 0 && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: 'var(--el-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
              <span className="bg-white px-2.5 py-1 rounded-lg border font-medium"
                style={{ borderColor: 'var(--el-line)', color: 'var(--el-ink)' }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="el-card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--el-ink)' }}>
            ชื่อเรื่อง <span style={{ color: 'var(--el-pink)' }}>*</span>
          </label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="el-input" />
        </div>

        {/* Dynamic fields */}
        {selected?.fields?.map(field => (
          <div key={field.id}>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--el-ink)' }}>
              {field.label} {field.required && <span style={{ color: 'var(--el-pink)' }}>*</span>}
            </label>
            <DynamicField field={field} value={formData[field.id]} onChange={v => handleFieldChange(field.id, v)} />
          </div>
        ))}

        {/* File Attachments */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold" style={{ color: 'var(--el-ink)' }}>
              ไฟล์แนบ
              {files.length > 0 && <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--el-muted)' }}>({files.length} ไฟล์)</span>}
            </label>
            <button type="button" onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed transition-colors"
              style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--el-pink)'; e.currentTarget.style.color = 'var(--el-pink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--el-line)'; e.currentTarget.style.color = 'var(--el-muted)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มไฟล์
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileAdd}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp" />
          </div>

          {files.length === 0 ? (
            <button type="button" onClick={() => fileInputRef.current.click()}
              className="w-full py-6 border-2 border-dashed rounded-xl text-sm flex flex-col items-center gap-2 transition-colors"
              style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--el-pink)'; e.currentTarget.style.color = 'var(--el-pink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--el-line)'; e.currentTarget.style.color = 'var(--el-muted)' }}>
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              คลิกเพื่อแนบไฟล์ (PDF, Word, Excel, รูปภาพ)
            </button>
          ) : (
            <ul className="space-y-2">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border group"
                  style={{ background: 'var(--el-soft)', borderColor: 'var(--el-line)' }}>
                  <span className="text-xl flex-shrink-0">{fileIcon(f)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--el-ink)' }}>{f.name}</p>
                    <p className="text-xs" style={{ color: 'var(--el-muted)' }}>{formatSize(f.size)}</p>
                  </div>
                  <button type="button" onClick={() => handleFileRemove(idx)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded-lg hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => fileInputRef.current.click()}
                  className="w-full py-2 border border-dashed rounded-xl text-xs transition-colors"
                  style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}>
                  + เพิ่มไฟล์อื่น
                </button>
              </li>
            </ul>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => handleSubmit(true)} disabled={submitting || !title}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)', background: 'white' }}>
            บันทึก Draft
          </button>
          <button type="button" onClick={() => handleSubmit(false)} disabled={submitting || !title}
            className="flex-1 el-btn-primary justify-center disabled:opacity-50"
            style={{ height: '46px', flex: 1 }}>
            {submitting ? (submitProgress || 'กำลังส่ง...') : `ส่งคำขอ${files.length > 0 ? ` (${files.length} ไฟล์)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
