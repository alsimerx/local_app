import express from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

const select = { id: true, name: true, email: true, role: true, department: true, position: true, isActive: true, createdAt: true }

router.get('/', authenticate, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select, orderBy: { name: 'asc' } })
    res.json(users)
  } catch (err) { next(err) }
})

router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role, department, position } = req.body
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, passwordHash, role, department, position }, select })
    res.status(201).json(user)
  } catch (err) { next(err) }
})

router.put('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, role, department, position, isActive, password } = req.body
    const data = { name, role, department, position, isActive }
    if (password) data.passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data, select })
    res.json(user)
  } catch (err) { next(err) }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (id === req.user.id) return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' })

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return res.status(404).json({ error: 'ไม่พบผู้ใช้' })

    const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } })
    if (target.role === 'admin' && adminCount <= 1)
      return res.status(400).json({ error: 'ไม่สามารถลบ Admin คนสุดท้ายได้' })

    const requestCount = await prisma.request.count({ where: { requesterId: id } })
    if (requestCount > 0)
      return res.status(400).json({ error: `ไม่สามารถลบได้ เนื่องจากผู้ใช้มีคำขอที่เกี่ยวข้อง ${requestCount} รายการ` })

    const approvalCount = await prisma.approvalStep.count({ where: { approverId: id } })
    if (approvalCount > 0)
      return res.status(400).json({ error: `ไม่สามารถลบได้ เนื่องจากผู้ใช้เคยดำเนินการอนุมัติ ${approvalCount} รายการ` })

    const auditCount = await prisma.auditLog.count({ where: { actorId: id } })
    if (auditCount > 0)
      return res.status(400).json({ error: `ไม่สามารถลบได้ เนื่องจากผู้ใช้มีประวัติการดำเนินงานในระบบ` })

    // ลบ records ที่ไม่มี cascade: TemplateStepApprover, Notification
    await prisma.templateStepApprover.deleteMany({ where: { userId: id } })
    await prisma.notification.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })
    res.json({ message: 'ลบผู้ใช้เรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

export default router
