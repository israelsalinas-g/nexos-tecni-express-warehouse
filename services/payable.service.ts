import { supabase } from '@/lib/supabase'
import { PayablePayment, PurchaseOrder, PurchaseOrderWithPaid } from '@/types/database.types'

export class PayableService {
  static async getUnpaidOrders(): Promise<PurchaseOrderWithPaid[]> {
    // Get received purchase orders with their payment totals
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers(name, contact_name, phone),
        payable_payments(amount)
      `)
      .eq('status', 'received')
      .not('total_amount', 'is', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as any[]).map(po => ({
      ...po,
      paid_total: (po.payable_payments ?? []).reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
    })) as PurchaseOrderWithPaid[]
  }

  static async getPaymentsForOrder(purchaseOrderId: string): Promise<PayablePayment[]> {
    const { data, error } = await supabase
      .from('payable_payments')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('payment_date', { ascending: false })

    if (error) throw error
    return (data ?? []) as PayablePayment[]
  }

  static async registerPayment(p: {
    purchase_order_id: string
    amount: number
    payment_date: string
    payment_method?: string
    reference?: string
    notes?: string
  }): Promise<PayablePayment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('payable_payments')
      .insert({ ...p, created_by: user.id })
      .select()
      .single()

    if (error) throw error
    return data as PayablePayment
  }

  static async getTotalPending(): Promise<number> {
    const orders = await PayableService.getUnpaidOrders()
    return orders.reduce((sum, o) => {
      const pending = (o.total_amount ?? 0) - o.paid_total
      return sum + (pending > 0 ? pending : 0)
    }, 0)
  }
}
