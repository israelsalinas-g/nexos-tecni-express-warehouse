import { supabase } from '@/lib/supabase'

// ─── Sales Report ─────────────────────────────────────────────────────────────

export interface PaymentMethodStat {
  method: string
  total: number
  count: number
}

export interface TopProduct {
  product_id: string
  name: string
  sku: string
  total_qty: number
  total_revenue: number
}

export interface PeriodBar {
  label: string
  total: number
}

export interface SalesReport {
  totalRevenue: number
  orderCount: number
  avgOrderValue: number
  byPaymentMethod: PaymentMethodStat[]
  topProducts: TopProduct[]
  byPeriod: PeriodBar[]
}

// ─── Inventory Report ─────────────────────────────────────────────────────────

export interface LowStockItem {
  product_id: string
  name: string
  sku: string
  qty: number
  stock_min: number
}

export interface TopValueItem {
  product_id: string
  name: string
  sku: string
  qty: number
  unit_price: number
  total_value: number
}

export interface InventoryReport {
  totalProducts: number
  activeProducts: number
  totalStock: number
  lowStockCount: number
  lowStock: LowStockItem[]
  topValue: TopValueItem[]
}

// ─── Customer Report ──────────────────────────────────────────────────────────

export interface TopBuyer {
  customer_id: string
  name: string
  orderCount: number
  totalSpent: number
}

export interface CustomerReport {
  totalCustomers: number
  newThisMonth: number
  returningCustomers: number
  topBuyers: TopBuyer[]
}

// ─── Finance Report ───────────────────────────────────────────────────────────

export interface ExpenseCategoryStat {
  category: string
  total: number
  pct: number
}

export interface MonthlyBar {
  month: string
  income: number
  expenses: number
}

export interface FinanceReport {
  income: number
  expenses: number
  net: number
  margin: number
  expensesByCategory: ExpenseCategoryStat[]
  monthly: MonthlyBar[]
}

// ─── Service ──────────────────────────────────────────────────────────────────

function isoMonth(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

function periodStart(period: 'week' | 'month' | 'quarter' | 'year'): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (period === 'week') {
    const s = new Date(now); s.setDate(now.getDate() - now.getDay()); return iso(s)
  }
  if (period === 'month') {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
  }
  if (period === 'quarter') {
    const qs = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    return iso(qs)
  }
  // year
  return `${now.getFullYear()}-01-01`
}

export class ReportsService {
  static async getSalesReport(from: string, to: string): Promise<SalesReport> {
    const [ordersRes, itemsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, total, payment_method, created_at')
        .neq('status', 'cancelled')
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59'),
      supabase
        .from('order_items')
        .select('product_id, product_name_es, product_sku, quantity, subtotal, orders!inner(status, created_at)')
        .neq('orders.status', 'cancelled')
        .gte('orders.created_at', from)
        .lte('orders.created_at', to + 'T23:59:59'),
    ])

    if (ordersRes.error) throw ordersRes.error
    if (itemsRes.error) throw itemsRes.error

    const orders = ordersRes.data ?? []
    const items  = itemsRes.data ?? []

