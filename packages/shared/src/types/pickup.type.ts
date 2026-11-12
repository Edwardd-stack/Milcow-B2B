import type { PickupStatus } from '../enums';
import type { LocalizedText } from './common.type';

/** GET /pickup-slots */
export interface PickupSlotInfo {
  id: string;
  warehouseId: string;
  slotStart: string; // ISO date-time
  slotEnd: string;
  slotCapacity: number;
  slotBooked: number;
  slotAvailable: number;
}

/** POST /pickups, GET /pickups, PATCH /pickups/:id/status */
export interface PickupInfo {
  id: string;
  pickupStatus: PickupStatus;
  pickupCode: string; // shown to the driver at the gate
  pickupVehicleNo: string | null;
  orderId: string;
  slot: { id: string; slotStart: string; slotEnd: string };
  warehouse: { id: string; warehouseName: LocalizedText };
  createdAt: string;
  updatedAt: string;
}
