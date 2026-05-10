/**
 * Nexos Tecni-Express Warehouse
 * Database Entity Definitions (Supabase-based)
 */

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  customer_type: string
  type_verified: boolean
  type_requested?: string | null
  preferred_language: string
  is_admin: boolean
  admin_role?: string | null
  avatar_url?: string
  created_at: string
  updated_at: string
}



export interface Warehouse {
  id: string
  name: string
  code?: string
  location?: string
  is_active: boolean
  created_at: string
}


export interface Category {
  id: string
  name?: string
  name_es?: string
  name_en?: string
  slug: string
  parent_id?: string | null
}


export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string
}


export interface Product {
  id: string
  sku: string
  name_es: string
  name_en?: string
  description_es?: string
  slug: string
  category_id?: string
  brand_id?: string
  base_price: number
  is_active: boolean
  created_at: string
  updated_at: string
  brands?: Brand
  categories?: Category
  product_images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  is_primary: boolean
  sort_order: number
}




export interface Inventory {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  stock_min: number
  location_code?: string
  updated_at: string
}

export interface WarehouseTransfer {
  id: string
  from_warehouse_id: string
  to_warehouse_id: string
  status: 'pending' | 'shipped' | 'received' | 'cancelled'
  created_by: string
  received_by?: string
  created_at: string
  updated_at: string
}

export interface TransferItem {
  id: string
  transfer_id: string
  product_id: string
  quantity_requested: number
  quantity_shipped?: number
  quantity_received?: number
}

export interface InventoryCountSession {
  id: string
  warehouse_id: string
  status: 'open' | 'completed' | 'cancelled'
  started_by: string
  completed_by?: string
  started_at: string
  completed_at?: string
}

export interface InventoryCountItem {
  id: string
  count_session_id: string
  product_id: string
  system_quantity: number
  counted_quantity: number
  counted_by: string
  counted_at: string
  notes?: string
}

export interface Supplier {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  city?: string
  country: string
  tax_id?: string
  payment_terms?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  warehouse_id: string
  status: 'draft' | 'pending' | 'received' | 'cancelled'
  total_amount?: number
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  suppliers?: Supplier
  warehouses?: Warehouse
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  quantity_ordered: number
  quantity_received?: number
  unit_price?: number
  products?: Product
}


export interface Order {
  id: string
  order_number: string
  customer_id: string
  warehouse_id?: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'partially_paid'
  payment_method?: string
  subtotal: number
  tax_amount: number // 15% ISV
  total: number
  notes?: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name_es?: string
  product_sku?: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Invoice {
  id: string
  order_id: string
  customer_id: string
  invoice_number: string // SAR Format: 000-000-00-00000000
  cai: string
  auth_range_id: string
  subtotal: number
  tax_amount: number
  total: number
  status: 'active' | 'voided'
  created_at: string
  updated_at: string
  voided_at?: string
  voided_by?: string
}

export interface InvoiceAuthRange {
  id: string
  cai: string
  prefix: string // e.g. 000-001-01
  start_number: number
  end_number: number
  current_number: number
  expiration_date: string
  alert_threshold: number
  is_active: boolean
  created_at: string
}

export interface CompanyProfile {
  id: string
  business_name: string
  rtn: string
  address: string
  phone: string
  email: string
  website?: string
  logo_url?: string
  legal_representative: string
  legal_rep_position: string
  legal_rep_phone?: string
  legal_rep_email?: string
  updated_at: string
}

// UI / Business Logic Wrappers



export interface InventoryRow extends Inventory {
  products?: Product
  warehouses?: Warehouse
}


