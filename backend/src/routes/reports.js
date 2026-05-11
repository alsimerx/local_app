import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.use(authenticate, requireRole('admin'))

// GET /api/reports/overview
router.get('/overview', async (req, res, next) => {
  try {
    const grouped = await prisma.request.groupBy({
      by: ['status'],
      _count: { id: true },
    })
    const result = { total: 0, draft: 0, pending: 0, approved: 0, rejected: 0, returned: 0, cancelled: 0 }
    for (const row of grouped) {
      result[row.status] = row._count.id
      result.total += row._count.id
    }
    res.json(result)
  } catch (err) { next(err) }
})

// GET /api/reports/monthly?year=2024
router.get('/monthly', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear()
    const from = new Date(year, 0, 1)
    const to = new Date(year + 1, 0, 1)

    const requests = await prisma.request.findMany({
      where: { createdAt: { gte: from, lt: to }, status: { not: 'draft' } },
      select: { createdAt: true, status: true },
    })

    // init 12 months
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(year, i, 1).toLocaleString('th-TH', { month: 'short' }),
      pending: 0, approved: 0, rejected: 0, returned: 0, cancelled: 0, total: 0,
    }))

    for (const r of requests) {
      const m = new Date(r.createdAt).getMonth() // 0-based
      months[m][r.status] = (months[m][r.status] || 0) + 1
      months[m].total += 1
    }

    res.json(months)
  } catch (err) { next(err) }
})

// GET /api/reports/by-template
router.get('/by-template', async (req, res, next) => {
  try {
    const templates = await prisma.workflowTemplate.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        requests: { select: { status: true } },
      },
      orderBy: { name: 'asc' },
    })

    const result = templates.map(t => {
      const counts = { total: t.requests.length, pending: 0, approved: 0, rejected: 0, returned: 0, cancelled: 0, draft: 0 }
      for (const r of t.requests) counts[r.status] = (counts[r.status] || 0) + 1
      return { id: t.id, name: t.name, category: t.category, ...counts }
    }).filter(t => t.total > 0)

    res.json(result)
  } catch (err) { next(err) }
})

// GET /api/reports/approvers
router.get('/approvers', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['approver', 'admin'] }, isActive: true },
      select: {
        id: true,
        name: true,
        department: true,
        approvalSteps: {
          where: { status: { in: ['approved', 'rejected', 'returned'] } },
          select: { status: true, createdAt: true, actionedAt: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const result = users.map(u => {
      const approved = u.approvalSteps.filter(s => s.status === 'approved').length
      const rejected = u.approvalSteps.filter(s => s.status === 'rejected').length
      const returned = u.approvalSteps.filter(s => s.status === 'returned').length
      const total = approved + rejected + returned

      // avg days to action
      const durationsMs = u.approvalSteps
        .filter(s => s.actionedAt)
        .map(s => new Date(s.actionedAt) - new Date(s.createdAt))
      const avgDays = durationsMs.length
        ? +(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length / 86400000).toFixed(1)
        : null

      return { id: u.id, name: u.name, department: u.department, total, approved, rejected, returned, avgDays }
    })

    res.json(result)
  } catch (err) { next(err) }
})

// GET /api/reports/export-csv
router.get('/export-csv', async (req, res, next) => {
  try {
    const requests = await prisma.request.findMany({
      include: {
        template: { select: { name: true, category: true } },
        requester: { select: { name: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const header = ['เลขที่คำขอ', 'ชื่อเรื่อง', 'ประเภท', 'หมวดหมู่', 'ผู้สร้าง', 'แผนก', 'สถานะ', 'วันที่สร้าง', 'วันที่เสร็จสิ้น']
    const rows = requests.map(r => [
      r.requestNumber,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.template?.name ?? ''}"`,
      `"${r.template?.category ?? ''}"`,
      `"${r.requester?.name ?? ''}"`,
      `"${r.requester?.department ?? ''}"`,
      r.status,
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('th-TH') : '',
      r.completedAt ? new Date(r.completedAt).toLocaleDateString('th-TH') : '',
    ])

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const bom = '﻿'
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="requests-report-${new Date().toISOString().slice(0,10)}.csv"`)
    res.send(bom + csv)
  } catch (err) { next(err) }
})

export default router
