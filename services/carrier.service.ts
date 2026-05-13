import { supabase } from '@/lib/supabase'
import { Carrier } from '@/types/database.types'

export interface CarrierFormData {
  name: string
  phone?: string | null
  email?: string | null
  tracking_url_template?: string | null
  is_active: boolean
}

export class CarrierService {
  static async getAll(): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as Carrier[]
  }

  static async getById(id: string): Promise<Carrier | null> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Carrier | null
  }

  static async create(form: CarrierFormData): Promise<Carrier> {
    const { data, error } = await supabase
      .from('carriers')
      .insert({
        ...form,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data as Carrier
  }

  static async update(id: string, form: CarrierFormData): Promise<Carrier> {
    const { data, error } = await supabase
      .from('carriers')
      .update({
        ...form,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Carrier
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('carriers').delete().eq('id', id)
    if (error) throw error
  }
}
