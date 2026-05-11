import { useState, useEffect } from 'react'
import api from '../../lib/axios'

const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'dropdown', 'checkbox']
const FIELD_TYPE_LABEL = { text: 'ข้อความ', number: 'ตัวเลข', date: 'วันที่', textarea: 'ข้อความยาว', dropdown: 'Dropdown', checkbox: 'Checkbox' }

const emptyField = () => ({ _id: Date.now(), label: '', fieldType: 'text', required: false, options: '' })
const emptyStep = () => ({ _id: Date.now(), name: '', approverIds: [], stepType: 'sequential' })

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', category: '', fields: [], steps: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.get('/templates').then(r => setTemplates(r.data))
  useEffect(() => {
    load()
    api.get('/users').then(r => setUsers(r.data.filter(u => u.role === 'approver' || u.role === 'admin')))
  }, [])

  const openCreate = () => {
    setForm({ name: '', description: '', category: '', fields: [emptyField()], steps: [emptyStep()] })
    setError('')
    setModal('create')
  }

  const openEdit = t => {
    setForm({
      id: t.id,
      name: t.name,
      description: t.description || '',
      category: t.category || '',
      isActive: t.isActive,
      fields: t.fields.map(f => ({ ...f, _id: f.id, options: f.options ? JSON.parse(f.options).join(', ') : '' })),
      steps: t.steps.map(s => ({ ...s, _id: s.id, approverIds: s.approvers.map(a => a.userId), stepType: s.stepType || 'sequential' })),
    })
    setError('')
    setModal('edit')
  }

  const setField = (idx, key, val) => setForm(f => {
    const fields = [...f.fields]
    fields[idx] = { ...fields[idx], [key]: val }
    return { ...f, fields }
  })

  const setStep = (idx, key, val) => setForm(f => {
    const steps = [...f.steps]
    steps[idx] = { ...steps[idx], [key]: val }
    return { ...f, steps }
  })

  const addField = () => setForm(f => ({ ...f, fields: [...f.fields, emptyField()] }))
  const removeField = idx => setForm(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }))
  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, emptyStep()] }))
  const removeStep = idx => setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    if (!form.name) return setError('กรุณากรอกชื่อ Template')
    if (form.fields.some(f => !f.label)) return setError('กรุณากรอกชื่อ Label ทุกฟิลด์')
    if (form.steps.some(s => !s.name || s.approverIds.length === 0)) return setError('กรุณากรอกชื่อและเลือกผู้อนุมัติทุก Step')

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        isActive: form.isActive ?? true,
        fields: form.fields.map((f, i) => ({
          label: f.label,
          fieldType: f.fieldType,
          required: f.required,
          options: f.fieldType === 'dropdown' ? f.options.split(',').map(s => s.trim()).filter(Boolean) : null,
          order: i + 1,
        })),
        steps: form.steps.map((s, i) => ({
          order: i + 1,
          name: s.name,
          stepType: s.stepType || 'sequential',
          approverIds: s.approverIds.map(Number),
        })),
      }

      if (modal === 'create') {
        await api.post('/templates', payload)
      } else {
        await api.put(`/templates/${form.id}`, payload)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async t => {
    if (!confirm(`ต้องการปิดใช้งาน "${t.name}" หรือไม่?`)) return
    await api.patch(`/templates/${t.id}/deactivate`)
    load()
  }

  const handleActivate = async t => {
    await api.patch(`/templates/${t.id}/activate`)
    load()
  }

  const handleDelete = async t => {
    if (!confirm(`ลบ "${t.name}" ถาวรหรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return
    try {
      await api.delete(`/templates/${t.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="el-eyebrow">Admin</div>
          <h2 className="text-[32px] font-bold text-[#0a0d2e]">Workflow Templates</h2>
          <p className="text-[18px] text-[#6b7390] mt-1">กำหนดแม่แบบคำขอและลำดับการอนุมัติ</p>
        </div>
        <button onClick={openCreate} className="el-btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้าง Template
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id}
            className={`el-card p-5 transition-all ${!t.isActive ? 'opacity-50' : ''}`}>
            {t.category && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{ background: 'var(--el-pink-soft)', color: 'var(--el-pink)' }}>
                {t.category}
              </span>
            )}
            <h3 className="font-semibold mt-2" style={{ color: 'var(--el-ink)' }}>{t.name}</h3>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--el-muted)' }}>{t.description}</p>
            <div className="mt-3 flex items-center gap-3 text-xs" style={{ color: 'var(--el-muted)' }}>
              <span>{t.fields?.length} ฟิลด์</span>
              <span>{t.steps?.length} ขั้นตอน</span>
              {!t.isActive && <span style={{ color: '#EF4444' }}>ปิดใช้งาน</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEdit(t)}
                className="flex-1 py-1.5 border rounded-lg text-xs font-medium transition-colors hover:bg-el-soft"
                style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}>
                แก้ไข
              </button>
              {t.isActive
                ? <button onClick={() => handleDeactivate(t)}
                    className="flex-1 py-1.5 border rounded-lg text-xs font-medium transition-colors hover:bg-[#fff8e0]"
                    style={{ borderColor: '#fde68a', color: '#d97706' }}>
                    ปิดใช้งาน
                  </button>
                : <button onClick={() => handleActivate(t)}
                    className="flex-1 py-1.5 border rounded-lg text-xs font-medium transition-colors hover:bg-[#e6fbff]"
                    style={{ borderColor: '#a5f3fc', color: '#0099b3' }}>
                    เปิดใช้งาน
                  </button>
              }
              <button onClick={() => handleDelete(t)}
                className="py-1.5 px-3 border rounded-lg text-xs font-medium transition-colors hover:bg-red-50"
                style={{ borderColor: '#fecdd3', color: '#EF4444' }}>
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="el-card w-full max-w-2xl my-8 p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-5" style={{ color: 'var(--el-ink)' }}>
              {modal === 'create' ? 'สร้าง Template ใหม่' : 'แก้ไข Template'}
            </h3>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>ชื่อ Template <span style={{ color: 'var(--el-pink)' }}>*</span></label>
                <input className="el-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>หมวดหมู่</label>
                <input className="el-input" value={form.category} placeholder="HR, Finance, Procurement..." onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>คำอธิบาย</label>
                <input className="el-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            {/* Fields */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--el-ink)' }}>ฟิลด์ในฟอร์ม</h4>
                <button onClick={addField} className="text-xs font-medium hover:underline" style={{ color: 'var(--el-pink)' }}>+ เพิ่มฟิลด์</button>
              </div>
              <div className="space-y-2">
                {form.fields.map((f, i) => (
                  <div key={f._id} className="flex gap-2 items-start p-3 rounded-xl" style={{ background: 'var(--el-soft)' }}>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input className="el-input" placeholder="Label *" value={f.label} onChange={e => setField(i, 'label', e.target.value)} />
                      <select className="el-input" value={f.fieldType} onChange={e => setField(i, 'fieldType', e.target.value)}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
                      </select>
                      {f.fieldType === 'dropdown'
                        ? <input className="el-input" placeholder="ตัวเลือก (คั่นด้วย ,)" value={f.options} onChange={e => setField(i, 'options', e.target.value)} />
                        : <label className="flex items-center gap-1.5 text-sm pl-1" style={{ color: 'var(--el-muted)' }}>
                            <input type="checkbox" checked={f.required} onChange={e => setField(i, 'required', e.target.checked)} />
                            จำเป็น
                          </label>
                      }
                    </div>
                    <button onClick={() => removeField(i)} className="mt-1 flex-shrink-0 transition-colors" style={{ color: 'var(--el-line)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--el-line)'}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--el-ink)' }}>ขั้นตอนการอนุมัติ</h4>
                <button onClick={addStep} className="text-xs font-medium hover:underline" style={{ color: 'var(--el-pink)' }}>+ เพิ่ม Step</button>
              </div>
              <div className="space-y-2">
                {form.steps.map((s, i) => (
                  <div key={s._id} className="flex gap-2 items-start p-3 rounded-xl" style={{ background: 'var(--el-pink-soft)' }}>
                    <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-1 font-bold"
                      style={{ background: 'linear-gradient(135deg, var(--el-pink), var(--el-cyan))' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="el-input" placeholder="ชื่อขั้นตอน *" value={s.name} onChange={e => setStep(i, 'name', e.target.value)} />
                        <select className="el-input" multiple value={s.approverIds.map(String)}
                          onChange={e => setStep(i, 'approverIds', Array.from(e.target.selectedOptions, o => Number(o.value)))}>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--el-muted)' }}>ประเภท:</span>
                        {['sequential', 'parallel'].map(type => (
                          <button key={type} type="button"
                            onClick={() => setStep(i, 'stepType', type)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
                            style={s.stepType === type
                              ? { background: 'linear-gradient(135deg, var(--el-pink), var(--el-cyan))', color: 'white', borderColor: 'transparent' }
                              : { background: 'white', color: 'var(--el-muted)', borderColor: 'var(--el-line)' }}>
                            {type === 'sequential' ? 'Sequential (ทีละคน)' : 'Parallel (ทุกคนพร้อมกัน)'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removeStep(i)} className="mt-1 flex-shrink-0 transition-colors" style={{ color: 'var(--el-line)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--el-line)'}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--el-muted)' }}>กด Ctrl/Cmd เพื่อเลือกผู้อนุมัติหลายคน</p>
            </div>

            {error && (
              <p className="mb-3 text-sm px-3 py-2 rounded-xl" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 border rounded-xl text-sm font-medium transition-colors hover:bg-el-soft"
                style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}>
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving} className="el-btn-primary flex-1 justify-center disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
