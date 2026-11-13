/*
  Warnings:

  - A unique constraint covering the columns `[product_sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[warehouse_code]` on the table `warehouses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "bacteria_grade" AS ENUM ('GRADE_1A', 'GRADE_1B', 'GRADE_2', 'GRADE_3', 'GRADE_4');

-- CreateEnum
CREATE TYPE "somatic_grade" AS ENUM ('GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5');

-- CreateEnum
CREATE TYPE "antibiotic_result" AS ENUM ('NEGATIVE', 'POSITIVE');

-- CreateEnum
CREATE TYPE "lot_status" AS ENUM ('IN_STOCK', 'SOLD_OUT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "order_event_type" AS ENUM ('CREATED', 'STATUS_CHANGED', 'CANCELLED', 'REFUNDED', 'PICKUP_STEP');

-- AlterEnum
ALTER TYPE "ai_log_type" ADD VALUE 'OPS';

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "contract_reject_reason" TEXT;

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "inquiry_answered_at" TIMESTAMPTZ(3),
ADD COLUMN     "inquiry_answered_by_id" UUID;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "member_is_demo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "lot_id" UUID;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_hold_until" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "product_sku" TEXT;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "warehouse_code" TEXT;

-- CreateTable
CREATE TABLE "lots" (
    "id" UUID NOT NULL,
    "lot_code" TEXT NOT NULL,
    "lot_status" "lot_status" NOT NULL DEFAULT 'IN_STOCK',
    "lot_milked_at" TIMESTAMPTZ(3) NOT NULL,
    "lot_collected_at" TIMESTAMPTZ(3) NOT NULL,
    "lot_arrived_at" TIMESTAMPTZ(3) NOT NULL,
    "lot_use_by" TIMESTAMPTZ(3) NOT NULL,
    "lot_volume_ton" DECIMAL(10,2) NOT NULL,
    "lot_remaining_ton" DECIMAL(10,2) NOT NULL,
    "lot_bacteria_count" INTEGER NOT NULL,
    "lot_bacteria_grade" "bacteria_grade" NOT NULL,
    "lot_somatic_count" INTEGER NOT NULL,
    "lot_somatic_grade" "somatic_grade" NOT NULL,
    "lot_fat_pct" DECIMAL(4,2) NOT NULL,
    "lot_protein_pct" DECIMAL(4,2) NOT NULL,
    "lot_antibiotic" "antibiotic_result" NOT NULL DEFAULT 'NEGATIVE',
    "lot_temp_log" JSONB NOT NULL,
    "lot_co2e_kg" DECIMAL(10,1) NOT NULL,
    "lot_is_surplus" BOOLEAN NOT NULL DEFAULT false,
    "lot_base_price_per_ton" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "farm_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" UUID NOT NULL,
    "event_type" "order_event_type" NOT NULL,
    "event_from" TEXT,
    "event_to" TEXT,
    "event_note" TEXT,
    "order_id" UUID NOT NULL,
    "member_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lots_lot_code_key" ON "lots"("lot_code");

-- CreateIndex
CREATE INDEX "lots_lot_is_surplus_lot_status_lot_use_by_idx" ON "lots"("lot_is_surplus", "lot_status", "lot_use_by");

-- CreateIndex
CREATE INDEX "lots_product_id_idx" ON "lots"("product_id");

-- CreateIndex
CREATE INDEX "lots_farm_id_idx" ON "lots"("farm_id");

-- CreateIndex
CREATE INDEX "lots_warehouse_id_idx" ON "lots"("warehouse_id");

-- CreateIndex
CREATE INDEX "order_events_order_id_created_at_idx" ON "order_events"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_items_lot_id_idx" ON "order_items"("lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_sku_key" ON "products"("product_sku");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_warehouse_code_key" ON "warehouses"("warehouse_code");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_inquiry_answered_by_id_fkey" FOREIGN KEY ("inquiry_answered_by_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
