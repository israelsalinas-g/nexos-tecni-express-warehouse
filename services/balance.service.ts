import { supabase } from '@/lib/supabase'

export interface CashflowSummary {
  income: number
  expenses: number
  net: number
}

export interface WeeklyBar {
  week: string   // "Sem 1", "Sem 2", …
  label: string  // date range label
  income: number
  expenses: number
}

export interface MonthlyCashflow extends CashflowSummary {
  weekly: WeeklyBar[]
}

function isoWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export class BalanceService {
  static async getCashflow(from: string, to: string): Promise<MonthlyCashflow> {
    const [ordersRes, expensesRes] = await Promise.all([
      supabase
        .from('orders')
        .select('total, created_at')
        .neq('status', 'cancelled')
        .gte('created_at', from)
        .lte('created_at', to),
      supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', from)
        .lte('expense_date', to),
    ])

    if (ordersRes.error) throw ordersRes.error
    if (expensesRes.error) throw expensesRes.error

    const orders  = ordersRes.data  ?? []
    const expenses = expensesRes.data ?? []

    const income   = orders.reduce((s, o) => s + (o.total ?? 0), 0)
    const expTotal = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)

    // Build weekly buckets
    const weekMap: Record<string, { income: number; expenses: number; start: Date }> = {}

    for (const o of orders) {
      const start = isoWeekStart(new Date(o.created_at))
      const key = start.toISOString()
      if (!weekMap[key]) weekMap[key] = { income: 0, expenses: 0, start }
      weekMap[key].income += o.total ?? 0
    }

    for (const e of expenses) {
      const start = isoWeekStart(new Date(e.expense_date))
      const key = start.toISOString()
      if (!weekMap[key]) weekMap[key] = { income: 0, expenses: 0, start }
      weekMap[key].expenses += e.amount ?? 0
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' })

    const weekly: WeeklyBar[] = Object.values(weekMap)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((w, i) => {
        const end = new Date(w.start)
        end.setDate(end.getDate() + 6)
        return {
          week: `Sem ${i + 1}`,
          label: `${fmt(w.start)} – ${fmt(end)}`,
          income: Math.round(w.income * 100) / 100,
          expenses: Math.round(w.expenses * 100) / 100,
        }
      })

    return {
      income:   Math.round(income * 100) / 100,
      expenses: Math.round(expTotal * 100) / 100,
      net:      Math.round((income - expTotal) * 100) / 100,
      weekly,
    }
  }

  static periodRange(period: 'today' | 'week' | 'month' | 'quarter'): { from: string; to: string } {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const iso = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (period === 'today') {
      const today = iso(now)
      return { from: today, to: today }
    }
    if (period === 'week') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      return { from: iso(start), to: iso(now) }
    }
    if (period === 'month') {
      return {
        from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
        to: iso(now),
      }
    }
    // quarter
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    return { from: iso(qStart), to: iso(now) }
  }
}
