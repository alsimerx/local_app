import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export function startReminderJob() {
  // run every day at 08:00
  cron.schedule('0 8 * * *', runReminders)
  console.log('⏰ Reminder job scheduled (daily 08:00)')
}

export async function runReminders() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['reminder_enabled', 'reminder_days'] } },
    })
    const enabled = settings.find(s => s.key === 'reminder_enabled')?.value === 'true'
    if (!enabled) return

    const days = parseInt(settings.find(s => s.key === 'reminder_days')?.value ?? '3', 10)
    const cutoff = new Date(Date.now() - days * 86400000)

    const staleRequests = await prisma.request.findMany({
      where: { status: 'pending', updatedAt: { lt: cutoff } },
      include: {
        approvalSteps: { where: { status: 'pending' } },
      },
    })

    let notified = 0
    for (const req of staleRequests) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today.getTime() + 86400000)

      for (const step of req.approvalSteps) {
        if (step.stepOrder !== req.currentStep) continue
        // skip if reminder already sent today
        const existing = await prisma.notification.findFirst({
          where: {
            userId: step.approverId,
            requestId: req.id,
            type: 'reminder',
            createdAt: { gte: today, lt: tomorrow },
          },
        })
        if (existing) continue

        await prisma.notification.create({
          data: {
            userId: step.approverId,
            title: '⏰ แจ้งเตือน: คำขอรออนุมัติ',
            body: `คำขอ ${req.requestNumber} รออนุมัติมาเกิน ${days} วันแล้ว`,
            type: 'reminder',
            requestId: req.id,
          },
        })
        notified++
      }
    }

    if (notified > 0) console.log(`[Reminder] Sent ${notified} reminder notifications`)
  } catch (err) {
    console.error('[Reminder] Error:', err)
  }
}
