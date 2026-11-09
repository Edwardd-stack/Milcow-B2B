import type { PickupInfo, PickupSlotInfo } from '@milcow/shared';
import type { PickupSlot, Prisma } from '../../generated/prisma/client';
import { toLocalizedText } from '../../libs/utils/convert.util';

export const pickupInclude = {
  pickupSlot: { include: { warehouse: true } },
} satisfies Prisma.PickupInclude;

type PickupRow = Prisma.PickupGetPayload<{ include: typeof pickupInclude }>;

export function toPickupSlotInfo(slot: PickupSlot): PickupSlotInfo {
  return {
    id: slot.id,
    warehouseId: slot.warehouseId,
    slotStart: slot.slotStart.toISOString(),
    slotEnd: slot.slotEnd.toISOString(),
    slotCapacity: slot.slotCapacity,
    slotBooked: slot.slotBooked,
    slotAvailable: slot.slotCapacity - slot.slotBooked,
  };
}

export function toPickupInfo(pickup: PickupRow): PickupInfo {
  const { pickupSlot: slot } = pickup;
  return {
    id: pickup.id,
    pickupStatus: pickup.pickupStatus,
    pickupCode: pickup.pickupCode,
    pickupVehicleNo: pickup.pickupVehicleNo,
    orderId: pickup.orderId,
    slot: {
      id: slot.id,
      slotStart: slot.slotStart.toISOString(),
      slotEnd: slot.slotEnd.toISOString(),
    },
    warehouse: {
      id: slot.warehouse.id,
      warehouseName: toLocalizedText(slot.warehouse.warehouseName),
    },
    createdAt: pickup.createdAt.toISOString(),
    updatedAt: pickup.updatedAt.toISOString(),
  };
}
