import { supabase } from '@/lib/supabase'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Quotation, QuotationItem, QuotationStatus, Order } from '@/types/database.types'
import { generateQuotationHTML } from '@/lib/pdf-templates/quotation.template'

const TAX_RATE = 0.15

export interface QuotationDetail extends Quotation {
  items: QuotationItem[]
}

export interface QuotationFormData {
  customer_id: string
  customer_name: string
  customer_email?: string
  valid_until?: string
  notes?: string
  discount?: number
  items: {
    product_id?: string
    product_name_es: string
    product_sku?: string
    quantity: number
    unit_price: number
  }[]
}

export class QuotationService {
  static async getAll(status?: string): Promise<Quotation[]> {
    let q = supabase
      .from('quotations')
      .select('*, profiles!customer_id(full_name, phone, email)')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      q = q.eq('status', status)
    }

    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Quotation[]
  }

  static async getById(id: string): Promise<QuotationDetail | null> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*, profiles!customer_id(full_name, phone, email), quotation_items(*, products(name_es, sku))')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return null

    const raw = data as any
    return {
      ...raw,
      items: (raw.quotation_items ?? []).map((i: any) => ({
        id: i.id,
        quotation_id: i.quotation_id,
        product_id: i.product_id,
        product_name_es: i.product_name_es,
        product_sku: i.product_sku,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal,
        products: i.products,
      })) as QuotationItem[],
    }
  }

  static async create(form: QuotationFormData): Promise<Quotation> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const subtotal = form.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    const discount = form.discount ?? 0
    const tax_amount = Math.round((subtotal - discount) * TAX_RATE * 100) / 100
    const total = subtotal - discount + tax_amount

    const quotationNumber = `COT-${Date.now().toString().slice(-8)}`

    const { data, error } = await supabase
      .from('quotations')
      .insert({
        quotation_number: quotationNumber,
        customer_id: form.customer_id,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        subtotal,
        tax_amount,
        discount,
        total,
        status: 'draft' as QuotationStatus,
        valid_until: form.valid_until,
        notes: form.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    const items = form.items.map(i => ({
      quotation_id: data.id,
      product_id: i.product_id,
      product_name_es: i.product_name_es,
      product_sku: i.product_sku,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: Math.round(i.quantity * i.unit_price * 100) / 100,
    }))

    const { error: itemsError } = await supabase.from('quotation_items').insert(items)
    if (itemsError) throw itemsError

    return data as Quotation
  }

  static async update(id: string, form: QuotationFormData): Promise<Quotation> {
    const subtotal = form.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
    const discount = form.discount ?? 0
    const tax_amount = Math.round((subtotal - discount) * TAX_RATE * 100) / 100
    const total = subtotal - discount + tax_amount

    const { data, error } = await supabase
      .from('quotations')
      .update({
        customer_id: form.customer_id,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        subtotal,
        tax_amount,
        discount,
        total,
        valid_until: form.valid_until,
        notes: form.notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Replace items
    await supabase.from('quotation_items').delete().eq('quotation_id', id)

    const items = form.items.map(i => ({
      quotation_id: id,
      product_id: i.product_id,
      product_name_es: i.product_name_es,
      product_sku: i.product_sku,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: Math.round(i.quantity * i.unit_price * 100) / 100,
    }))

    const { error: itemsError } = await supabase.from('quotation_items').insert(items)
    if (itemsError) throw itemsError

    return data as Quotation
  }

  static async updateStatus(id: string, status: QuotationStatus): Promise<void> {
    const { error } = await supabase
      .from('quotations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  static async convertToOrder(id: string): Promise<Order> {
    const { data, error } = await supabase.rpc('convert_quotation_to_order', { p_quotation_id: id })
    if (error) throw error
    return data as Order
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('quotations').delete().eq('id', id)
    if (error) throw error
  }

  static async generateAndSharePDF(quotation: QuotationDetail): Promise<void> {
    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('*')
      .limit(1)
      .single()

    const html = generateQuotationHTML(quotation, quotation.items, companyData as any)
    const { uri } = await Print.printToFileAsync({ html })
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Cotización ${quotation.quotation_number}`,
    })
  }
}
