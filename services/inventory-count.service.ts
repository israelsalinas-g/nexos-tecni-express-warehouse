import { supabase } from '@/lib/supabase'
import { InventoryCountSession, InventoryCountItem } from '@/types/database.types'

export class InventoryCountService {
  static async getSession(id: string) {
    const { data, error } = await supabase
      .from('inventory_count_sessions')
      .select('*, warehouses(name)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async getItems(sessionId: string) {
    const { data, error } = await supabase
      .from('inventory_count_items')
      .select('id, product_id, counted_quantity, products(name_es, sku)')
      .eq('session_id', sessionId)

    if (error) throw error
    return data
  }

  static async addItem(sessionId: string, productId: string, counted: number = 0) {
    const { data, error } = await supabase
      .from('inventory_count_items')
      .insert({
        session_id: sessionId,
        product_id: productId,
        counted_quantity: counted,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateItemQuantity(id: string, quantity: number) {
    const { error } = await supabase
      .from('inventory_count_items')
      .update({ counted_quantity: quantity })
      .eq('id', id)

    if (error) throw error
  }

  static async completeSession(id: string) {
    const { error } = await supabase
      .from('inventory_count_sessions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (error) throw error
  }
}
