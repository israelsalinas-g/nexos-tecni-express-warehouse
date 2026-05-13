import { supabase } from '@/lib/supabase'
import { Order, OrderItem } from '@/types/database.types'

export class OrderService {
  /**
   * Fetches orders with optional status filter
   */
  static async getOrders(status?: Order['status'], warehouseId?: string) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!customer_id(full_name, phone),
        order_items(product_name_es, product_sku, quantity, unit_price, subtotal)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Fetches pending orders for the warehouse
   */
  static async getPendingOrders(warehouseId?: string) {
    return this.getOrders('pending', warehouseId)
  }

  /**
   * Creates a new sale (order + items)
   */
  static async createSale(order: Partial<Order>, items: Partial<OrderItem>[]) {
    // 1. Create the order header
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        ...order,
        order_number: `SO-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        payment_status: order.payment_status || 'unpaid',
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // 2. Create the items
    const itemsWithId = items.map(item => ({
      ...item,
      order_id: newOrder.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithId)

    if (itemsError) throw itemsError

    return newOrder
  }

  /**
   * Confirms payment and moves to confirmed status
   */
  static async confirmPayment(orderId: string, paymentMethod: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed', 
        payment_status: 'paid',
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
