import { supabase } from '@/lib/supabase'
import { Warehouse } from '@/types/database.types'

export class WarehouseService {
  static async getAll(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  }

  static async create(name: string, code?: string, location?: string): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .insert([{ 
        name, 
        code: code || name.substring(0, 3).toUpperCase(), 
        location,
        is_active: true
      }])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async update(id: string, updates: Partial<Warehouse>): Promise<Warehouse> {
    const { data, error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
