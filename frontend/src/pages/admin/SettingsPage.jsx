import { useState, useRef, useEffect } from 'react'
import api, { fileBaseURL } from '../../lib/axios'

const toFullUrl = (path) => path?.startsWith('/uploads/') ? `${fileBaseURL}${path}` : (path || '')
import { useSettings } from '../../context/SettingsContext'

const TIMEZONES = [
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+7) — ไทย, เวียดนาม, ลาว' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8) — สิงคโปร์, มาเลเซีย' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9) — ญี่ปุ่น, เกาหลี' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+5:30) — อินเดีย' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0/+1)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5/-4)' },
  { value: 'UTC', label: 'UTC (UTC+0)' },
]

function Msg({ msg }) {
  if (!msg) return null
  return (
    <p className="text-sm px-3 py-2 rounded-xl"
      style={{
        background: msg.type === 'success' ? 'var(--el-cyan-soft)' : '#fee2e2',
        color: msg.type === 'success' ? '#0099b3' : '#dc2626',
      }}>
      {msg.text}
    </p>
  )
}

export default function SettingsPage() {
  const { settings, setSettings } = useSettings()
  const [form, setForm] = useState({
    orgName: settings.orgName,
    orgTagline: settings.orgTagline,
    timezone: settings.timezone,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoMsg, setLogoMsg] = useState(null)
  const logoRef = useRef()

  const [reminder, setReminder] = useState({ reminder_enabled: 'false', reminder_days: '3' })
  const [reminderSaving, setReminderSaving] = useState(false)
  const [reminderMsg, setReminderMsg] = useState(null)

  useEffect(() => {
    api.get('/settings').then(r => {
      setReminder({
        reminder_enabled: r.data.reminder_enabled ?? 'false',
        reminder_days: r.data.reminder_days ?? '3',
      })
    })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.orgName.trim()) return setMsg({ type: 'error', text: 'กรุณากรอกชื่อองค์กร' })
    setSaving(true)
    setMsg(null)
    try {
      const r = await api.put('/settings', form)
      setSettings(r.data)
      document.title = r.data.orgName
      setMsg({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoUploading(true)
    setLogoMsg(null)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const r = await api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSettings(s => ({ ...s, orgLogo: toFullUrl(r.data.orgLogo) }))
      setLogoMsg({ type: 'success', text: 'อัปโหลดโลโก้เรียบร้อยแล้ว' })
    } catch (err) {
      setLogoMsg({ type: 'error', text: 'อัปโหลดไม่สำเร็จ' })
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleReminderSave = async (e) => {
    e.preventDefault()
    const days = parseInt(reminder.reminder_days, 10)
    if (isNaN(days) || days < 1) return setReminderMsg({ type: 'error', text: 'จำนวนวันต้องมากกว่า 0' })
    setReminderSaving(true)
    setReminderMsg(null)
    try {
      await api.put('/settings', reminder)
      setReminderMsg({ type: 'success', text: 'บันทึกการตั้งค่าแจ้งเตือนเรียบร้อยแล้ว' })
    } catch (err) {
      setReminderMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' })
    } finally {
      setReminderSaving(false)
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('ต้องการลบโลโก้หรือไม่?')) return
    await api.delete('/settings/logo')
    setSettings(s => ({ ...s, orgLogo: '' }))
    setLogoMsg({ type: 'success', text: 'ลบโลโก้แล้ว' })
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-7">
        <div className="el-eyebrow">Admin</div>
        <h2 className="text-[32px] font-bold text-[#0a0d2e]">ตั้งค่าระบบ</h2>
        <p className="text-[18px] text-[#6b7390] mt-1">ข้อมูลองค์กรและการตั้งค่าทั่วไป</p>
      </div>

      <div className="space-y-5">
        {/* Logo */}
        <div className="el-card p-5">
          <h3 className="el-section-title mb-4">โลโก้องค์กร</h3>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ borderColor: 'var(--el-line)', background: 'var(--el-soft)' }}>
              {settings.orgLogo
                ? <img src={settings.orgLogo} alt="logo" className="w-full h-full object-contain p-1" />
                : <span className="text-3xl font-bold" style={{ color: 'var(--el-pink)' }}>{settings.orgName?.charAt(0)}</span>
              }
            </div>
            <div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => logoRef.current.click()} disabled={logoUploading}
                  className="px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--el-line)', color: 'var(--el-muted)' }}>
                  {logoUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้'}
                </button>
                {settings.orgLogo && (
                  <button onClick={handleLogoDelete}
                    className="px-3 py-1.5 border border-red-100 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
                    ลบโลโก้
                  </button>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--el-muted)' }}>PNG, JPG, SVG — ไม่เกิน 2MB</p>
              <Msg msg={logoMsg} />
              <input ref={logoRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="el-card p-5">
          <h3 className="el-section-title mb-4">ข้อมูลองค์กร</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>
                ชื่อองค์กร <span style={{ color: 'var(--el-pink)' }}>*</span>
              </label>
              <input className="el-input" value={form.orgName}
                onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: 'var(--el-muted)' }}>แสดงใน Sidebar และ browser tab</p>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>คำอธิบาย / tagline</label>
              <input className="el-input" value={form.orgTagline}
                onChange={e => setForm(f => ({ ...f, orgTagline: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>Timezone</label>
              <select className="el-input" value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--el-muted)' }}>ใช้สำหรับแสดงวันและเวลาทั่วทั้งระบบ</p>
            </div>
            <Msg msg={msg} />
            <button type="submit" disabled={saving} className="el-btn-primary w-full justify-center disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </form>
        </div>

        {/* Reminder Settings */}
        <div className="el-card p-5">
          <h3 className="el-section-title mb-1">การแจ้งเตือนอัตโนมัติ</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--el-muted)' }}>แจ้งเตือนผู้อนุมัติเมื่อมีคำขอค้างนานเกินที่กำหนด</p>
          <form onSubmit={handleReminderSave} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--el-ink)' }}>เปิดการแจ้งเตือนอัตโนมัติ</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--el-muted)' }}>ส่ง notification ทุกวัน 08:00 สำหรับคำขอที่ค้าง</p>
              </div>
              <button type="button"
                onClick={() => setReminder(r => ({ ...r, reminder_enabled: r.reminder_enabled === 'true' ? 'false' : 'true' }))}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={reminder.reminder_enabled === 'true'
                  ? { background: 'linear-gradient(135deg, var(--el-pink), var(--el-cyan))' }
                  : { background: '#e2e8f0' }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${reminder.reminder_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {reminder.reminder_enabled === 'true' && (
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--el-ink)' }}>แจ้งเตือนเมื่อค้างนาน (วัน)</label>
                <input type="number" min="1" max="30" className="el-input"
                  style={{ width: '7rem' }}
                  value={reminder.reminder_days}
                  onChange={e => setReminder(r => ({ ...r, reminder_days: e.target.value }))} />
                <p className="text-xs mt-1" style={{ color: 'var(--el-muted)' }}>ระบบจะแจ้งเตือนทุกวันจนกว่าจะมีการดำเนินการ</p>
              </div>
            )}
            <Msg msg={reminderMsg} />
            <button type="submit" disabled={reminderSaving} className="el-btn-primary w-full justify-center disabled:opacity-50">
              {reminderSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="el-card p-5">
          <h3 className="el-section-title mb-3">ตัวอย่าง Sidebar</h3>
          <div className="rounded-xl p-4 w-52" style={{ background: 'linear-gradient(160deg, #080b24, #0d1140)' }}>
            <div className="flex items-center gap-2">
              {settings.orgLogo
                ? <img src={settings.orgLogo} alt="logo" className="w-7 h-7 object-contain rounded" />
                : <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, var(--el-pink), var(--el-cyan))' }}>
                    {form.orgName?.charAt(0)}
                  </div>
              }
              <div>
                <p className="text-white font-bold text-sm leading-tight">{form.orgName || 'Workflow'}</p>
                <p className="text-white/40 text-xs">{form.orgTagline || 'ระบบขออนุมัติเอกสาร'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
