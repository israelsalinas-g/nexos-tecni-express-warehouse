import { supabase } from '@/lib/supabase'
import { Category } from '@/types/database.types'

export class CategoryService {
  static async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name_es')
    if (error) throw error
    return data || []
  }

  static async create(name_es: string, name_en?: string): Promise<Category> {
    const slug = name_es.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        name_es, 
        name_en: name_en || name_es, 
        slug,
        sort_order: 0
      }])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async update(id: string, name_es: string, name_en?: string): Promise<Category> {
    const slug = name_es.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    const { data, error } = await supabase
      .from('categories')
      .update({ 
        name_es, 
        name_en: name_en || name_es, 
        slug 
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
