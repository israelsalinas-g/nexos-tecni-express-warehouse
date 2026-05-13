import { supabase } from '@/lib/supabase'
import { Expense, ExpenseCategory } from '@/types/database.types'

export interface ExpenseFilters {
  category?: ExpenseCategory
  from?: string
  to?: string
}

export interface CategorySummary {
  category: ExpenseCategory
  total: number
  count: number
}

export class ExpenseService {
  static async getAll(filters?: ExpenseFilters): Promise<Expense[]> {
    let q = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    if (filters?.category) q = q.eq('category', filters.category)
    if (filters?.from)     q = q.gte('expense_date', filters.from)
    if (filters?.to)       q = q.lte('expense_date', filters.to)

    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Expense[]
  }

  static async create(e: {
    description: string
    amount: number
    category: ExpenseCategory
    expense_date: string
    receipt_url?: string
  }): Promise<Expense> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...e, created_by: user.id })
      .select()
      .single()

    if (error) throw error
    return data as Expense
  }

  static async update(id: string, e: Partial<Omit<Expense, 'id' | 'created_by' | 'created_at'>>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...e, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
  }

  static async getSummaryByCategory(from: string, to: string): Promise<CategorySummary[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .gte('expense_date', from)
      .lte('expense_date', to)

    if (error) throw error

    const map: Record<string, CategorySummary> = {}
    for (const row of data ?? []) {
      if (!map[row.category]) map[row.category] = { category: row.category, total: 0, count: 0 }
      map[row.category].total += row.amount
      map[row.category].count += 1
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }

  static async getTotalForPeriod(from: string, to: string): Promise<number> {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', from)
      .lte('expense_date', to)

    if (error) throw error
    return (data ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0)
  }
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent:        'Alquiler',
  utilities:   'Servicios',
  salary:      'Salarios',
  supplies:    'Suministros',
  maintenance: 'Mantenimiento',
  marketing:   'Marketing',
  other:       'Otros',
}

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent:        '#3b82f6',
  utilities:   '#f59e0b',
  salary:      '#10b981',
  supplies:    '#8b5cf6',
  maintenance: '#f97316',
  marketing:   '#ec4899',
  other:       '#6b7280',
}
