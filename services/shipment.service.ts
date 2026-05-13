import { supabase } from '@/lib/supabase'
import { Shipment, ShipmentStatus, Order } from '@/types/database.types'

export interface ShipmentDetail extends Shipment {
  orders?: Order & { profiles?: { full_name: string; phone?: string } }
}

export class ShipmentService {
  static async getAll(status?: string): Promise<ShipmentDetail[]> {
    let q = supabase
      .from('shipments')
      .select(`
        *,
        orders(id, order_number, total, status,
          profiles(full_name, phone)
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      q = q.eq('status', status)
    }

    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as ShipmentDetail[]
  }

  static async getById(id: string): Promise<ShipmentDetail | null> {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        orders(*, profiles(full_name, phone, email))
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as ShipmentDetail | null
  }

  static async create(s: {
    order_id: string
    carrier_id?: string
    tracking_number?: string
    tracking_url?: string
    shipping_cost?: number
    estimated_delivery?: string
    notes?: string
  }): Promise<Shipment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('shipments')
      .insert({ ...s, status: 'pending' as ShipmentStatus, created_by: user.id })
      .select()
      .single()

    if (error) throw error
    return data as Shipment
  }

  static async updateStatus(id: string, status: ShipmentStatus): Promise<void> {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }

    if (status === 'dispatched') updates.dispatched_at = new Date().toISOString()
    if (status === 'delivered') updates.delivered_at = new Date().toISOString()

    const { error } = await supabase.from('shipments').update(updates).eq('id', id)
    if (error) throw error

    // Sync order status when delivered
    if (status === 'delivered') {
      const { data: shipment } = await supabase.from('shipments').select('order_id').eq('id', id).single()
      if (shipment?.order_id) {
        await supabase.from('orders').update({ status: 'delivered' }).eq('id', shipment.order_id)
      }
    }
  }

  static async updateTracking(id: string, trackingNumber: string, trackingUrl?: string): Promise<void> {
    const updates: Record<string, unknown> = { tracking_number: trackingNumber, updated_at: new Date().toISOString() }
    if (trackingUrl) updates.tracking_url = trackingUrl

    const { error } = await supabase.from('shipments').update(updates).eq('id', id)
    if (error) throw error
  }
}
