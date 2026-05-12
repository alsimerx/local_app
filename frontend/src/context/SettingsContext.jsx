import { createContext, useContext, useState, useEffect } from 'react'
import api, { fileBaseURL } from '../lib/axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const toFullUrl = (path) => path?.startsWith('/uploads/') ? `${fileBaseURL}${path}` : (path || '')

const DEFAULTS = {
  orgName: 'Workflow',
  orgTagline: 'ระบบขออนุมัติเอกสาร',
  orgLogo: '',
  timezone: 'Asia/Bangkok',
}

const SettingsContext = createContext(DEFAULTS)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  useEffect(() => {
    api.get('/settings').then(r => {
      const data = { ...r.data, orgLogo: toFullUrl(r.data.orgLogo) }
      setSettings(data)
      dayjs.tz.setDefault(data.timezone || 'Asia/Bangkok')
      document.title = data.orgName || 'Workflow'
    }).catch(() => {})
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
