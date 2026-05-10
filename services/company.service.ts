import { supabase } from '@/lib/supabase'
import { CompanyProfile } from '@/types/database.types'

export class CompanyService {
  /**
   * Fetches the company profile (singleton)
   */
  static async getProfile() {
    const { data, error } = await supabase
      .from('company_profile')
      .select('*')
      .maybeSingle()

    if (error) throw error
    return data as CompanyProfile | null
  }

  /**
   * Updates or creates the company profile
   */
  static async updateProfile(profile: Partial<CompanyProfile>) {
    // We assume ID is 'default' or we use upsert with a fixed ID
    const { data, error } = await supabase
      .from('company_profile')
      .upsert([{ 
        id: '00000000-0000-0000-0000-000000000000', // Fixed ID for singleton
        ...profile, 
        updated_at: new Date().toISOString() 
      }])
      .select()
      .single()

    if (error) throw error
    return data as CompanyProfile
  }
}
