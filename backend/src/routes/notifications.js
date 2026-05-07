import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id, type: 'pending_approval' },
      include: { request: { select: { requestNumber: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    res.json(notifications)
  } catch (err) { next(err) }
})

router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false, type: 'pending_approval' },
    })
    res.json({ count })
  } catch (err) { next(err) }
})

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: Number(req.params.id), userId: req.user.id },
      data: { isRead: true },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
