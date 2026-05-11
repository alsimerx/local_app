import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

const includeAll = {
  fields: { orderBy: { order: 'asc' } },
  steps: {
    orderBy: { order: 'asc' },
    include: { approvers: { include: { user: { select: { id: true, name: true, role: true } } } } },
  },
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    // admin sees all templates unless activeOnly=true is passed (used by new request selection page)
    const forceActive = req.query.activeOnly === 'true'
    const where = (req.user.role === 'admin' && !forceActive) ? {} : { isActive: true }
    const templates = await prisma.workflowTemplate.findMany({ where, include: includeAll, orderBy: { createdAt: 'desc' } })
    res.json(templates)
  } catch (err) { next(err) }
})

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const template = await prisma.workflowTemplate.findUnique({ where: { id: Number(req.params.id) }, include: includeAll })
    if (!template) return res.status(404).json({ error: 'ไม่พบข้อมูล' })
    res.json(template)
  } catch (err) { next(err) }
})

router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, description, category, fields = [], steps = [] } = req.body
    const template = await prisma.workflowTemplate.create({
      data: {
        name,
        description,
        category,
        fields: {
          create: fields.map((f, i) => ({
            label: f.label,
            fieldType: f.fieldType,
            required: f.required || false,
            options: f.options ? JSON.stringify(f.options) : null,
            order: f.order ?? i + 1,
          })),
        },
        steps: {
          create: steps.map(s => ({
            order: s.order,
            name: s.name,
            stepType: s.stepType || 'sequential',
            approvers: { create: s.approverIds.map(uid => ({ userId: Number(uid) })) },
          })),
        },
      },
      include: includeAll,
    })
    res.status(201).json(template)
  } catch (err) { next(err) }
})

router.put('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, description, category, isActive, fields = [], steps = [] } = req.body
    const id = Number(req.params.id)

    await prisma.templateField.deleteMany({ where: { templateId: id } })
    await prisma.templateStep.deleteMany({ where: { templateId: id } })

    const template = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        name,
        description,
        category,
        isActive: isActive ?? true,
        fields: {
          create: fields.map((f, i) => ({
            label: f.label,
            fieldType: f.fieldType,
            required: f.required || false,
            options: f.options ? JSON.stringify(f.options) : null,
            order: f.order ?? i + 1,
          })),
        },
        steps: {
          create: steps.map(s => ({
            order: s.order,
            name: s.name,
            stepType: s.stepType || 'sequential',
            approvers: { create: s.approverIds.map(uid => ({ userId: Number(uid) })) },
          })),
        },
      },
      include: includeAll,
    })
    res.json(template)
  } catch (err) { next(err) }
})

// PATCH /:id/deactivate — soft disable
router.patch('/:id/deactivate', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.workflowTemplate.update({ where: { id: Number(req.params.id) }, data: { isActive: false } })
    res.json({ message: 'ปิดใช้งาน Template แล้ว' })
  } catch (err) { next(err) }
})

// PATCH /:id/activate — re-enable
router.patch('/:id/activate', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.workflowTemplate.update({ where: { id: Number(req.params.id) }, data: { isActive: true } })
    res.json({ message: 'เปิดใช้งาน Template แล้ว' })
  } catch (err) { next(err) }
})

// DELETE /:id — permanent delete (blocked if requests exist)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const requestCount = await prisma.request.count({ where: { templateId: id } })
    if (requestCount > 0) {
      return res.status(400).json({
        error: `ไม่สามารถลบได้ เนื่องจากมีคำขอที่ใช้ Template นี้อยู่ ${requestCount} รายการ`,
      })
    }
    await prisma.workflowTemplate.delete({ where: { id } })
    res.json({ message: 'ลบ Template เรียบร้อยแล้ว' })
  } catch (err) { next(err) }
})

export default router
