import type { PrismaClient } from '../../generated/prisma/client';

/** Pickup windows: weekdays, these hours (Korea time), N trucks each. 12:00–13:00 is lunch. */
export const PICKUP_DAYS_AHEAD = 14;
export const PICKUP_HOURS = [9, 10, 11, 13, 14, 15, 16];
export const PICKUP_TRUCKS_PER_SLOT = 3;

/**
 * Makes sure every warehouse has slots for the next `daysAhead` days.
 * Used by the seed and by the nightly scheduler. `skipDuplicates` + the unique
 * (warehouseId, slotStart) → existing (maybe already booked) slots are left untouched.
 */
export async function ensurePickupSlots(
  prisma: PrismaClient,
  daysAhead = PICKUP_DAYS_AHEAD,
): Promise<number> {
  const warehouses = await prisma.warehouse.findMany({ select: { id: true } });
  const slots: { warehouseId: string; slotStart: Date; slotEnd: Date; slotCapacity: number }[] = [];

  for (let day = 1; day <= daysAhead; day++) {
    if (isWeekendInKorea(day)) continue;
    for (const hour of PICKUP_HOURS) {
      for (const { id } of warehouses) {
        slots.push({
          warehouseId: id,
          slotStart: koreaTime(day, hour),
          slotEnd: koreaTime(day, hour + 1),
          slotCapacity: PICKUP_TRUCKS_PER_SLOT,
        });
      }
    }
  }

  const { count } = await prisma.pickupSlot.createMany({ data: slots, skipDuplicates: true });
  return count; // only the newly created ones
}

/** Today's date in Korea + `dayOffset` days, at `hour`:00 Korea time, as a UTC Date. */
export function koreaTime(dayOffset: number, hour: number): Date {
  const nowInKorea = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      nowInKorea.getUTCFullYear(),
      nowInKorea.getUTCMonth(),
      nowInKorea.getUTCDate() + dayOffset,
      hour - 9, // Korea is UTC+9
    ),
  );
}

function isWeekendInKorea(dayOffset: number): boolean {
  const weekday = new Date(koreaTime(dayOffset, 12).getTime() + 9 * 60 * 60 * 1000).getUTCDay();
  return weekday === 0 || weekday === 6; // Sunday, Saturday
}
