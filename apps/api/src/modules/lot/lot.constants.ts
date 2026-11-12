/** A lot must be processed within this many hours after milking */
export const LOT_USE_BY_HOURS = 72;

/** Product types that are tracked as lots (fresh, perishable) */
export const LOT_PRODUCT_TYPES = ['RAW_MILK', 'CREAM'] as const;

/** Share of fresh raw-milk lots offered on the surplus exchange */
export const SURPLUS_SHARE = 0.3;
/** Surplus lots start a little below the catalog price */
export const SURPLUS_BASE_PRICE_RATE = 0.95;

/**
 * CO₂e ESTIMATE — demo assumptions, not a certified calculation (shown as "추정치" in the UI).
 * Farm: kg CO₂e per kg of milk at the farm gate. Transport: kg CO₂e per tonne-km (refrigerated truck).
 */
export const CO2E_FARM_KG_PER_KG = 1.1;
export const CO2E_TRANSPORT_KG_PER_TKM = 0.12;
/** Straight-line km × this ≈ road km */
export const ROAD_FACTOR = 1.3;
/** Average truck speed for the collection trip (km/h) */
export const TRUCK_SPEED_KMH = 65;

/** Lot code letters per warehouse when warehouseCode is missing */
export const FALLBACK_WAREHOUSE_CODE = 'MCW';
