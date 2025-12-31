-- AlterTable: Add label_en column with default derived from slug for existing rows
ALTER TABLE "categories" ADD COLUMN "label_en" TEXT;

-- Update existing rows to use slug as English label (with formatting)
UPDATE "categories" SET "label_en" = INITCAP(REPLACE(slug, '-', ' '));

-- Make the column NOT NULL after populating data
ALTER TABLE "categories" ALTER COLUMN "label_en" SET NOT NULL;
