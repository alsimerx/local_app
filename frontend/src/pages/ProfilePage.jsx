import { useState } from 'react'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

const ROLE_LABEL = { requester: 'Requester', approver: 'Approver', admin: 'Admin' }
const ROLE_COLOR = { requester: 'bg-gray-100 text-gray-600', approver: 'bg-blue-100 text-blue-700', admin: 'bg-purple-100 text-purple-700' }

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    position: user?.position || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim()) return setProfileMsg({ type: 'error', text: 'กรุณากรอกชื่อ' })
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const r = await api.patch('/auth/me', profileForm)
      updateUser(r.data)
      setProfileMsg({ type: 'success', text: 'บันทึกข้อมูลเรียบร้อยแล้ว' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (!pwForm.currentPassword || !pwForm.newPassword) return setPwMsg({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' })
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwMsg({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' })
    if (pwForm.newPassword.length < 6) return setPwMsg({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' })
    setPwSaving(true)
    setPwMsg(null)
    try {
      await api.patch('/auth/me', {
        name: user.name,
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' })
    } finally {
      setPwSaving(false)
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">โปรไฟล์ของฉัน</h2>
        <p className="text-sm text-gray-500 mt-0.5">ข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {initial}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[user?.role]}`}>
              {ROLE_LABEL[user?.role]}
            </span>
            {user?.department && <span className="text-xs text-gray-400">{user.department}</span>}
            {user?.position && <span className="text-xs text-gray-400">· {user.position}</span>}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Edit Profile */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">แก้ไขข้อมูลส่วนตัว</h3>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ *</label>
              <input className={inp} value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">แผนก</label>
              <input className={inp} value={profileForm.department}
                onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ตำแหน่ง</label>
              <input className={inp} value={profileForm.position}
                onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">อีเมล</label>
              <input className={`${inp} bg-gray-50 text-gray-400`} value={user?.email} disabled />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <input className={`${inp} bg-gray-50 text-gray-400`} value={ROLE_LABEL[user?.role]} disabled />
            </div>
            {profileMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {profileMsg.text}
              </p>
            )}
            <button type="submit" disabled={profileSaving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {profileSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">เปลี่ยนรหัสผ่าน</h3>
          <form onSubmit={handlePasswordSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">รหัสผ่านปัจจุบัน</label>
              <input type="password" className={inp} value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">รหัสผ่านใหม่</label>
              <input type="password" className={inp} value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <input type="password" className={inp} value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </div>
            <p className="text-xs text-gray-400">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
            {pwMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" disabled={pwSaving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {pwSaving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
