-- CreateTable
CREATE TABLE "venues" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "google_maps_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- AlterTable (nullable first for backfill)
ALTER TABLE "courts" ADD COLUMN "venue_id" UUID;
ALTER TABLE "courts" ALTER COLUMN "city" DROP NOT NULL;

-- Backfill: every existing court becomes a Venue + its "Cancha 1"; repoint matches
DO $$
DECLARE
  c RECORD;
  v_id UUID;
  new_court_id UUID;
BEGIN
  FOR c IN SELECT * FROM "courts" LOOP
    v_id := gen_random_uuid();
    INSERT INTO "venues" ("id", "name", "address", "city", "google_maps_link", "created_at", "updated_at")
    VALUES (v_id, c.name, c.address, c.city, c.google_maps_link, NOW(), NOW());
    new_court_id := gen_random_uuid();
    INSERT INTO "courts" ("id", "name", "venue_id", "capacity", "address", "city", "google_maps_link", "created_at", "updated_at")
    VALUES (new_court_id, 'Cancha 1', v_id, c.capacity, NULL, NULL, NULL, NOW(), NOW());
    UPDATE "matches" SET "court_id" = new_court_id WHERE "court_id" = c.id;
  END LOOP;
  DELETE FROM "courts" WHERE "venue_id" IS NULL;
END $$;

-- Constraints
ALTER TABLE "courts" ALTER COLUMN "venue_id" SET NOT NULL;
ALTER TABLE "courts" ADD CONSTRAINT "courts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "courts" ADD CONSTRAINT "courts_name_venue_id_key" UNIQUE ("name", "venue_id");

-- Drop old court-level location columns
ALTER TABLE "courts" DROP COLUMN "address";
ALTER TABLE "courts" DROP COLUMN "city";
ALTER TABLE "courts" DROP COLUMN "google_maps_link";