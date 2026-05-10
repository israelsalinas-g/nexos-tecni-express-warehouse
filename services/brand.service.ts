import { supabase } from '@/lib/supabase'
import { Brand } from '@/types/database.types'

export class BrandService {
  static async getAll(): Promise<Brand[]> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  }

  static async create(name: string): Promise<Brand> {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    const { data, error } = await supabase
      .from('brands')
      .insert([{ name, slug }])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async update(id: string, name: string): Promise<Brand> {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
    const { data, error } = await supabase
      .from('brands')
      .update({ name, slug })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
