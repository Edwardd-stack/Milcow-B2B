/*
  Warnings:

  - Added the required column `warehouse_id` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "warehouse_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "contracts_warehouse_id_idx" ON "contracts"("warehouse_id");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
