import { supabase } from '@/lib/supabase'
import { Inventory, InventoryRow } from '@/types/database.types'

export class InventoryService {
  /**
   * Fetches inventory rows for a specific warehouse
   */
  static async getByWarehouse(warehouseId: string, search?: string): Promise<InventoryRow[]> {
    let query = supabase
      .from('inventory')
      .select('id, quantity, stock_min, products(id, name_es, sku)')
      .eq('warehouse_id', warehouseId)
      .order('quantity', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    let mapped = (data ?? []).map((r: any) => ({
      id: r.id,
      product: {
        id:      r.products.id,
        sku:     r.products.sku,
        name_es: r.products.name_es,
      },
      quantity:  r.quantity,
      stock_min: r.stock_min,
    }))

    if (search) {
      const s = search.toLowerCase()
      mapped = mapped.filter(m => 
        m.product.name_es.toLowerCase().includes(s) || 
        m.product.sku.toLowerCase().includes(s)
      )
    }

    return mapped
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
  static async getStockByProduct(productId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity, stock_min, warehouses(id, name)')
      .eq('product_id', productId)

    if (error) throw error

    return (data ?? []).map((row: any) => ({
      warehouseId:   row.warehouses?.id ?? '',
      warehouseName: row.warehouses?.name ?? 'Bodega',
      quantity:      row.quantity,
      stockMin:      row.stock_min,
    }))
  }
}

