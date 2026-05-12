import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10)
  const approverHash = await bcrypt.hash('approver123', 10)
  const userHash = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: { name: 'ผู้ดูแลระบบ', email: 'admin@company.com', passwordHash: adminHash, role: 'admin', department: 'IT', position: 'System Administrator' },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: { name: 'ผู้จัดการ สมชาย', email: 'manager@company.com', passwordHash: approverHash, role: 'approver', department: 'HR', position: 'Manager' },
  })

  const director = await prisma.user.upsert({
    where: { email: 'director@company.com' },
    update: {},
    create: { name: 'ผู้อำนวยการ วิชัย', email: 'director@company.com', passwordHash: approverHash, role: 'approver', department: 'Management', position: 'Director' },
  })

  await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: { name: 'พนักงาน ทดสอบ', email: 'employee@company.com', passwordHash: userHash, role: 'requester', department: 'Sales', position: 'Sales Executive' },
  })

  // Leave Request Template
  if (!await prisma.workflowTemplate.findFirst({ where: { name: 'ขอลาหยุด' } })) {
    await prisma.workflowTemplate.create({
      data: {
        name: 'ขอลาหยุด',
        description: 'คำขอลาหยุดงานทุกประเภท',
        category: 'HR',
        fields: {
          create: [
            { label: 'ประเภทการลา', fieldType: 'dropdown', required: true, options: JSON.stringify(['ลาพักร้อน', 'ลาป่วย', 'ลากิจ', 'ลาคลอด']), order: 1 },
            { label: 'วันที่เริ่มลา', fieldType: 'date', required: true, order: 2 },
            { label: 'วันที่สิ้นสุด', fieldType: 'date', required: true, order: 3 },
            { label: 'จำนวนวัน', fieldType: 'number', required: true, order: 4 },
            { label: 'เหตุผลการลา', fieldType: 'textarea', required: true, order: 5 },
          ],
        },
        steps: {
          create: [
            { order: 1, name: 'อนุมัติระดับผู้จัดการ', approvers: { create: [{ userId: manager.id }] } },
            { order: 2, name: 'อนุมัติระดับผู้อำนวยการ', approvers: { create: [{ userId: director.id }] } },
          ],
        },
      },
    })
  }

  // Expense Request Template
  if (!await prisma.workflowTemplate.findFirst({ where: { name: 'ขออนุมัติค่าใช้จ่าย' } })) {
    await prisma.workflowTemplate.create({
      data: {
        name: 'ขออนุมัติค่าใช้จ่าย',
        description: 'คำขออนุมัติค่าใช้จ่ายและการเบิกเงิน',
        category: 'Finance',
        fields: {
          create: [
            { label: 'รายละเอียดค่าใช้จ่าย', fieldType: 'textarea', required: true, order: 1 },
            { label: 'จำนวนเงิน (บาท)', fieldType: 'number', required: true, order: 2 },
            { label: 'วันที่ใช้จ่าย', fieldType: 'date', required: true, order: 3 },
            { label: 'หมวดหมู่', fieldType: 'dropdown', required: true, options: JSON.stringify(['ค่าเดินทาง', 'ค่าอาหาร', 'ค่าที่พัก', 'ค่าอุปกรณ์', 'อื่นๆ']), order: 4 },
          ],
        },
        steps: {
          create: [
            { order: 1, name: 'อนุมัติระดับผู้จัดการ', approvers: { create: [{ userId: manager.id }] } },
          ],
        },
      },
    })
  }

  // Purchase Request Template
  if (!await prisma.workflowTemplate.findFirst({ where: { name: 'ขอซื้ออุปกรณ์' } })) {
    await prisma.workflowTemplate.create({
      data: {
        name: 'ขอซื้ออุปกรณ์',
        description: 'คำขอซื้ออุปกรณ์และครุภัณฑ์สำนักงาน',
        category: 'Procurement',
        fields: {
          create: [
            { label: 'รายการสินค้า', fieldType: 'textarea', required: true, order: 1 },
            { label: 'จำนวน', fieldType: 'number', required: true, order: 2 },
            { label: 'ราคาประมาณ (บาท)', fieldType: 'number', required: true, order: 3 },
            { label: 'เหตุผลความจำเป็น', fieldType: 'textarea', required: true, order: 4 },
          ],
        },
        steps: {
          create: [
            { order: 1, name: 'อนุมัติระดับผู้จัดการ', approvers: { create: [{ userId: manager.id }] } },
            { order: 2, name: 'อนุมัติระดับผู้อำนวยการ', approvers: { create: [{ userId: director.id }] } },
          ],
        },
      },
    })
  }

  // System user for public petitions
  await prisma.user.upsert({
    where: { email: 'system.petition@internal' },
    update: {},
    create: { name: 'ระบบรับเรื่องประชาชน', email: 'system.petition@internal', passwordHash: 'SYSTEM_NO_LOGIN', role: 'requester', department: 'System', position: 'System' },
  })

  // Public petition template
  if (!await prisma.workflowTemplate.findFirst({ where: { name: 'คำร้องทั่วไป (ประชาชน)' } })) {
    await prisma.workflowTemplate.create({
      data: {
        name: 'คำร้องทั่วไป (ประชาชน)',
        description: 'คำร้องจากประชาชนทั่วไป',
        category: 'Public',
        fields: {
          create: [
            { label: 'ประเภทคำร้อง', fieldType: 'dropdown', required: true, options: JSON.stringify(['แจ้งซ่อมถนน / ไฟฟ้า / ประปา', 'ขอเอกสาร / หนังสือรับรอง', 'ร้องเรียน / ข้อเสนอแนะ', 'ขอรับสวัสดิการ / เงินช่วยเหลือ', 'อื่นๆ']), order: 1 },
            { label: 'รายละเอียด', fieldType: 'textarea', required: true, order: 2 },
            { label: 'สถานที่ / ที่อยู่ที่เกี่ยวข้อง', fieldType: 'text', required: false, order: 3 },
          ],
        },
        steps: {
          create: [
            { order: 1, name: 'รับเรื่องและดำเนินการ', approvers: { create: [{ userId: manager.id }] } },
          ],
        },
      },
    })
  }

  // Default system settings
  for (const [key, value] of [
    ['orgName', 'Workflow'],
    ['orgTagline', 'ระบบขออนุมัติเอกสาร'],
    ['timezone', 'Asia/Bangkok'],
    ['reminder_enabled', 'false'],
    ['reminder_days', '3'],
  ]) {
    await prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, value } })
  }

  console.log('✅ Seed completed')
  console.log('Accounts:')
  console.log('  admin@company.com / admin123 (admin)')
  console.log('  manager@company.com / approver123 (approver)')
  console.log('  director@company.com / approver123 (approver)')
  console.log('  employee@company.com / user123 (requester)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
