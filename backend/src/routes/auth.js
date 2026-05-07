import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    const { passwordHash, ...userSafe } = user
    res.json({ token, user: userSafe })
  } catch (err) { next(err) }
})

router.get('/me', authenticate, (req, res) => {
  const { passwordHash, ...userSafe } = req.user
  res.json(userSafe)
})

router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, department, position, currentPassword, newPassword } = req.body
    const data = { name, department, position }
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'กรุณาระบุรหัสผ่านปัจจุบัน' })
      const valid = await bcrypt.compare(currentPassword, req.user.passwordHash)
      if (!valid) return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' })
      if (newPassword.length < 6) return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' })
      data.passwordHash = await bcrypt.hash(newPassword, 10)
    }
    const user = await prisma.user.update({ where: { id: req.user.id }, data })
    const { passwordHash, ...userSafe } = user
    res.json(userSafe)
  } catch (err) { next(err) }
})

export default router
