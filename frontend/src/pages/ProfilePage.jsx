import { useState, useEffect } from 'react'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'

const ROLE_LABEL = { requester: 'Requester', approver: 'Approver', admin: 'Admin' }
const msgStyle = (m) => m.type === 'success'
  ? 'text-sm px-3 py-2 rounded-xl bg-[#e6fbff] text-[#0099b3]'
  : 'text-sm px-3 py-2 rounded-xl bg-[#fee2e2] text-[#dc2626]'
const ROLE_COLOR = {
  requester: { bg: 'var(--el-soft)', color: 'var(--el-muted)' },
  approver:  { bg: 'var(--el-cyan-soft)', color: '#0099b3' },
  admin:     { bg: 'var(--el-pink-soft)', color: 'var(--el-pink)' },
}

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

  // Delegate state (approver/admin only)
  const canDelegate = user?.role === 'approver' || user?.role === 'admin'
  const [delegateInfo, setDelegateInfo] = useState(null)
  const [delegateUsers, setDelegateUsers] = useState([])
  const [delegateForm, setDelegateForm] = useState({ delegateToId: '', delegateFromDate: '', delegateToDate: '' })
  const [delegateSaving, setDelegateSaving] = useState(false)
  const [delegateMsg, setDelegateMsg] = useState(null)

  useEffect(() => {
    if (!canDelegate) return
    api.get('/auth/me/delegate-info').then(r => {
      setDelegateInfo(r.data)
      if (r.data.delegateToId) {
        setDelegateForm({
          delegateToId: String(r.data.delegateToId),
          delegateFromDate: r.data.delegateFromDate ? dayjs(r.data.delegateFromDate).format('YYYY-MM-DD') : '',
          delegateToDate: r.data.delegateToDate ? dayjs(r.data.delegateToDate).format('YYYY-MM-DD') : '',
        })
      }
    })
    api.get('/users').then(r =>
      setDelegateUsers(r.data.filter(u => (u.role === 'approver' || u.role === 'admin') && u.id !== user?.id))
    )
  }, [canDelegate])

  const isDelegateActive = delegateInfo?.delegateToId && delegateInfo.delegateFromDate && delegateInfo.delegateToDate
    && new Date(delegateInfo.delegateFromDate) <= new Date() && new Date() <= new Date(delegateInfo.delegateToDate)

  const handleDelegateSave = async (e) => {
    e.preventDefault()
    if (!delegateForm.delegateToId || !delegateForm.delegateFromDate || !delegateForm.delegateToDate) {
      return setDelegateMsg({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' })
    }
    if (new Date(delegateForm.delegateFromDate) > new Date(delegateForm.delegateToDate)) {
      return setDelegateMsg({ type: 'error', text: 'วันเริ่มต้นต้องไม่เกินวันสิ้นสุด' })
    }
    setDelegateSaving(true)
    setDelegateMsg(null)
    try {
      const r = await api.patch('/auth/me/delegate', delegateForm)
      setDelegateInfo({ ...delegateInfo, ...r.data, delegateTo: delegateUsers.find(u => String(u.id) === String(delegateForm.delegateToId)) })
      setDelegateMsg({ type: 'success', text: 'บันทึกการมอบหมายเรียบร้อยแล้ว' })
    } catch (err) {
      setDelegateMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' })
    } finally {
      setDelegateSaving(false)
    }
  }

  const handleDelegateCancel = async () => {
    if (!confirm('ต้องการยกเลิกการมอบหมายหรือไม่?')) return
    try {
      await api.delete('/auth/me/delegate')
      setDelegateInfo({ delegateToId: null, delegateFromDate: null, delegateToDate: null, delegateTo: null })
      setDelegateForm({ delegateToId: '', delegateFromDate: '', delegateToDate: '' })
      setDelegateMsg({ type: 'success', text: 'ยกเลิกการมอบหมายเรียบร้อยแล้ว' })
    } catch (err) {
      setDelegateMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' })
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <div className="el-eyebrow">Account</div>
        <h2 className="text-[32px] font-bold text-[#0a0d2e]">โปรไฟล์ของฉัน</h2>
        <p className="text-[18px] text-[#6b7390] mt-1">ข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
      </div>

      {/* Profile card */}
      <div className="el-card p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--el-pink), var(--el-cyan))' }}>
          {initial}
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--el-ink)' }}>{user?.name}</h3>
          <p className="text-sm" style={{ color: 'var(--el-muted)' }}>{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: ROLE_COLOR[user?.role]?.bg, color: ROLE_COLOR[user?.role]?.color }}>
              {ROLE_LABEL[user?.role]}
            </span>
            {user?.department && <span className="text-xs" style={{ color: 'var(--el-muted)' }}>{user.department}</span>}
            {user?.position && <span className="text-xs" style={{ color: 'var(--el-muted)' }}>· {user.position}</span>}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Edit Profile */}
        <div className="el-card p-5">
          <h3 className="el-section-title mb-4">แก้ไขข้อมูลส่วนตัว</h3>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>ชื่อ *</label>
              <input className="el-input" value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>แผนก</label>
              <input className="el-input" value={profileForm.department}
                onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>ตำแหน่ง</label>
              <input className="el-input" value={profileForm.position}
                onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>อีเมล</label>
              <input className="el-input opacity-50" value={user?.email} disabled />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>Role</label>
              <input className="el-input opacity-50" value={ROLE_LABEL[user?.role]} disabled />
            </div>
            {profileMsg && (
              <p className={msgStyle(profileMsg)}>
                {profileMsg.text}
              </p>
            )}
            <button type="submit" disabled={profileSaving}
              className="el-btn-primary w-full justify-center disabled:opacity-50">
              {profileSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="el-card p-5">
          <h3 className="el-section-title mb-4">เปลี่ยนรหัสผ่าน</h3>
          <form onSubmit={handlePasswordSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>รหัสผ่านปัจจุบัน</label>
              <input type="password" className="el-input" value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>รหัสผ่านใหม่</label>
              <input type="password" className="el-input" value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>ยืนยันรหัสผ่านใหม่</label>
              <input type="password" className="el-input" value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </div>
            <p className="text-xs text-gray-400">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
            {pwMsg && (
              <p className={msgStyle(pwMsg)}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" disabled={pwSaving}
              className="el-btn-primary w-full justify-center disabled:opacity-50">
              {pwSaving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>
      </div>

      {/* Delegate section — approver/admin only */}
      {canDelegate && (
        <div className="mt-6 el-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="el-section-title">มอบหมายการอนุมัติ (Delegate)</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--el-muted)' }}>มอบหมายให้คนอื่นอนุมัติแทนในช่วงเวลาที่กำหนด</p>
            </div>
            {isDelegateActive && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: 'var(--el-amber-soft)', color: '#b97600' }}>
                กำลังมอบหมายให้ {delegateInfo?.delegateTo?.name}
              </span>
            )}
          </div>

          {delegateInfo?.delegateToId && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'var(--el-soft)', color: 'var(--el-ink)', border: '1px solid var(--el-line)' }}>
              <p>มอบหมายให้: <strong>{delegateInfo.delegateTo?.name || `User #${delegateInfo.delegateToId}`}</strong></p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--el-muted)' }}>
                {dayjs(delegateInfo.delegateFromDate).format('D/M/YYYY')} — {dayjs(delegateInfo.delegateToDate).format('D/M/YYYY')}
                {isDelegateActive ? ' (กำลังใช้งาน)' : ' (หมดอายุแล้ว)'}
              </p>
            </div>
          )}

          <form onSubmit={handleDelegateSave} className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>มอบหมายให้</label>
              <select className="el-input" value={delegateForm.delegateToId}
                onChange={e => setDelegateForm(f => ({ ...f, delegateToId: e.target.value }))}>
                <option value="">เลือกผู้รับมอบหมาย</option>
                {delegateUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>ตั้งแต่วันที่</label>
              <input type="date" className="el-input" value={delegateForm.delegateFromDate}
                onChange={e => setDelegateForm(f => ({ ...f, delegateFromDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>ถึงวันที่</label>
              <input type="date" className="el-input" value={delegateForm.delegateToDate}
                onChange={e => setDelegateForm(f => ({ ...f, delegateToDate: e.target.value }))} />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <button type="submit" disabled={delegateSaving} className="el-btn-primary w-full justify-center disabled:opacity-50">
                {delegateSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              {delegateInfo?.delegateToId && (
                <button type="button" onClick={handleDelegateCancel}
                  className="w-full py-2 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors">
                  ยกเลิกการมอบหมาย
                </button>
              )}
            </div>
          </form>

          {delegateMsg && (
            <p className={msgStyle(delegateMsg)}>
              {delegateMsg.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
