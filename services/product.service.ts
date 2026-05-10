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
      .select(`
        *, 
        product_images(url),
        brands(name),
        categories(name_es)
      `)
      .eq('sku', sku)
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
      .select('*, product_images(url, is_primary)')
      .or(`name_es.ilike.%${term}%,sku.ilike.%${term}%`)
      .limit(20)

    if (error) throw error
    return data ?? []
  }
  /**
   * Creates a new product
   */
  static async create(product: Partial<Product>): Promise<Product> {
    const slug = product.name_es?.toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '') || `product-${Date.now()}`

    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, slug }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Updates an existing product
   */
  static async update(id: string, product: Partial<Product>): Promise<Product> {
    const updates: any = { ...product }
    
    if (product.name_es) {
      updates.slug = product.name_es.toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '')
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}


