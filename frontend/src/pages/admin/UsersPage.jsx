import { useState, useEffect } from 'react'
import api from '../../lib/axios'

const ROLES = ['requester', 'approver', 'admin']
const ROLE_LABEL = { requester: 'Requester', approver: 'Approver', admin: 'Admin' }
const ROLE_COLOR = { requester: 'bg-gray-100 text-gray-600', approver: 'bg-blue-100 text-blue-700', admin: 'bg-purple-100 text-purple-700' }

const empty = { name: '', email: '', password: '', role: 'requester', department: '', position: '' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = () => api.get('/users').then(r => setUsers(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(empty); setError(''); setModal('create') }
  const openEdit = u => { setForm({ ...u, password: '' }); setError(''); setModal('edit') }

  const handleSave = async () => {
    if (!form.name || !form.email) return setError('กรุณากรอกชื่อและอีเมล')
    if (modal === 'create' && !form.password) return setError('กรุณากรอกรหัสผ่าน')
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') {
        await api.post('/users', form)
      } else {
        const { id, email, createdAt, ...data } = form
        await api.put(`/users/${form.id}`, data)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (u) => {
    if (!confirm(`ต้องการปิดใช้งานบัญชี "${u.name}" หรือไม่?`)) return
    await api.put(`/users/${u.id}`, { name: u.name, role: u.role, department: u.department, position: u.position, isActive: false })
    load()
  }

  const handleActivate = async (u) => {
    await api.put(`/users/${u.id}`, { name: u.name, role: u.role, department: u.department, position: u.position, isActive: true })
    load()
  }

  const openDelete = (u) => { setDeleteTarget(u); setDeleteError('') }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await api.delete(`/users/${deleteTarget.id}`)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setDeleting(false)
    }
  }

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">จัดการผู้ใช้</h2>
          <p className="text-sm text-gray-500 mt-0.5">ผู้ใช้ทั้งหมด {users.length} บัญชี · ใช้งานอยู่ {users.filter(u => u.isActive).length} บัญชี</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          เพิ่มผู้ใช้
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, อีเมล, แผนก..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <div className="flex gap-1">
          {[{ value: '', label: 'ทุก Role' }, ...ROLES.map(r => ({ value: r, label: ROLE_LABEL[r] }))].map(opt => (
            <button key={opt.value} onClick={() => setRoleFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${roleFilter === opt.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-600">ชื่อ</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">อีเมล</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">แผนก / ตำแหน่ง</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">ไม่พบผู้ใช้</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {u.department && <span>{u.department}</span>}
                  {u.department && u.position && <span className="mx-1">·</span>}
                  {u.position && <span>{u.position}</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(u)} className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">แก้ไข</button>
                    {u.isActive
                      ? <button onClick={() => handleDeactivate(u)} className="text-xs text-gray-500 hover:text-orange-600 px-2 py-1 rounded hover:bg-orange-50 transition-colors">ปิดใช้งาน</button>
                      : <button onClick={() => handleActivate(u)} className="text-xs text-gray-500 hover:text-green-600 px-2 py-1 rounded hover:bg-green-50 transition-colors">เปิดใช้งาน</button>
                    }
                    <button onClick={() => openDelete(u)}
                      className="text-xs text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors ml-0.5"
                      title="ลบผู้ใช้">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-1">ลบผู้ใช้งาน</h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              คุณต้องการลบบัญชี <span className="font-semibold text-gray-800">"{deleteTarget.name}"</span> ออกจากระบบหรือไม่?
            </p>
            <p className="text-xs text-red-500 text-center mb-4">การลบจะไม่สามารถกู้คืนได้</p>
            {deleteError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-xl mb-4">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? 'กำลังลบ...' : 'ลบออก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 mb-5">{modal === 'create' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขข้อมูลผู้ใช้'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ *</label>
                  <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">อีเมล *</label>
                  <input type="email" className={inp} value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={modal === 'edit'} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  รหัสผ่าน {modal === 'edit' && <span className="text-gray-400">(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
                </label>
                <input type="password" className={inp} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">แผนก</label>
                  <input className={inp} value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ตำแหน่ง</label>
                  <input className={inp} value={form.position || ''} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select className={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
              {modal === 'edit' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded"
                    checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <span className="text-sm text-gray-700">บัญชีใช้งานอยู่</span>
                </label>
              )}
            </div>
            {error && <p className="mt-3 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
