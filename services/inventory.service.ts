import { supabase } from '@/lib/supabase'
import { Inventory, InventoryRow } from '@/types/database.types'

export class InventoryService {
  /**
   * Fetches all inventory records with products and warehouses
   */
  static async getAll(): Promise<InventoryRow[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, products(*), warehouses(*)')
      .order('quantity', { ascending: true })

    if (error) throw error
    return data as InventoryRow[]
  }

  /**
   * Fetches inventory rows for a specific warehouse
   */
  static async getByWarehouse(warehouseId: string, search?: string): Promise<InventoryRow[]> {
    let query = supabase
      .from('inventory')
      .select('*, products(*), warehouses(*)')
      .eq('warehouse_id', warehouseId)
      .order('quantity', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    let rows = data as InventoryRow[]

    if (search) {
      const s = search.toLowerCase()
      rows = rows.filter(m => 
        m.products?.name_es?.toLowerCase().includes(s) || 
        m.products?.sku?.toLowerCase().includes(s)
      )
    }

    return rows
  }

  /**
   * Updates stock quantity for a specific inventory record
   */
  static async updateQuantity(id: string, newQuantity: number): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Fetches stock levels across all warehouses for a specific product
   */
  static async getByProduct(productId: string): Promise<InventoryRow[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, warehouses(*), products(*)')
      .eq('product_id', productId)

    if (error) throw error
    return data as InventoryRow[]
  }

  /**
   * Alias for compatibility
   */
  static async getStockByProduct(productId: string) {
    return this.getByProduct(productId)
  }
}


