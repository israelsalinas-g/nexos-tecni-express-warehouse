import { TransferService } from '@/services/transfer.service'
import { InventoryService } from '@/services/inventory.service'

export interface ReceiveTransferRequest {
  transferId: string
  receivedBy: string
}

export class ReceiveTransferUseCase {
  async execute(request: ReceiveTransferRequest): Promise<void> {
    // 1. Get transfer details
    const { transfer, items } = await TransferService.getById(request.transferId)

    if (transfer.status !== 'shipped' && transfer.status !== 'pending') {
      throw new Error(`Cannot receive a transfer in status: ${transfer.status}`)
    }

    // 2. Update status to received
    await TransferService.updateStatus(request.transferId, 'received', request.receivedBy)

    // 3. Logic to update actual inventory levels
    // Note: In a production environment, this should be done in a database transaction
    // to ensure atomicity. Here we demonstrate the coordination of services.
    for (const item of items) {
      // Typically:
      // - Subtract from origin warehouse (usually done when status changes to 'shipped')
      // - Add to destination warehouse (done when status changes to 'received')
      
      // For this simplified version, we just log it. 
      // Implementation of inventory updates would follow here calling InventoryService.
      console.log(`Updating inventory for product ${item.product_id}: +${item.quantity_requested} in warehouse ${transfer.to_warehouse_id}`)
    }
  }
}
