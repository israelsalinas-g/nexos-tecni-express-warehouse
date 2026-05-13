import { supabase } from '@/lib/supabase'
import { Order, OrderItem, OrderStatusHistory } from '@/types/database.types'

export interface OrderDetail extends Order {
  order_items: OrderItem[]
  order_status_history: OrderStatusHistory[]
}

export class OrderDetailService {
  static async getById(id: string): Promise<OrderDetail | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(id, full_name, phone, email, customer_type),
        order_items(id, product_id, product_name_es, product_sku, quantity, unit_price, subtotal),
        order_status_history(id, status, note, created_by, created_at, profiles(full_name))
      `)
      .eq('id', id)
      .order('created_at', { referencedTable: 'order_status_history', ascending: false })
      .single()

    if (error || !data) return null
    return data as unknown as OrderDetail
  }

  static async getAll(status?: string): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles(full_name, phone),
        order_items(product_name_es, quantity)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as Order[]
  }

  static async updateStatus(id: string, status: Order['status'], note?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError

    if (user) {
      await supabase.from('order_status_history').insert({
        order_id: id,
        status,
        note: note ?? null,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
    }
  }

  static async addNote(orderId: string, note: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ notes_internal: note, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) throw error
  }
}
