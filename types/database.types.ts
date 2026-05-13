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
  price_public: number
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
  payment_method?: 'cash' | 'card' | 'transfer' | 'credit' | null
  subtotal: number
  tax_amount: number
  discount?: number
  shipping_cost?: number
  total: number
  notes?: string
  notes_internal?: string
  payment_reference?: string
  shipping_name?: string
  shipping_phone?: string
  shipping_address?: string
  shipping_city?: string
  customer_type_at_purchase?: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: Order['status']
  note?: string
  created_by: string
  created_at: string
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

// ─── Quotations ──────────────────────────────────────────────────────────────

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled'

export interface Quotation {
  id: string
  quotation_number: string
  customer_id: string
  customer_name?: string
  customer_email?: string
  subtotal: number
  tax_amount: number
  discount?: number
  total: number
  status: QuotationStatus
  valid_until?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface QuotationItem {
  id: string
  quotation_id: string
  product_id?: string
  product_name_es: string
  product_sku?: string
  quantity: number
  unit_price: number
  subtotal: number
  products?: Product
}

// ─── Shipments ───────────────────────────────────────────────────────────────

export type ShipmentStatus = 'pending' | 'dispatched' | 'in_transit' | 'delivered' | 'returned'

export interface Shipment {
  id: string
  order_id: string
  carrier_id?: string
  tracking_number?: string
  tracking_url?: string
  status: ShipmentStatus
  shipping_cost?: number
  estimated_delivery?: string
  dispatched_at?: string
  delivered_at?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  orders?: Order
}

// ─── Finance: Expenses ───────────────────────────────────────────────────────

export type ExpenseCategory = 'rent' | 'utilities' | 'salary' | 'supplies' | 'maintenance' | 'marketing' | 'other'

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  expense_date: string
  receipt_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Finance: Payables ───────────────────────────────────────────────────────

export interface PayablePayment {
  id: string
  purchase_order_id: string
  amount: number
  payment_date: string
  payment_method?: string
  reference?: string
  notes?: string
  created_by: string
  created_at: string
}

// ─── Credit Accounts ─────────────────────────────────────────────────────────

export type CreditTransactionType = 'charge' | 'payment' | 'adjustment'

export interface CreditAccount {
  id: string
  customer_id: string
  credit_limit: number
  current_balance: number
  due_date?: string
  payment_terms?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface CreditTransaction {
  id: string
  account_id: string
  transaction_type: CreditTransactionType
  amount: number
  description?: string
  order_id?: string
  paid_at?: string
  created_by: string
  created_at: string
}

// ─── Loyalty Program ─────────────────────────────────────────────────────────

export type LoyaltyTier = 'bronze' | 'silver' | 'gold'
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'adjustment' | 'expire'

export interface LoyaltyAccount {
  id: string
  customer_id: string
  points_balance: number
  points_lifetime: number
  tier: LoyaltyTier
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface LoyaltyTransaction {
  id: string
  account_id: string
  transaction_type: LoyaltyTransactionType
  points: number
  description?: string
  order_id?: string
  created_by?: string
  created_at: string
}

// ─── Service Tickets ─────────────────────────────────────────────────────────

export type TicketStatus =
  | 'received'
  | 'diagnosed'
  | 'awaiting_approval'
  | 'in_repair'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface ServiceTicket {
  id: string
  ticket_number: string
  customer_id: string
  assigned_to?: string
  appliance_brand?: string
  appliance_model?: string
  appliance_serial?: string
  appliance_type?: string
  problem_description: string
  diagnosis?: string
  repair_notes?: string
  estimated_cost?: number
  final_cost?: number
  parts_cost?: number
  status: TicketStatus
  customer_approved?: boolean
  approved_at?: string
  estimated_ready?: string
  delivered_at?: string
  created_at: string
  updated_at: string
  profiles?: Profile
  assigned_profile?: Profile
}

export interface TicketPart {
  id: string
  ticket_id: string
  product_id: string
  quantity: number
  unit_cost: number
  sale_price: number
  subtotal: number
  products?: Product
}

export interface TicketStatusHistory {
  id: string
  ticket_id: string
  status: TicketStatus
  note?: string
  created_by: string
  created_at: string
  profiles?: Profile
}

// ─── Compatibility ───────────────────────────────────────────────────────────

export interface ApplianceModel {
  id: string
  model_number: string
  appliance_type: string
  brand_id?: string
  is_active: boolean
  created_at: string
  brands?: Brand
}

export interface ProductCompatibility {
  id: string
  product_id: string
  model_id: string
  notes?: string
  products?: Product
  appliance_models?: ApplianceModel
}

export interface PartEquivalence {
  id: string
  product_id: string
  equivalent_sku: string
  brand_name?: string
  notes?: string
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'status_change' | 'void'

export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  entity_type: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  description?: string
  ip_address?: string
  created_at: string
  profiles?: Profile
}

// ─── UI / Business Logic Wrappers ────────────────────────────────────────────

export interface InventoryRow extends Inventory {
  products?: Product
  warehouses?: Warehouse
}

export interface PurchaseOrderWithPaid extends PurchaseOrder {
  paid_total: number
  suppliers?: Supplier
}

export interface CreditAccountWithBalance extends CreditAccount {
  available: number
  is_overdue: boolean
  profiles?: Profile
}

