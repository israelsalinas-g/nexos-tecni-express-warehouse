import { supabase } from '@/lib/supabase'
import { Supplier } from '@/types/database.types'

export class SupplierService {
  static async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  }

  static async create(supplier: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...supplier, is_active: true }])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async update(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
