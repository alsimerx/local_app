import { useState, useEffect } from 'react'
import api from '../../lib/axios'

const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'dropdown', 'checkbox']
const FIELD_TYPE_LABEL = { text: 'ข้อความ', number: 'ตัวเลข', date: 'วันที่', textarea: 'ข้อความยาว', dropdown: 'Dropdown', checkbox: 'Checkbox' }

const emptyField = () => ({ _id: Date.now(), label: '', fieldType: 'text', required: false, options: '' })
const emptyStep = () => ({ _id: Date.now(), name: '', approverIds: [] })

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
      steps: t.steps.map(s => ({ ...s, _id: s.id, approverIds: s.approvers.map(a => a.userId) })),
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

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Workflow Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">กำหนดแม่แบบคำขอและลำดับการอนุมัติ</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          สร้าง Template
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className={`bg-white rounded-xl border shadow-sm p-5 ${!t.isActive ? 'opacity-50' : 'border-gray-100'}`}>
            {t.category && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{t.category}</span>}
            <h3 className="font-semibold text-gray-900 mt-2">{t.name}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
              <span>{t.fields?.length} ฟิลด์</span>
              <span>{t.steps?.length} ขั้นตอน</span>
              {!t.isActive && <span className="text-red-400">ปิดใช้งาน</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => openEdit(t)} className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">แก้ไข</button>
              {t.isActive
                ? <button onClick={() => handleDeactivate(t)} className="flex-1 py-1.5 border border-yellow-100 rounded-lg text-xs text-yellow-600 hover:bg-yellow-50">ปิดใช้งาน</button>
                : <button onClick={() => handleActivate(t)} className="flex-1 py-1.5 border border-green-200 rounded-lg text-xs text-green-600 hover:bg-green-50">เปิดใช้งาน</button>
              }
              <button onClick={() => handleDelete(t)} className="py-1.5 px-3 border border-red-100 rounded-lg text-xs text-red-500 hover:bg-red-50">ลบ</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 p-6">
            <h3 className="font-bold text-gray-900 mb-5 text-lg">{modal === 'create' ? 'สร้าง Template ใหม่' : 'แก้ไข Template'}</h3>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ Template *</label>
                <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">หมวดหมู่</label>
                <input className={inp} value={form.category} placeholder="HR, Finance, Procurement..." onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">คำอธิบาย</label>
                <input className={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            {/* Fields */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">ฟิลด์ในฟอร์ม</h4>
                <button onClick={addField} className="text-xs text-blue-600 hover:underline">+ เพิ่มฟิลด์</button>
              </div>
              <div className="space-y-2">
                {form.fields.map((f, i) => (
                  <div key={f._id} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input className={inp} placeholder="Label *" value={f.label} onChange={e => setField(i, 'label', e.target.value)} />
                      <select className={inp} value={f.fieldType} onChange={e => setField(i, 'fieldType', e.target.value)}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>)}
                      </select>
                      {f.fieldType === 'dropdown'
                        ? <input className={inp} placeholder="ตัวเลือก (คั่นด้วย ,)" value={f.options} onChange={e => setField(i, 'options', e.target.value)} />
                        : <label className="flex items-center gap-1.5 text-sm text-gray-600 pl-1">
                            <input type="checkbox" checked={f.required} onChange={e => setField(i, 'required', e.target.checked)} />
                            จำเป็น
                          </label>
                      }
                    </div>
                    <button onClick={() => removeField(i)} className="text-gray-300 hover:text-red-400 mt-1 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">ขั้นตอนการอนุมัติ</h4>
                <button onClick={addStep} className="text-xs text-blue-600 hover:underline">+ เพิ่ม Step</button>
              </div>
              <div className="space-y-2">
                {form.steps.map((s, i) => (
                  <div key={s._id} className="flex gap-2 items-start bg-blue-50 p-3 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-1">{i + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input className={inp} placeholder="ชื่อขั้นตอน *" value={s.name} onChange={e => setStep(i, 'name', e.target.value)} />
                      <select className={inp} multiple value={s.approverIds.map(String)}
                        onChange={e => setStep(i, 'approverIds', Array.from(e.target.selectedOptions, o => Number(o.value)))}>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeStep(i)} className="text-gray-300 hover:text-red-400 mt-1 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">กด Ctrl/Cmd เพื่อเลือกผู้อนุมัติหลายคน</p>
            </div>

            {error && <p className="mb-3 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
