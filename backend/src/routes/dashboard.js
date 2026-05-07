import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id

    const [myPending, myApproved, myRejected, recentRequests, pendingSteps] = await Promise.all([
      prisma.request.count({ where: { requesterId: userId, status: 'pending' } }),
      prisma.request.count({ where: { requesterId: userId, status: 'approved' } }),
      prisma.request.count({ where: { requesterId: userId, status: 'rejected' } }),
      prisma.request.findMany({
        where: { requesterId: userId },
        include: { template: { select: { name: true, category: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.approvalStep.findMany({
        where: { approverId: userId, status: 'pending', request: { status: 'pending' } },
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
      }),
    ])

    const activeApprovals = pendingSteps.filter(s => s.stepOrder === s.request.currentStep)

    res.json({
      stats: {
        myPending,
        myApproved,
        myRejected,
        waitingForMe: activeApprovals.length,
      },
      recentRequests,
      pendingApprovals: activeApprovals.slice(0, 6),
    })
  } catch (err) { next(err) }
})

export default router
