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

  static async getBySku(sku: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(url)')
      .eq('sku', sku)
      .eq('product_images.is_primary', true)
      .single()

    if (error || !data) return null
    
    // Flatten the primary image URL
    const product = {
      ...data,
      main_image_url: data.product_images?.[0]?.url || null
    }

    return product
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
