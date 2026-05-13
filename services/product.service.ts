import { supabase } from '@/lib/supabase'
import { Product, ProductImage } from '@/types/database.types'

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
    const updates: any = { ...product, updated_at: new Date().toISOString() }

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

  /**
   * Uploads an image for a product to Supabase Storage and inserts a product_images record.
   * Returns the new ProductImage row.
   */
  static async uploadImage(productId: string, localUri: string): Promise<ProductImage> {
    const filename = `${productId}_${Date.now()}.jpg`
    const path = `products/${filename}`

    // Fetch blob from local URI
    const response = await fetch(localUri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(path)

    // Check if this product already has images to determine is_primary
    const { count } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)

    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrl,
        is_primary: (count ?? 0) === 0,
        sort_order: count ?? 0,
      })
      .select()
      .single()

    if (error) throw error
    return data as ProductImage
  }

  /**
   * Deletes a product image from storage and the database.
   */
  static async deleteImage(imageId: string): Promise<void> {
    const { data: img, error: fetchErr } = await supabase
      .from('product_images')
      .select('url')
      .eq('id', imageId)
      .single()

    if (fetchErr || !img) throw fetchErr ?? new Error('Image not found')

    // Extract storage path from public URL
    const url: string = img.url
    const match = url.match(/product-images\/(.+)$/)
    if (match) {
      await supabase.storage.from('product-images').remove([match[1]])
    }

    const { error } = await supabase.from('product_images').delete().eq('id', imageId)
    if (error) throw error
  }

  /**
   * Fetches all images for a product.
   */
  static async getImages(productId: string): Promise<ProductImage[]> {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order')

    if (error) throw error
    return (data ?? []) as ProductImage[]
  }
}


