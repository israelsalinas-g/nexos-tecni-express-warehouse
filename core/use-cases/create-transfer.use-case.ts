import { TransferService } from '@/services/transfer.service'
import { WarehouseTransfer, TransferItem } from '@/types/database.types'

export interface CreateTransferRequest {
  fromWarehouseId: string
  toWarehouseId: string
  items: {
    productId: string
    quantity: number
  }[]
  createdBy: string
}

export class CreateTransferUseCase {
  async execute(request: CreateTransferRequest): Promise<WarehouseTransfer> {
    // 1. Validation
    if (request.fromWarehouseId === request.toWarehouseId) {
      throw new Error('The origin and destination warehouses must be different.')
    }

    if (request.items.length === 0) {
      throw new Error('A transfer must have at least one item.')
    }

    // 2. Preparation
    const transferData: Omit<WarehouseTransfer, 'id' | 'created_at' | 'updated_at'> = {
      from_warehouse_id: request.fromWarehouseId,
      to_warehouse_id:   request.toWarehouseId,
      status:            'pending',
      created_by:        request.createdBy,
    }

    const itemsData: Omit<TransferItem, 'id' | 'transfer_id'>[] = request.items.map(item => ({
      product_id:         item.productId,
      quantity_requested: item.quantity,
    }))

    // 3. Persist
    return await TransferService.create(transferData, itemsData)
  }
}
