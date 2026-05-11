import { supabase } from '@/lib/supabase'
import { Invoice, InvoiceAuthRange, Order, OrderItem } from '@/types/database.types'

export class InvoiceService {
  static formatInvoiceNumber(range: InvoiceAuthRange): string {
    const padded = range.current_number.toString().padStart(8, '0')
    return `${range.prefix}-${padded}`
  }

  private static async getValidRange(): Promise<InvoiceAuthRange> {
    const { data: range, error } = await supabase
      .from('invoice_auth_ranges')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    if (!range) throw new Error('No hay rango de facturación activo. Contacte al administrador.')
    if (new Date(range.expiration_date) < new Date())
      throw new Error('El CAI actual ha vencido. No se pueden emitir facturas.')
    if (range.current_number > range.end_number)
      throw new Error('El rango de numeración autorizado se ha agotado.')

    return range as InvoiceAuthRange
  }

  // Creates order + items + invoice in one operation
  static async createDirect(
    order: Partial<Order>,
    items: Partial<OrderItem>[]
  ): Promise<{ invoice: Invoice; invoiceNumber: string }> {
    const range = await this.getValidRange()

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        ...order,
        order_number: `SO-${Date.now().toString().slice(-6)}`,
        status: 'confirmed',
        payment_status: 'paid',
      }])
      .select()
      .single()

    if (orderError) throw orderError

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items.map(i => ({ ...i, order_id: newOrder.id })))

    if (itemsError) throw itemsError

    const invoiceNumber = this.formatInvoiceNumber(range)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        order_id: newOrder.id,
        customer_id: order.customer_id,
        invoice_number: invoiceNumber,
        cai: range.cai,
        auth_range_id: range.id,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total: order.total,
        status: 'active',
      }])
      .select()
      .single()

    if (invoiceError) throw invoiceError

    await supabase
      .from('invoice_auth_ranges')
      .update({ current_number: range.current_number + 1 })
      .eq('id', range.id)

    return { invoice: invoice as Invoice, invoiceNumber }
  }

  // Converts an existing pending order into an invoice
  static async createFromOrder(
    orderId: string,
    paymentMethod: string
  ): Promise<{ invoice: Invoice; invoiceNumber: string }> {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    const range = await this.getValidRange()

    const invoiceNumber = this.formatInvoiceNumber(range)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        order_id: orderId,
        customer_id: order.customer_id,
        invoice_number: invoiceNumber,
        cai: range.cai,
        auth_range_id: range.id,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total: order.total,
        status: 'active',
      }])
      .select()
      .single()

    if (invoiceError) throw invoiceError

    await supabase
      .from('invoice_auth_ranges')
      .update({ current_number: range.current_number + 1 })
      .eq('id', range.id)

    await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    return { invoice: invoice as Invoice, invoiceNumber }
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        profiles(full_name, phone),
        orders(order_number, payment_method)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async voidInvoice(invoiceId: string, userId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: userId,
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
