import { useState, useRef } from 'react'
import api from '../../lib/axios'
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

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

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
      setSettings(s => ({ ...s, orgLogo: r.data.orgLogo }))
      setLogoMsg({ type: 'success', text: 'อัปโหลดโลโก้เรียบร้อยแล้ว' })
    } catch (err) {
      setLogoMsg({ type: 'error', text: 'อัปโหลดไม่สำเร็จ' })
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('ต้องการลบโลโก้หรือไม่?')) return
    await api.delete('/settings/logo')
    setSettings(s => ({ ...s, orgLogo: '' }))
    setLogoMsg({ type: 'success', text: 'ลบโลโก้แล้ว' })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">ตั้งค่าระบบ</h2>
        <p className="text-sm text-gray-500 mt-0.5">ข้อมูลองค์กรและการตั้งค่าทั่วไป</p>
      </div>

      <div className="space-y-5">
        {/* Logo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">โลโก้องค์กร</h3>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
              {settings.orgLogo
                ? <img src={settings.orgLogo} alt="logo" className="w-full h-full object-contain p-1" />
                : <span className="text-3xl font-bold text-blue-600">{settings.orgName?.charAt(0)}</span>
              }
            </div>
            <div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => logoRef.current.click()} disabled={logoUploading}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  {logoUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้'}
                </button>
                {settings.orgLogo && (
                  <button onClick={handleLogoDelete}
                    className="px-3 py-1.5 border border-red-100 rounded-lg text-sm text-red-500 hover:bg-red-50">
                    ลบโลโก้
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400">PNG, JPG, SVG — ไม่เกิน 2MB</p>
              {logoMsg && (
                <p className={`text-xs mt-1 ${logoMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{logoMsg.text}</p>
              )}
              <input ref={logoRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">ข้อมูลองค์กร</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อองค์กร *</label>
              <input className={inp} value={form.orgName}
                onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">แสดงใน Sidebar และ browser tab</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">คำอธิบาย / tagline</label>
              <input className={inp} value={form.orgTagline}
                onChange={e => setForm(f => ({ ...f, orgTagline: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
              <select className={inp} value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">ใช้สำหรับแสดงวันและเวลาทั่วทั้งระบบ</p>
            </div>

            {msg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {msg.text}
              </p>
            )}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">ตัวอย่าง Sidebar</h3>
          <div className="bg-blue-800 rounded-xl p-4 w-48">
            <div className="flex items-center gap-2">
              {settings.orgLogo
                ? <img src={settings.orgLogo} alt="logo" className="w-7 h-7 object-contain rounded" />
                : <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{form.orgName?.charAt(0)}</div>
              }
              <div>
                <p className="text-white font-bold text-sm leading-tight">{form.orgName || 'Workflow'}</p>
                <p className="text-blue-300 text-xs">{form.orgTagline || 'ระบบขออนุมัติเอกสาร'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
