import { supabase } from '@/lib/supabase'
import { PurchaseOrder, PurchaseOrderItem } from '@/types/database.types'

export class PurchaseOrderService {
  /**
   * Fetches all purchase orders with supplier and warehouse info
   */
  static async getAll() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers(name),
        warehouses(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Fetches a single purchase order with its items
   */
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers(*),
        warehouses(*),
        purchase_order_items(
          *,
          products(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Creates a new purchase order with its items
   */
  static async create(po: Partial<PurchaseOrder>, items: Partial<PurchaseOrderItem>[]) {
    // 1. Create the header
    const { data: order, error: poError } = await supabase
      .from('purchase_orders')
      .insert([po])
      .select()
      .single()

    if (poError) throw poError

    // 2. Create the items
    const itemsWithId = items.map(item => ({
      ...item,
      purchase_order_id: order.id
    }))

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(itemsWithId)

    if (itemsError) throw itemsError

    return order
  }

  /**
   * Updates the status of a purchase order
   */
  static async updateStatus(id: string, status: PurchaseOrder['status']) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
