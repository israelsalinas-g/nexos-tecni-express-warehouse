import { InventoryService } from '@/services/inventory.service'

export interface AdjustInventoryRequest {
  inventoryId: string
  newQuantity: number
  reason?: string // Could be used for logging movements later
}

export class AdjustInventoryUseCase {
  async execute(request: AdjustInventoryRequest): Promise<void> {
    if (request.newQuantity < 0) {
      throw new Error('Quantity cannot be negative')
    }

    // In a real scenario, we might also record an inventory movement here
    // For now, we directly update the quantity
    await InventoryService.updateQuantity(request.inventoryId, request.newQuantity)
  }
}
