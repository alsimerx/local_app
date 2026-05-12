import { useState } from 'react'
import axios from 'axios'
import { fileBaseURL } from '../lib/axios'
import dayjs from 'dayjs'

const BASE = fileBaseURL

const PETITION_TYPES = [
  'แจ้งซ่อมถนน / ไฟฟ้า / ประปา',
  'ขอเอกสาร / หนังสือรับรอง',
  'ร้องเรียน / ข้อเสนอแนะ',
  'ขอรับสวัสดิการ / เงินช่วยเหลือ',
  'อื่นๆ',
]

const STATUS_LABEL = {
  pending: { text: 'รออนุมัติ', color: '#f59e0b' },
  approved: { text: 'ดำเนินการแล้ว', color: '#16a34a' },
  rejected: { text: 'ไม่อนุมัติ', color: '#dc2626' },
  returned: { text: 'ส่งกลับแก้ไข', color: '#f97316' },
  cancelled: { text: 'ยกเลิก', color: '#6b7280' },
}

export default function PetitionPage() {
  const [tab, setTab] = useState('form') // 'form' | 'track'
  const [form, setForm] = useState({ petitionerName: '', petitionerPhone: '', type: '', detail: '', location: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null) // { requestNumber }

  const [trackRef, setTrackRef] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState('')
  const [trackResult, setTrackResult] = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await axios.post(`${BASE}/api/public/petition`, form)
      setSuccess({ requestNumber: r.data.requestNumber })
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async e => {
    e.preventDefault()
    setTrackError('')
    setTrackResult(null)
    setTrackLoading(true)
    try {
      const r = await axios.get(`${BASE}/api/public/petition/${trackRef.trim().toUpperCase()}`)
      setTrackResult(r.data)
    } catch (err) {
      setTrackError(err.response?.data?.error || 'ไม่พบข้อมูลคำร้อง')
    } finally {
      setTrackLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ petitionerName: '', petitionerPhone: '', type: '', detail: '', location: '' })
    setSuccess(null)
    setError('')
  }

  return (
    <div className="min-h-screen" style={{
      background: 'radial-gradient(ellipse at 20% -10%, rgba(255,46,126,.3) 0%, transparent 55%), radial-gradient(ellipse at 110% 110%, rgba(0,224,255,.22) 0%, transparent 55%), linear-gradient(180deg, #0a0d2e 0%, #050720 100%)',
    }}>
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="" className="w-9 h-9 rounded-full object-contain bg-white p-0.5"
            onError={e => (e.currentTarget.style.display = 'none')} />
          <div>
            <div className="text-white font-bold text-sm leading-tight">อบต.แหลมสน</div>
            <div className="text-white/45 text-[10px] tracking-widest uppercase">e-Petition</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/55 bg-white/5 border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_#00e0ff]" />
          ระบบรับเรื่องออนไลน์
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-7">
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase mb-1"
            style={{ background: 'linear-gradient(90deg,#ff2e7e,#00e0ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            ระบบรับเรื่องราวร้องทุกข์และคำร้องทั่วไป
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ยื่นคำร้องออนไลน์</h1>
          <p className="text-white/45 text-sm mt-1">ไม่ต้องเดินทาง ยื่นได้ทุกที่ทุกเวลา</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[['form', 'ยื่นคำร้อง'], ['track', 'ติดตามสถานะ']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === key
                ? { background: 'linear-gradient(135deg,#ff2e7e,#00e0ff)', color: '#fff' }
                : { color: 'rgba(255,255,255,0.45)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* FORM TAB */}
        {tab === 'form' && (
          <>
            {success ? (
              /* Success screen */
              <div className="rounded-2xl p-7 text-center" style={{ background: 'rgba(15,18,50,.75)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                  style={{ background: 'rgba(22,163,74,0.15)', border: '2px solid #16a34a' }}>✓</div>
                <h2 className="text-xl font-bold text-white mb-1">ยื่นคำร้องสำเร็จ</h2>
                <p className="text-white/50 text-sm mb-5">กรุณาจดเลขที่คำร้องไว้เพื่อติดตามสถานะ</p>
                <div className="rounded-xl py-4 px-6 mb-5" style={{ background: 'rgba(0,224,255,0.08)', border: '1px solid rgba(0,224,255,0.25)' }}>
                  <p className="text-white/50 text-xs mb-1">เลขที่คำร้อง</p>
                  <p className="text-2xl font-extrabold tracking-widest" style={{ color: '#00e0ff' }}>{success.requestNumber}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetForm}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-white/15 text-white/70 hover:bg-white/5 transition">
                    ยื่นคำร้องใหม่
                  </button>
                  <button onClick={() => { setTab('track'); setTrackRef(success.requestNumber) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                    style={{ background: 'linear-gradient(135deg,#ff2e7e,#00e0ff)' }}>
                    ติดตามสถานะ
                  </button>
                </div>
              </div>
            ) : (
              /* Petition form */
              <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4"
                style={{ background: 'rgba(15,18,50,.75)', border: '1px solid rgba(255,255,255,.08)' }}>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="ชื่อ-นามสกุล *">
                    <input type="text" required placeholder="ชื่อ นามสกุล" value={form.petitionerName}
                      onChange={e => setForm(f => ({ ...f, petitionerName: e.target.value }))}
                      className="w-full bg-transparent outline-none text-sm text-white placeholder-white/30" />
                  </Field>
                  <Field label="เบอร์โทรศัพท์ *">
                    <input type="tel" required placeholder="0XX-XXX-XXXX" value={form.petitionerPhone}
                      onChange={e => setForm(f => ({ ...f, petitionerPhone: e.target.value }))}
                      className="w-full bg-transparent outline-none text-sm text-white placeholder-white/30" />
                  </Field>
                </div>

                <Field label="ประเภทคำร้อง *">
                  <select required value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-transparent outline-none text-sm text-white">
                    <option value="" disabled style={{ background: '#0d1140' }}>-- เลือกประเภทคำร้อง --</option>
                    {PETITION_TYPES.map(t => (
                      <option key={t} value={t} style={{ background: '#0d1140' }}>{t}</option>
                    ))}
                  </select>
                </Field>

                <Field label="รายละเอียด *">
                  <textarea required rows={4} placeholder="อธิบายรายละเอียดคำร้องของท่าน..." value={form.detail}
                    onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                    className="w-full bg-transparent outline-none text-sm text-white placeholder-white/30 resize-none" />
                </Field>

                <Field label="สถานที่ / ที่อยู่ที่เกี่ยวข้อง (ถ้ามี)">
                  <input type="text" placeholder="เช่น หมู่ 3 บ้านแหลมสน ถนนสายหลัก" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full bg-transparent outline-none text-sm text-white placeholder-white/30" />
                </Field>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.3)', color: '#fca5a5' }}>
                    ⚠ {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-70 transition-transform hover:-translate-y-px"
                  style={{ background: 'linear-gradient(135deg,#ff2e7e,#00e0ff)', boxShadow: '0 8px 24px -8px rgba(255,46,126,.5)' }}>
                  {loading ? 'กำลังส่งคำร้อง...' : 'ยื่นคำร้อง'}
                </button>
              </form>
            )}
          </>
        )}

        {/* TRACK TAB */}
        {tab === 'track' && (
          <div className="rounded-2xl p-6 space-y-5"
            style={{ background: 'rgba(15,18,50,.75)', border: '1px solid rgba(255,255,255,.08)' }}>
            <form onSubmit={handleTrack} className="flex gap-2">
              <input type="text" placeholder="เลขที่คำร้อง เช่น PET-2025-00001"
                value={trackRef} onChange={e => setTrackRef(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)' }} />
              <button type="submit" disabled={trackLoading || !trackRef.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
                style={{ background: 'linear-gradient(135deg,#ff2e7e,#00e0ff)' }}>
                {trackLoading ? '...' : 'ค้นหา'}
              </button>
            </form>

            {trackError && (
              <div className="px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(244,63,94,.12)', border: '1px solid rgba(244,63,94,.3)', color: '#fca5a5' }}>
                ⚠ {trackError}
              </div>
            )}

            {trackResult && (
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white/40 text-xs">เลขที่คำร้อง</p>
                      <p className="text-white font-bold tracking-wider">{trackResult.requestNumber}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: STATUS_LABEL[trackResult.status]?.color || '#6b7280' }}>
                      {STATUS_LABEL[trackResult.status]?.text || trackResult.status}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-1">{trackResult.title}</p>
                  <p className="text-white/40 text-xs">ยื่นเมื่อ {dayjs(trackResult.createdAt).format('D/M/YYYY HH:mm')}</p>
                </div>

                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">ขั้นตอนการดำเนินการ</p>
                  <div className="space-y-2">
                    {trackResult.steps?.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: s.status === 'approved' ? '#16a34a' : s.status === 'rejected' ? '#dc2626' : s.status === 'pending' ? '#f59e0b' : '#374151',
                            color: '#fff',
                          }}>
                          {s.status === 'approved' ? '✓' : s.status === 'rejected' ? '✕' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm">{s.name}</p>
                          {s.comment && <p className="text-white/40 text-xs mt-0.5">"{s.comment}"</p>}
                          {s.actionedAt && <p className="text-white/30 text-xs">{dayjs(s.actionedAt).format('D/M/YYYY HH:mm')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-white/25 text-xs mt-6">© องค์การบริหารส่วนตำบลแหลมสน · ระบบรับเรื่องออนไลน์</p>
      </main>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-white/50 text-xs font-semibold mb-1.5 tracking-wide">{label}</label>
      <div className="px-3.5 py-2.5 rounded-xl focus-within:ring-2 transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
        {children}
      </div>
    </div>
  )
}
