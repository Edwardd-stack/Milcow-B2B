import { Type, type Schema } from '@google/genai';

/** What the model must return (structured output). Ids are limited to the real catalog via enums. */
export interface ContractDraftModelOutput {
  productId: string | null;
  warehouseId: string | null;
  monthlyTon: number | null;
  startDate: string | null;
  months: number | null;
  deliveryType: 'DELIVERY' | 'PICKUP' | null;
  address: string | null;
  servicePlanIds: string[];
  explanation: string;
}

export function contractDraftSchema(ids: {
  products: string[];
  warehouses: string[];
  servicePlans: string[];
}): Schema {
  return {
    type: Type.OBJECT,
    properties: {
      productId: { type: Type.STRING, enum: ids.products, nullable: true },
      warehouseId: { type: Type.STRING, enum: ids.warehouses, nullable: true },
      monthlyTon: { type: Type.NUMBER, nullable: true, description: 'Tons per monthly delivery' },
      startDate: { type: Type.STRING, nullable: true, description: 'First delivery, YYYY-MM-DD' },
      months: { type: Type.INTEGER, nullable: true, description: 'Number of monthly deliveries' },
      deliveryType: { type: Type.STRING, enum: ['DELIVERY', 'PICKUP'], nullable: true },
      address: { type: Type.STRING, nullable: true, description: 'Only for DELIVERY' },
      servicePlanIds: { type: Type.ARRAY, items: { type: Type.STRING, enum: ids.servicePlans } },
      explanation: { type: Type.STRING },
    },
    required: [
      'productId',
      'warehouseId',
      'monthlyTon',
      'startDate',
      'months',
      'deliveryType',
      'address',
      'servicePlanIds',
      'explanation',
    ],
    propertyOrdering: [
      'productId',
      'warehouseId',
      'monthlyTon',
      'startDate',
      'months',
      'deliveryType',
      'address',
      'servicePlanIds',
      'explanation',
    ],
  };
}
