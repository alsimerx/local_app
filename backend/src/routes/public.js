import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

async function generatePetitionNumber() {
  const year = new Date().getFullYear()
  const prefix = `PET-${year}-`
  const last = await prisma.request.findFirst({
    where: { requestNumber: { startsWith: prefix } },
    orderBy: { requestNumber: 'desc' },
  })
  const lastNum = last ? parseInt(last.requestNumber.replace(prefix, ''), 10) : 0
  return `${prefix}${String(lastNum + 1).padStart(5, '0')}`
}

// POST /api/public/petition — submit without login
router.post('/petition', async (req, res, next) => {
  try {
    const { petitionerName, petitionerPhone, type, detail, location } = req.body

    if (!petitionerName?.trim()) return res.status(400).json({ error: 'กรุณาระบุชื่อ-นามสกุล' })
    if (!petitionerPhone?.trim()) return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์' })
    if (!type?.trim()) return res.status(400).json({ error: 'กรุณาเลือกประเภทคำร้อง' })
    if (!detail?.trim()) return res.status(400).json({ error: 'กรุณาระบุรายละเอียด' })

    const systemUser = await prisma.user.findUnique({ where: { email: 'system.petition@internal' } })
    const template = await prisma.workflowTemplate.findFirst({
      where: { name: 'คำร้องทั่วไป (ประชาชน)' },
      include: {
        fields: { orderBy: { order: 'asc' } },
        steps: { include: { approvers: true }, orderBy: { order: 'asc' } },
      },
    })

    if (!systemUser || !template) {
      return res.status(500).json({ error: 'ระบบไม่พร้อม กรุณาติดต่อเจ้าหน้าที่' })
    }

    // Map submitted values to template field IDs
    const formData = {}
    for (const field of template.fields) {
      if (field.label === 'ประเภทคำร้อง') formData[field.id] = type
      else if (field.label === 'รายละเอียด') formData[field.id] = detail
      else if (field.label === 'สถานที่ / ที่อยู่ที่เกี่ยวข้อง') formData[field.id] = location || ''
    }

    const requestNumber = await generatePetitionNumber()

    const request = await prisma.request.create({
      data: {
        requestNumber,
        templateId: template.id,
        requesterId: systemUser.id,
        title: `[${type}] ${petitionerName.trim()}`,
        formData: JSON.stringify(formData),
        petitionerName: petitionerName.trim(),
        petitionerPhone: petitionerPhone.trim(),
        status: 'pending',
        currentStep: 1,
        submittedAt: new Date(),
      },
    })

    // Create approval steps
    for (const step of template.steps) {
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

    await prisma.auditLog.create({
      data: { requestId: request.id, actorId: systemUser.id, action: 'submitted', newStatus: 'pending' },
    })

    // Notify first step approvers
    const firstStep = template.steps[0]
    if (firstStep) {
      for (const approver of firstStep.approvers) {
        await prisma.notification.create({
          data: {
            userId: approver.userId,
            title: 'มีคำร้องจากประชาชน',
            body: `${petitionerName.trim()} ยื่นคำร้อง: ${type}`,
            type: 'pending_approval',
            requestId: request.id,
          },
        })
      }
    }

    res.status(201).json({ requestNumber, message: 'ยื่นคำร้องเรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

// GET /api/public/petition/:refNumber — track without login
router.get('/petition/:refNumber', async (req, res, next) => {
  try {
    const request = await prisma.request.findUnique({
      where: { requestNumber: req.params.refNumber },
      include: {
        approvalSteps: {
          include: { templateStep: { select: { name: true } } },
          orderBy: { stepOrder: 'asc' },
        },
      },
    })

    if (!request || !request.requestNumber.startsWith('PET-')) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคำร้อง' })
    }

    res.json({
      requestNumber: request.requestNumber,
      title: request.title,
      status: request.status,
      petitionerName: request.petitionerName,
      createdAt: request.createdAt,
      currentStep: request.currentStep,
      steps: request.approvalSteps.map(s => ({
        name: s.templateStep?.name,
        stepOrder: s.stepOrder,
        status: s.status,
        comment: s.comment,
        actionedAt: s.actionedAt,
      })),
    })
  } catch (err) { next(err) }
})

export default router
