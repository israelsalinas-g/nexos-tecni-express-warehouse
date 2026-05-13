import { supabase } from '@/lib/supabase'

export interface DashboardKPIs {
  monthSales: number
  salesTrend: number
  pendingOrders: number
  openQuotations: number
  newCustomers: number
  lowStockCount: number
}

export interface WeeklyBar {
  day: string
  label: string
  total: number
}

export interface TopProduct {
  product_id: string
  name: string
  sku: string
  total_qty: number
}

export class DashboardService {
  static async getKPIs(): Promise<DashboardKPIs> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    const [
      monthSalesRes,
      prevSalesRes,
      pendingRes,
      quotationsRes,
      customersRes,
      lowStockRes,
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', monthStart)
        .neq('status', 'cancelled'),
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', prevMonthStart)
        .lte('created_at', prevMonthEnd)
        .neq('status', 'cancelled'),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('quotations')
        .select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'sent']),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', false)
        .gte('created_at', monthStart),
      supabase
        .from('inventory')
        .select('id, quantity, stock_min')
        .filter('quantity', 'lte', 'stock_min'),
    ])

    const monthSales = (monthSalesRes.data ?? []).reduce((s, r) => s + (r.total ?? 0), 0)
    const prevSales = (prevSalesRes.data ?? []).reduce((s, r) => s + (r.total ?? 0), 0)
    const trend = prevSales > 0 ? Math.round(((monthSales - prevSales) / prevSales) * 100) : 0

    // Low stock: quantity <= stock_min — filter client-side since lte on two columns needs RPC
    const allInv = lowStockRes.data ?? []
    const lowStockCount = allInv.filter(i => i.quantity <= i.stock_min).length

    return {
      monthSales,
      salesTrend: trend,
      pendingOrders: pendingRes.count ?? 0,
      openQuotations: quotationsRes.count ?? 0,
      newCustomers: customersRes.count ?? 0,
      lowStockCount,
    }
  }

  static async getWeeklySales(): Promise<WeeklyBar[]> {
    const days: WeeklyBar[] = []
    const now = new Date()
    const labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString()

      const { data } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', from)
        .lte('created_at', to)
        .neq('status', 'cancelled')

      const total = (data ?? []).reduce((s, r) => s + (r.total ?? 0), 0)
      days.push({ day: from.slice(0, 10), label: labels[d.getDay()], total })
    }

    return days
  }

  static async getTopProducts(limit = 5): Promise<TopProduct[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('product_id, quantity, product_name_es, product_sku')
      .limit(500)

    if (error || !data) return []

    const map: Record<string, TopProduct> = {}
    for (const row of data) {
      if (!row.product_id) continue
      if (!map[row.product_id]) {
        map[row.product_id] = {
          product_id: row.product_id,
          name: row.product_name_es ?? '',
          sku: row.product_sku ?? '',
          total_qty: 0,
        }
      }
      map[row.product_id].total_qty += row.quantity ?? 0
    }

    return Object.values(map)
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, limit)
  }
}
