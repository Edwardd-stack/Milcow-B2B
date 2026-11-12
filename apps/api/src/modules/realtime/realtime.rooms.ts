/** Room names. A socket joins the rooms it may listen to when it connects. */
export const memberRoom = (memberId: string) => `member:${memberId}`;
export const warehouseRoom = (warehouseId: string) => `warehouse:${warehouseId}`;
export const ADMIN_ROOM = 'admin';
