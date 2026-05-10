import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async getCashflow(tenantId: string, month: string) {
    const date = month ? new Date(month) : new Date()
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const transactions = await this.prisma.transaction.findMany({
      where: { tenantId, date: { gte: start, lte: end }, status: 'confirmed' },
      orderBy: { date: 'asc' },
    })

    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
    const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)

    return { income, expense, balance: income - expense, transactions }
  }

  async getTransactions(tenantId: string, from: string, to: string) {
    return this.prisma.transaction.findMany({
      where: {
        tenantId,
        ...(from && to && { date: { gte: new Date(from), lte: new Date(to) } }),
      },
      orderBy: { date: 'desc' },
    })
  }

  async getDailyReport(tenantId: string, date: string) {
    const d = date ? new Date(date) : new Date()
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)

    const [appointments, transactions] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { tenantId, date: { gte: d, lt: next }, status: 'COMPLETED' },
        include: { client: { select: { name: true } }, professional: { select: { name: true } } },
      }),
      this.prisma.transaction.findMany({
        where: { tenantId, date: { gte: d, lt: next }, status: 'confirmed' },
      }),
    ])

    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
    const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)

    return { date: d, appointments, income, expense, balance: income - expense }
  }

  createTransaction(dto: CreateTransactionDto, tenantId: string) {
    return this.prisma.transaction.create({
      data: { ...dto, tenantId, date: new Date(dto.date) },
    })
  }
}
