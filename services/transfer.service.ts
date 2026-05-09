import { supabase } from '@/lib/supabase'
import { WarehouseTransfer, TransferItem } from '@/types/database.types'

export class TransferService {
  /**
   * Fetches all transfers for a specific warehouse (either as origin or destination)
   */
  static async getByWarehouse(warehouseId: string): Promise<WarehouseTransfer[]> {
    const { data, error } = await supabase
      .from('warehouse_transfers')
      .select('*, from:warehouses!from_warehouse_id(name), to:warehouses!to_warehouse_id(name)')
      .or(`from_warehouse_id.eq.${warehouseId},to_warehouse_id.eq.${warehouseId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  /**
   * Fetches details and items for a specific transfer
   */
  static async getById(id: string): Promise<{ transfer: WarehouseTransfer; items: any[] }> {
    const { data: transfer, error: tError } = await supabase
      .from('warehouse_transfers')
      .select('*, from:warehouses!from_warehouse_id(name), to:warehouses!to_warehouse_id(name)')
      .eq('id', id)
      .single()

    if (tError) throw tError

    const { data: items, error: iError } = await supabase
      .from('warehouse_transfer_items')
      .select('*, products(name_es, sku)')
      .eq('transfer_id', id)

    if (iError) throw iError

    return { transfer, items: items ?? [] }
  }

  /**
   * Creates a new transfer with its items
   */
  static async create(
    transfer: Omit<WarehouseTransfer, 'id' | 'created_at' | 'updated_at'>,
    items: Omit<TransferItem, 'id' | 'transfer_id'>[]
  ): Promise<WarehouseTransfer> {
    // 1. Create the transfer record
    const { data: newTransfer, error: tError } = await supabase
      .from('warehouse_transfers')
      .insert(transfer)
      .select()
      .single()

    if (tError) throw tError

    // 2. Create the items
    const itemsWithId = items.map(item => ({
      ...item,
      transfer_id: newTransfer.id,
    }))

    const { error: iError } = await supabase
      .from('warehouse_transfer_items')
      .insert(itemsWithId)

    if (iError) throw iError

    return newTransfer
  }

  /**
   * Updates the status of a transfer
   */
  static async updateStatus(
    id: string, 
    status: WarehouseTransfer['status'], 
    userId: string
  ): Promise<void> {
    const updateData: any = { status, updated_at: new Date().toISOString() }
    
    if (status === 'received') {
      updateData.received_by = userId
    }

    const { error } = await supabase
      .from('warehouse_transfers')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
  }
}
