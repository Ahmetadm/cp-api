/*
  Warnings:

  - You are about to drop the column `category_id` on the `complaints` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_category_id_fkey";

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "category_id";
