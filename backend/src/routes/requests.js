import express from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8')
    cb(null, `${Date.now()}-${decoded}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

async function generateRequestNumber() {
  const year = new Date().getFullYear()
  const prefix = `REQ-${year}-`
  const last = await prisma.request.findFirst({
    where: { requestNumber: { startsWith: prefix } },
    orderBy: { requestNumber: 'desc' },
  })
  const lastNum = last ? parseInt(last.requestNumber.replace(prefix, ''), 10) : 0
  return `${prefix}${String(lastNum + 1).padStart(5, '0')}`
}

// GET /api/requests
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query
    const isAdmin = req.user.role === 'admin'
    const where = isAdmin ? {} : { requesterId: req.user.id }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { requestNumber: { contains: search } },
        ...(isAdmin ? [{ requester: { name: { contains: search } } }] : []),
      ]
    }

    const [total, requests] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.findMany({
        where,
        include: {
          template: { select: { name: true, category: true } },
          requester: { select: { name: true, department: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
    ])

    res.json({ data: requests, total, page: Number(page), limit: Number(limit) })
  } catch (err) { next(err) }
})

// POST /api/requests
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { templateId, title, formData } = req.body
    const requestNumber = await generateRequestNumber()

    const request = await prisma.request.create({
      data: {
        requestNumber,
        templateId: Number(templateId),
        requesterId: req.user.id,
        title,
        formData: JSON.stringify(formData || {}),
        status: 'draft',
      },
    })

    await prisma.auditLog.create({
      data: { requestId: request.id, actorId: req.user.id, action: 'created', newStatus: 'draft' },
    })

    res.status(201).json(request)
  } catch (err) { next(err) }
})

// GET /api/requests/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const request = await prisma.request.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        template: {
          include: {
            fields: { orderBy: { order: 'asc' } },
            steps: {
              orderBy: { order: 'asc' },
              include: { approvers: { include: { user: { select: { id: true, name: true } } } } },
            },
          },
        },
        requester: { select: { id: true, name: true, email: true, department: true, position: true } },
        approvalSteps: {
          include: {
            approver: { select: { id: true, name: true } },
            templateStep: { select: { name: true, order: true, stepType: true } },
          },
          orderBy: { stepOrder: 'asc' },
        },
        attachments: true,
        auditLogs: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!request) return res.status(404).json({ error: 'ไม่พบข้อมูล' })

    const isRequester = request.requesterId === req.user.id
    const isApprover = request.approvalSteps.some(s => s.approverId === req.user.id)
    const isAdmin = req.user.role === 'admin'
    // also allow active delegates
    let isDelegate = false
    if (!isRequester && !isApprover && !isAdmin) {
      const approverIds = [...new Set(request.approvalSteps.map(s => s.approverId))]
      const now = new Date()
      const delegator = await prisma.user.findFirst({
        where: { id: { in: approverIds }, delegateToId: req.user.id, delegateFromDate: { lte: now }, delegateToDate: { gte: now } },
      })
      isDelegate = !!delegator
    }
    if (!isRequester && !isApprover && !isAdmin && !isDelegate) return res.status(403).json({ error: 'Forbidden' })

    // find delegate step: step in currentStep where current user is acting as delegate
    let delegateStepId = null
    let delegatingForName = null
    if (!isApprover && request.status === 'pending') {
      const now = new Date()
      const currentStepApprovers = request.approvalSteps
        .filter(s => s.stepOrder === request.currentStep && s.status === 'pending')
        .map(s => s.approverId)
      if (currentStepApprovers.length > 0) {
        const delegator = await prisma.user.findFirst({
          where: { id: { in: currentStepApprovers }, delegateToId: req.user.id, delegateFromDate: { lte: now }, delegateToDate: { gte: now } },
          select: { id: true, name: true },
        })
        if (delegator) {
          const delegateStep = request.approvalSteps.find(s => s.approverId === delegator.id && s.stepOrder === request.currentStep && s.status === 'pending')
          if (delegateStep) {
            delegateStepId = delegateStep.id
            delegatingForName = delegator.name
          }
        }
      }
    }

    res.json({ ...request, delegateStepId, delegatingForName })
  } catch (err) { next(err) }
})

// PATCH /api/requests/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const request = await prisma.request.findUnique({ where: { id: Number(req.params.id) } })
    if (!request) return res.status(404).json({ error: 'ไม่พบข้อมูล' })
    if (request.requesterId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    if (!['draft', 'returned'].includes(request.status)) {
      return res.status(400).json({ error: 'แก้ไขได้เฉพาะ Draft หรือ Returned เท่านั้น' })
    }

    const { title, formData } = req.body
    const updated = await prisma.request.update({
      where: { id: request.id },
      data: { title, formData: JSON.stringify(formData) },
    })
    res.json(updated)
  } catch (err) { next(err) }
})

// POST /api/requests/:id/submit
router.post('/:id/submit', authenticate, async (req, res, next) => {
  try {
    const request = await prisma.request.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        template: {
          include: { steps: { include: { approvers: true }, orderBy: { order: 'asc' } } },
        },
      },
    })
    if (!request) return res.status(404).json({ error: 'ไม่พบข้อมูล' })
    if (request.requesterId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    if (!['draft', 'returned'].includes(request.status)) {
      return res.status(400).json({ error: 'ไม่สามารถส่งคำขอนี้ได้' })
    }

    const steps = request.template.steps
    if (steps.length === 0) return res.status(400).json({ error: 'Template ไม่มีขั้นตอนอนุมัติ' })

    await prisma.approvalStep.deleteMany({ where: { requestId: request.id } })

    for (const step of steps) {
      for (const approver of step.approvers) {
        await prisma.approvalStep.create({
          data: {
            requestId: request.id,
            templateStepId: step.id,
            stepOrder: step.order,
            approverId: approver.userId,
            status: 'pending',
          },
        })
      }
    }

    await prisma.request.update({
      where: { id: request.id },
      data: { status: 'pending', currentStep: 1, submittedAt: new Date() },
    })

    await prisma.auditLog.create({
      data: { requestId: request.id, actorId: req.user.id, action: 'submitted', oldStatus: request.status, newStatus: 'pending' },
    })

    const firstStep = steps[0]
    for (const approver of firstStep.approvers) {
      await prisma.notification.create({
        data: {
          userId: approver.userId,
          title: 'มีคำขอรออนุมัติ',
          body: `"${request.title}" รอการอนุมัติจากคุณใน ${firstStep.name}`,
          type: 'pending_approval',
          requestId: request.id,
        },
      })
    }

    res.json({ message: 'ส่งคำขอเรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

// POST /api/requests/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const request = await prisma.request.findUnique({ where: { id: Number(req.params.id) } })
    if (!request) return res.status(404).json({ error: 'ไม่พบข้อมูล' })
    if (request.requesterId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    if (['approved', 'rejected', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ error: 'ไม่สามารถยกเลิกคำขอนี้ได้' })
    }

    await prisma.request.update({ where: { id: request.id }, data: { status: 'cancelled' } })
    await prisma.auditLog.create({
      data: { requestId: request.id, actorId: req.user.id, action: 'cancelled', oldStatus: request.status, newStatus: 'cancelled' },
    })
    res.json({ message: 'ยกเลิกคำขอเรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

// POST /api/requests/:id/attachments
router.post('/:id/attachments', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' })
    const thaiFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
    const attachment = await prisma.requestAttachment.create({
      data: {
        requestId: Number(req.params.id),
        filename: thaiFilename,
        filePath: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    })
    res.status(201).json(attachment)
  } catch (err) { next(err) }
})

// DELETE /api/requests/:id/attachments/:attachId
router.delete('/:id/attachments/:attachId', authenticate, async (req, res, next) => {
  try {
    const attachment = await prisma.requestAttachment.findUnique({
      where: { id: Number(req.params.attachId) },
      include: { request: true },
    })
    if (!attachment) return res.status(404).json({ error: 'ไม่พบไฟล์' })
    if (attachment.request.requesterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const filePath = path.join(__dirname, '../../../', attachment.filePath)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await prisma.requestAttachment.delete({ where: { id: attachment.id } })
    res.json({ message: 'ลบไฟล์แล้ว' })
  } catch (err) { next(err) }
})

// DELETE /api/requests/:id — admin only
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const request = await prisma.request.findUnique({ where: { id: Number(req.params.id) } })
    if (!request) return res.status(404).json({ error: 'ไม่พบข้อมูล' })
    await prisma.request.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'ลบคำขอเรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

export default router
