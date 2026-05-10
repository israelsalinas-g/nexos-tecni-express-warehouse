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

  static async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    // Note: Deleting a profile usually requires deleting the auth user too,
    // which normally requires admin privileges via supabase.auth.admin.deleteUser
    // For now, we only delete from the profiles table (if possible/allowed)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
