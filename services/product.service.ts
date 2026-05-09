import { supabase } from '@/lib/supabase'
import { Product } from '@/types/database.types'

export class ProductService {
  /**
   * Fetches product details by ID or SKU
   */
  static async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async getBySku(sku: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single()

    if (error) return null // Sku might not exist
    return data
  }

  /**
   * Searches products by term
   */
  static async search(term: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name_es.ilike.%${term}%,sku.ilike.%${term}%`)
      .limit(20)

    if (error) throw error
    return data ?? []
  }
}
