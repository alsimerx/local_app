import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import requestRoutes from './routes/requests.js'
import approvalRoutes from './routes/approvals.js'
import templateRoutes from './routes/templates.js'
import userRoutes from './routes/users.js'
import notificationRoutes from './routes/notifications.js'
import settingsRoutes from './routes/settings.js'
import reportsRoutes from './routes/reports.js'
import publicRoutes from './routes/public.js'
import { startReminderJob } from './services/reminderJob.js'
import { errorHandler } from './middlewares/errorHandler.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/public', publicRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  startReminderJob()
})
