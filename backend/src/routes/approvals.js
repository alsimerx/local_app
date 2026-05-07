import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/approvals
router.get('/', authenticate, async (req, res, next) => {
  try {
    const allSteps = await prisma.approvalStep.findMany({
      where: { approverId: req.user.id, status: 'pending', request: { status: 'pending' } },
      include: {
        request: {
          include: {
            template: { select: { name: true, category: true } },
            requester: { select: { name: true, department: true } },
          },
        },
        templateStep: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const activeSteps = allSteps.filter(s => s.stepOrder === s.request.currentStep)
    res.json(activeSteps)
  } catch (err) { next(err) }
})

async function handleAction(req, res, next, action) {
  try {
    const { comment } = req.body
    const step = await prisma.approvalStep.findUnique({
      where: { id: Number(req.params.stepId) },
      include: {
        request: {
          include: {
            template: { include: { steps: { orderBy: { order: 'asc' } } } },
          },
        },
      },
    })

    if (!step) return res.status(404).json({ error: 'ไม่พบข้อมูล' })
    if (step.approverId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    if (step.status !== 'pending') return res.status(400).json({ error: 'ดำเนินการนี้แล้ว' })
    if (step.request.status !== 'pending') return res.status(400).json({ error: 'คำขอไม่อยู่ในสถานะรออนุมัติ' })
    if (step.stepOrder !== step.request.currentStep) return res.status(400).json({ error: 'ยังไม่ถึงคิวของคุณ' })

    await prisma.approvalStep.update({
      where: { id: step.id },
      data: { status: action, comment: comment || null, actionedAt: new Date() },
    })

    const request = step.request
    let newStatus = request.status
    let newCurrentStep = request.currentStep
    let completedAt = null

    let nextStepData = null
    if (action === 'approved') {
      const steps = request.template.steps
      const nextStep = steps.find(s => s.order > request.currentStep)
      if (nextStep) {
        newCurrentStep = nextStep.order
        nextStepData = nextStep
      } else {
        newStatus = 'approved'
        completedAt = new Date()
      }
    } else if (action === 'rejected') {
      newStatus = 'rejected'
      completedAt = new Date()
    } else if (action === 'returned') {
      newStatus = 'returned'
    }

    await prisma.request.update({
      where: { id: request.id },
      data: { status: newStatus, currentStep: newCurrentStep, completedAt },
    })

    await prisma.auditLog.create({
      data: {
        requestId: request.id,
        actorId: req.user.id,
        action,
        oldStatus: request.status,
        newStatus,
        comment: comment || null,
      },
    })

    if (action === 'approved' && nextStepData) {
      const nextApprovers = await prisma.templateStepApprover.findMany({ where: { stepId: nextStepData.id } })
      for (const a of nextApprovers) {
        await prisma.notification.create({
          data: {
            userId: a.userId,
            title: 'มีคำขอรออนุมัติ',
            body: `"${request.title}" รอการอนุมัติจากคุณใน ${nextStepData.name}`,
            type: 'pending_approval',
            requestId: request.id,
          },
        })
      }
    } else if (action === 'approved' && newStatus === 'approved') {
      await prisma.notification.create({
        data: {
          userId: request.requesterId,
          title: 'คำขออนุมัติแล้ว ✓',
          body: `"${request.title}" ได้รับการอนุมัติเรียบร้อยแล้ว`,
          type: 'approved',
          requestId: request.id,
        },
      })
    } else if (action === 'rejected') {
      await prisma.notification.create({
        data: {
          userId: request.requesterId,
          title: 'คำขอถูกปฏิเสธ',
          body: `"${request.title}" ถูกปฏิเสธ${comment ? `: ${comment}` : ''}`,
          type: 'rejected',
          requestId: request.id,
        },
      })
    } else if (action === 'returned') {
      await prisma.notification.create({
        data: {
          userId: request.requesterId,
          title: 'คำขอถูกส่งกลับแก้ไข',
          body: `"${request.title}" ถูกส่งกลับให้แก้ไข${comment ? `: ${comment}` : ''}`,
          type: 'returned',
          requestId: request.id,
        },
      })
    }

    const messages = { approved: 'อนุมัติเรียบร้อยแล้ว', rejected: 'ปฏิเสธเรียบร้อยแล้ว', returned: 'ส่งกลับแก้ไขเรียบร้อยแล้ว' }
    res.json({ message: messages[action] })
  } catch (err) { next(err) }
}

router.post('/:stepId/approve', authenticate, (req, res, next) => handleAction(req, res, next, 'approved'))
router.post('/:stepId/reject', authenticate, (req, res, next) => handleAction(req, res, next, 'rejected'))
router.post('/:stepId/return', authenticate, (req, res, next) => handleAction(req, res, next, 'returned'))

router.post('/:stepId/comment', authenticate, async (req, res, next) => {
  try {
    const { comment } = req.body
    const step = await prisma.approvalStep.findUnique({ where: { id: Number(req.params.stepId) } })
    if (!step || step.approverId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await prisma.auditLog.create({
      data: { requestId: step.requestId, actorId: req.user.id, action: 'commented', comment },
    })
    res.json({ message: 'เพิ่มความเห็นเรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

export default router
