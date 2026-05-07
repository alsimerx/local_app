import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

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
      setSettings(r.data)
      dayjs.tz.setDefault(r.data.timezone || 'Asia/Bangkok')
      document.title = r.data.orgName || 'Workflow'
    }).catch(() => {})
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
