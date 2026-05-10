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

// UI / Business Logic Wrappers

export interface InventoryRow extends Inventory {
  products?: Product
  warehouses?: Warehouse
}

