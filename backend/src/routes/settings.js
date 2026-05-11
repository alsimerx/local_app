import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  orgName: 'Workflow',
  orgTagline: 'ระบบขออนุมัติเอกสาร',
  orgLogo: '',
  timezone: 'Asia/Bangkok',
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/logo')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `logo${ext}`)
  },
})
const uploadLogo = multer({ storage: logoStorage, limits: { fileSize: 2 * 1024 * 1024 } })

async function getAll() {
  const rows = await prisma.systemSetting.findMany()
  const map = { ...DEFAULTS }
  for (const r of rows) map[r.key] = r.value
  return map
}

// GET /api/settings — public ไม่ต้อง login
router.get('/', async (req, res, next) => {
  try {
    res.json(await getAll())
  } catch (err) { next(err) }
})

// PUT /api/settings — admin only
router.put('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const allowed = ['orgName', 'orgTagline', 'timezone', 'reminder_enabled', 'reminder_days']
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(req.body[key]) },
          create: { key, value: String(req.body[key]) },
        })
      }
    }
    res.json(await getAll())
  } catch (err) { next(err) }
})

// POST /api/settings/logo — admin only
router.post('/logo', authenticate, requireRole('admin'), uploadLogo.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' })
    const ext = path.extname(req.file.originalname)
    const logoPath = `/uploads/logo/logo${ext}`
    await prisma.systemSetting.upsert({
      where: { key: 'orgLogo' },
      update: { value: logoPath },
      create: { key: 'orgLogo', value: logoPath },
    })
    res.json({ orgLogo: logoPath })
  } catch (err) { next(err) }
})

// DELETE /api/settings/logo — admin only
router.delete('/logo', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'orgLogo' },
      update: { value: '' },
      create: { key: 'orgLogo', value: '' },
    })
    res.json({ orgLogo: '' })
  } catch (err) { next(err) }
})

export default router