    const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0)
    const orderCount = orders.length
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

    // Payment method breakdown
    const pmMap: Record<string, PaymentMethodStat> = {}
    for (const o of orders) {
      const m = o.payment_method ?? 'no_especificado'
      if (!pmMap[m]) pmMap[m] = { method: m, total: 0, count: 0 }
      pmMap[m].total += o.total ?? 0
      pmMap[m].count += 1
    }
    const byPaymentMethod = Object.values(pmMap).sort((a, b) => b.total - a.total)

    // Top products
    const prodMap: Record<string, TopProduct> = {}
    for (const it of items as any[]) {
      const id = it.product_id ?? 'unknown'
      if (!prodMap[id]) prodMap[id] = { product_id: id, name: it.product_name_es, sku: it.product_sku ?? '—', total_qty: 0, total_revenue: 0 }
      prodMap[id].total_qty += it.quantity ?? 0
      prodMap[id].total_revenue += it.subtotal ?? 0
    }
    const topProducts = Object.values(prodMap).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10)

    // Weekly bars
    const weekMap: Record<string, number> = {}
    for (const o of orders) {
      const d = new Date(o.created_at)
      const weekKey = `Sem ${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString('es-HN', { month: 'short' })}`
      weekMap[weekKey] = (weekMap[weekKey] ?? 0) + (o.total ?? 0)
    }
    const byPeriod: PeriodBar[] = Object.entries(weekMap)
      .map(([label, total]) => ({ label, total }))
      .slice(-8)

    return { totalRevenue, orderCount, avgOrderValue, byPaymentMethod, topProducts, byPeriod }
  }

  static async getInventoryReport(): Promise<InventoryReport> {
    const { data, error } = await supabase
      .from('inventory')
      .select('product_id, quantity, stock_min, products(name_es, sku, price_public, is_active)')
      .order('quantity', { ascending: true })

    if (error) throw error
    const rows = (data ?? []) as any[]

    const totalProducts = rows.length
    const activeProducts = rows.filter(r => r.products?.is_active).length
    const totalStock = rows.reduce((s, r) => s + (r.quantity ?? 0), 0)

    const lowStock: LowStockItem[] = rows
      .filter(r => (r.quantity ?? 0) <= (r.stock_min ?? 0))
      .map(r => ({
        product_id: r.product_id,
        name: r.products?.name_es ?? '—',
        sku: r.products?.sku ?? '—',
        qty: r.quantity,
        stock_min: r.stock_min,
      }))
      .slice(0, 20)

    const topValue: TopValueItem[] = rows
      .filter(r => (r.quantity ?? 0) > 0 && r.products?.price_public)
      .map(r => ({
        product_id: r.product_id,
        name: r.products?.name_es ?? '—',
        sku: r.products?.sku ?? '—',
        qty: r.quantity,
        unit_price: r.products.price_public,
        total_value: r.quantity * r.products.price_public,
      }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 10)

    return { totalProducts, activeProducts, totalStock, lowStockCount: lowStock.length, lowStock, topValue }
  }

  static async getCustomerReport(from: string, to: string): Promise<CustomerReport> {
    const [profilesRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('id, created_at').eq('is_admin', false),
      supabase
        .from('orders')
        .select('customer_id, total, profiles(full_name)')
        .neq('status', 'cancelled')
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59'),
    ])

    if (profilesRes.error) throw profilesRes.error
    if (ordersRes.error)   throw ordersRes.error

    const profiles = profilesRes.data ?? []
    const orders   = ordersRes.data ?? []

    const monthStart = isoMonth(new Date())
    const newThisMonth = profiles.filter(p => p.created_at >= monthStart).length

    const buyerMap: Record<string, TopBuyer> = {}
    for (const o of orders as any[]) {
      const id = o.customer_id
      if (!buyerMap[id]) buyerMap[id] = { customer_id: id, name: o.profiles?.full_name ?? 'Cliente', orderCount: 0, totalSpent: 0 }
      buyerMap[id].orderCount += 1
      buyerMap[id].totalSpent += o.total ?? 0
    }
    const buyers = Object.values(buyerMap)
    const returningCustomers = buyers.filter(b => b.orderCount > 1).length
    const topBuyers = buyers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10)

    return { totalCustomers: profiles.length, newThisMonth, returningCustomers, topBuyers }
  }

  static async getFinanceReport(from: string, to: string): Promise<FinanceReport> {
    const [ordersRes, expensesRes] = await Promise.all([
      supabase
        .from('orders')
        .select('total, created_at')
        .neq('status', 'cancelled')
        .gte('created_at', from)
        .lte('created_at', to + 'T23:59:59'),
      supabase
        .from('expenses')
        .select('amount, category, expense_date')
        .gte('expense_date', from)
        .lte('expense_date', to),
    ])

    if (ordersRes.error) throw ordersRes.error
    if (expensesRes.error) throw expensesRes.error

    const orders   = ordersRes.data ?? []
    const expenses = expensesRes.data ?? []

    const income   = orders.reduce((s, o) => s + (o.total ?? 0), 0)
    const expTotal = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
    const net      = income - expTotal
    const margin   = income > 0 ? (net / income) * 100 : 0

    // Expenses by category
    const catMap: Record<string, number> = {}
    for (const e of expenses) {
      catMap[e.category] = (catMap[e.category] ?? 0) + (e.amount ?? 0)
    }
    const expensesByCategory: ExpenseCategoryStat[] = Object.entries(catMap)
      .map(([category, total]) => ({ category, total, pct: expTotal > 0 ? (total / expTotal) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)

    // Monthly bars — group by month
    const monthMap: Record<string, { income: number; expenses: number }> = {}
    const addMonth = (key: string) => { if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 } }
    for (const o of orders) {
      const key = o.created_at.slice(0, 7)
      addMonth(key)
      monthMap[key].income += o.total ?? 0
    }
    for (const e of expenses) {
      const key = e.expense_date.slice(0, 7)
      addMonth(key)
      monthMap[key].expenses += e.amount ?? 0
    }
    const monthly: MonthlyBar[] = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        month: new Date(key + '-01').toLocaleDateString('es-HN', { month: 'short', year: '2-digit' }),
        income: Math.round(v.income * 100) / 100,
        expenses: Math.round(v.expenses * 100) / 100,
      }))

    return { income, expenses: expTotal, net, margin, expensesByCategory, monthly }
  }

  static periodRange(period: 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    return { from: periodStart(period), to: iso(now) }
  }
}
