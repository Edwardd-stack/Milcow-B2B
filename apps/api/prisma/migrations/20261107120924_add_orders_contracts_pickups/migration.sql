-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "service_type" AS ENUM ('COLD_CHAIN', 'QUALITY_TEST', 'PRICE_LOCK', 'PRIORITY_SUPPLY', 'FREE_PICKUP');

-- CreateEnum
CREATE TYPE "service_status" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "inquiry_status" AS ENUM ('NEW', 'ANSWERED');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PENDING', 'PAID', 'PREPARING', 'SHIPPING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "delivery_type" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('READY', 'DONE', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "pickup_status" AS ENUM ('SCHEDULED', 'LOADING', 'READY', 'PICKED_UP');

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "contract_status" "contract_status" NOT NULL DEFAULT 'DRAFT',
    "contract_start" DATE NOT NULL,
    "contract_end" DATE NOT NULL,
    "contract_monthly_ton" DECIMAL(10,2) NOT NULL,
    "contract_price_per_ton" INTEGER NOT NULL,
    "contract_delivery_type" "delivery_type" NOT NULL,
    "contract_address" TEXT,
    "contract_terms" JSONB,
    "contract_pdf_url" TEXT,
    "member_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_plans" (
    "id" UUID NOT NULL,
    "service_type" "service_type" NOT NULL,
    "service_name" JSONB NOT NULL,
    "service_desc" JSONB,
    "service_price" INTEGER NOT NULL,
    "service_status" "service_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_services" (
    "service_price" INTEGER NOT NULL,
    "contract_id" UUID NOT NULL,
    "service_plan_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_services_pkey" PRIMARY KEY ("contract_id","service_plan_id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "inquiry_name" TEXT NOT NULL,
    "inquiry_email" TEXT NOT NULL,
    "inquiry_company" TEXT,
    "inquiry_message" TEXT NOT NULL,
    "inquiry_status" "inquiry_status" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_status" "order_status" NOT NULL DEFAULT 'PENDING',
    "order_delivery_type" "delivery_type" NOT NULL,
    "order_address" TEXT,
    "order_scheduled_date" DATE,
    "order_total" DECIMAL(15,0) NOT NULL,
    "member_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "contract_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "item_ton" DECIMAL(10,2) NOT NULL,
    "item_price_per_ton" INTEGER NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "payment_toss_order_id" TEXT NOT NULL,
    "payment_key" TEXT,
    "payment_status" "payment_status" NOT NULL DEFAULT 'READY',
    "payment_method" TEXT,
    "payment_amount" DECIMAL(15,0) NOT NULL,
    "payment_approved_at" TIMESTAMPTZ(3),
    "payment_fail_reason" TEXT,
    "order_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_slots" (
    "id" UUID NOT NULL,
    "slot_start" TIMESTAMPTZ(3) NOT NULL,
    "slot_end" TIMESTAMPTZ(3) NOT NULL,
    "slot_capacity" INTEGER NOT NULL,
    "slot_booked" INTEGER NOT NULL DEFAULT 0,
    "warehouse_id" UUID NOT NULL,

    CONSTRAINT "pickup_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickups" (
    "id" UUID NOT NULL,
    "pickup_status" "pickup_status" NOT NULL DEFAULT 'SCHEDULED',
    "pickup_vehicle_no" TEXT,
    "pickup_code" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "pickup_slot_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pickups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_member_id_contract_status_idx" ON "contracts"("member_id", "contract_status");

-- CreateIndex
CREATE INDEX "contracts_product_id_idx" ON "contracts"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_plans_service_type_key" ON "service_plans"("service_type");

-- CreateIndex
CREATE INDEX "contract_services_service_plan_id_idx" ON "contract_services"("service_plan_id");

-- CreateIndex
CREATE INDEX "inquiries_inquiry_status_idx" ON "inquiries"("inquiry_status");

-- CreateIndex
CREATE INDEX "orders_member_id_order_status_idx" ON "orders"("member_id", "order_status");

-- CreateIndex
CREATE INDEX "orders_warehouse_id_idx" ON "orders"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_contract_id_order_scheduled_date_key" ON "orders"("contract_id", "order_scheduled_date");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_product_id_key" ON "order_items"("order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_toss_order_id_key" ON "payments"("payment_toss_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_key_key" ON "payments"("payment_key");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_slots_warehouse_id_slot_start_key" ON "pickup_slots"("warehouse_id", "slot_start");

-- CreateIndex
CREATE UNIQUE INDEX "pickups_pickup_code_key" ON "pickups"("pickup_code");

-- CreateIndex
CREATE UNIQUE INDEX "pickups_order_id_key" ON "pickups"("order_id");

-- CreateIndex
CREATE INDEX "pickups_pickup_slot_id_idx" ON "pickups"("pickup_slot_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_services" ADD CONSTRAINT "contract_services_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_services" ADD CONSTRAINT "contract_services_service_plan_id_fkey" FOREIGN KEY ("service_plan_id") REFERENCES "service_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_slots" ADD CONSTRAINT "pickup_slots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_pickup_slot_id_fkey" FOREIGN KEY ("pickup_slot_id") REFERENCES "pickup_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- Manual additions: CHECK constraints (not expressible in Prisma schema)
-- The database itself rejects impossible data, even if app code has a bug.
-- ─────────────────────────────────────────────────────────────

-- A pickup slot can never be overbooked
ALTER TABLE "pickup_slots" ADD CONSTRAINT "pickup_slots_booked_check"
  CHECK ("slot_booked" >= 0 AND "slot_booked" <= "slot_capacity");

-- A pickup slot must end after it starts
ALTER TABLE "pickup_slots" ADD CONSTRAINT "pickup_slots_time_check"
  CHECK ("slot_end" > "slot_start");

-- A contract must end after it starts
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_period_check"
  CHECK ("contract_end" > "contract_start");

-- Ordered amounts must be positive
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_ton_check"
  CHECK ("item_ton" > 0);
