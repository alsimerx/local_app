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

// PATCH /api/auth/me/delegate — set delegate
router.patch('/me/delegate', authenticate, async (req, res, next) => {
  try {
    const { delegateToId, delegateFromDate, delegateToDate } = req.body
    if (!delegateToId || !delegateFromDate || !delegateToDate) {
      return res.status(400).json({ error: 'กรุณาระบุผู้รับมอบหมายและช่วงวันที่' })
    }
    if (Number(delegateToId) === req.user.id) {
      return res.status(400).json({ error: 'ไม่สามารถมอบหมายให้ตัวเองได้' })
    }
    const target = await prisma.user.findUnique({ where: { id: Number(delegateToId) } })
    if (!target || !target.isActive) return res.status(400).json({ error: 'ไม่พบผู้ใช้ที่ระบุ' })

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        delegateToId: Number(delegateToId),
        delegateFromDate: new Date(delegateFromDate),
        delegateToDate: new Date(delegateToDate),
      },
    })
    const { passwordHash, ...userSafe } = user
    res.json(userSafe)
  } catch (err) { next(err) }
})

// DELETE /api/auth/me/delegate — cancel delegate
router.delete('/me/delegate', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { delegateToId: null, delegateFromDate: null, delegateToDate: null },
    })
    res.json({ message: 'ยกเลิกการมอบหมายเรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

// GET /api/auth/me/delegate-info — get current delegate info with name
router.get('/me/delegate-info', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { delegateTo: { select: { id: true, name: true, email: true } } },
    })
    res.json({
      delegateToId: user.delegateToId,
      delegateFromDate: user.delegateFromDate,
      delegateToDate: user.delegateToDate,
      delegateTo: user.delegateTo,
    })
  } catch (err) { next(err) }
})

export default router
