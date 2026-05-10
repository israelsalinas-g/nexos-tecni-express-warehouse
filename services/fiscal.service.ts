import { supabase } from '@/lib/supabase'
import { InvoiceAuthRange } from '@/types/database.types'

export class FiscalService {
  /**
   * Fetches the active fiscal range
   */
  static async getActiveRange() {
    const { data, error } = await supabase
      .from('invoice_auth_ranges')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data as InvoiceAuthRange | null
  }

  /**
   * Checks for fiscal alerts (expiration or low quantity)
   */
  static async getFiscalAlerts() {
    const range = await this.getActiveRange()
    if (!range) return null

    const alerts = []
    
    // Check expiration (30 days before)
    const expiration = new Date(range.expiration_date)
    const today = new Date()
    const diffDays = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 30 && diffDays > 0) {
      alerts.push({
        type: 'expiration',
        message: `El CAI vence en ${diffDays} días (${range.expiration_date})`,
        severity: diffDays <= 7 ? 'error' : 'warning'
      })
    } else if (diffDays <= 0) {
      alerts.push({
        type: 'expired',
        message: '¡El CAI actual ha vencido!',
        severity: 'error'
      })
    }

    // Check quantity
    const remaining = range.end_number - range.current_number
    if (remaining <= range.alert_threshold) {
      alerts.push({
        type: 'quantity',
        message: `Quedan solo ${remaining} facturas disponibles en el rango`,
        severity: remaining <= 10 ? 'error' : 'warning'
      })
    }

    return alerts.length > 0 ? alerts : null
  }

  /**
   * Fetches all ranges for history/management
   */
  static async getAllRanges() {
    const { data, error } = await supabase
      .from('invoice_auth_ranges')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as InvoiceAuthRange[]
  }

  /**
   * Creates a new range and deactivates others
   */
  static async createRange(range: Partial<InvoiceAuthRange>) {
    // 1. Deactivate current active range
    await supabase
      .from('invoice_auth_ranges')
      .update({ is_active: false })
      .eq('is_active', true)

    // 2. Insert new range
    const { data, error } = await supabase
      .from('invoice_auth_ranges')
      .insert([{ ...range, is_active: true }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}
