import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database.types'

export class ProfileService {
  static async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (error) throw error
    return data || []
  }

  // Get only admins (users with application access)
  static async getAdmins(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', true)
      .order('full_name')
    if (error) throw error
    return data || []
  }

  // Get only customers (non-admins)
  static async getCustomers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('full_name')
    if (error) throw error
    return data || []
  }

  static async create(profile: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        ...profile, 
        type_verified: profile.is_admin || false,
        preferred_language: 'es'
      }])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
