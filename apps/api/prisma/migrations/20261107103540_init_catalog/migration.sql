-- CreateEnum
CREATE TYPE "farm_certification" AS ENUM ('HACCP', 'ORGANIC', 'ANIMAL_WELFARE');

-- CreateEnum
CREATE TYPE "member_type" AS ENUM ('BUYER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "member_status" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "lang" AS ENUM ('KO', 'EN', 'UZ');

-- CreateEnum
CREATE TYPE "product_type" AS ENUM ('RAW_MILK', 'CREAM', 'BUTTER', 'CHEESE', 'YOGURT', 'MILK_POWDER');

-- CreateEnum
CREATE TYPE "product_grade" AS ENUM ('PREMIUM', 'GRADE_1', 'GRADE_2');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "farms" (
    "id" UUID NOT NULL,
    "farm_name" JSONB NOT NULL,
    "farm_desc" JSONB,
    "farm_address" TEXT NOT NULL,
    "farm_lat" DOUBLE PRECISION NOT NULL,
    "farm_lng" DOUBLE PRECISION NOT NULL,
    "farm_cow_count" INTEGER,
    "farm_daily_capacity_ton" DECIMAL(10,2),
    "farm_certifications" "farm_certification"[] DEFAULT ARRAY[]::"farm_certification"[],
    "farm_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" UUID NOT NULL,
    "inventory_ton" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "member_type" "member_type" NOT NULL DEFAULT 'BUYER',
    "member_status" "member_status" NOT NULL DEFAULT 'ACTIVE',
    "member_email" TEXT NOT NULL,
    "member_password" TEXT,
    "member_kakao_id" TEXT,
    "member_nick" TEXT NOT NULL,
    "member_phone" TEXT,
    "member_company_name" TEXT,
    "member_biz_no" TEXT,
    "member_lang" "lang" NOT NULL DEFAULT 'KO',
    "warehouse_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "product_type" "product_type" NOT NULL,
    "product_name" JSONB NOT NULL,
    "product_desc" JSONB,
    "product_grade" "product_grade" NOT NULL,
    "product_fat_pct" DECIMAL(4,2),
    "product_protein_pct" DECIMAL(4,2),
    "product_price_per_ton" INTEGER NOT NULL,
    "product_min_order_ton" DECIMAL(10,2) NOT NULL,
    "product_status" "product_status" NOT NULL DEFAULT 'ACTIVE',
    "product_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "farm_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "warehouse_name" JSONB NOT NULL,
    "warehouse_address" TEXT NOT NULL,
    "warehouse_lat" DOUBLE PRECISION NOT NULL,
    "warehouse_lng" DOUBLE PRECISION NOT NULL,
    "warehouse_capacity_ton" DECIMAL(10,2) NOT NULL,
    "warehouse_temp_c" DECIMAL(4,1),
    "warehouse_open_time" TEXT,
    "warehouse_close_time" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventories_warehouse_id_idx" ON "inventories"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_product_id_warehouse_id_key" ON "inventories"("product_id", "warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_member_email_key" ON "members"("member_email");

-- CreateIndex
CREATE UNIQUE INDEX "members_member_kakao_id_key" ON "members"("member_kakao_id");

-- CreateIndex
CREATE INDEX "members_warehouse_id_idx" ON "members"("warehouse_id");

-- CreateIndex
CREATE INDEX "products_product_type_product_status_idx" ON "products"("product_type", "product_status");

-- CreateIndex
CREATE INDEX "products_farm_id_idx" ON "products"("farm_id");

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
