-- Add slug to leagues
ALTER TABLE "leagues" ADD COLUMN     "slug" TEXT;

-- Add league_id to admins
ALTER TABLE "admins" ADD COLUMN     "league_id" UUID;

-- Add foreign key for admin -> league
ALTER TABLE "admins" ADD CONSTRAINT "admins_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Change Category -> League FK to CASCADE
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_league_id_fkey";
ALTER TABLE "categories" ADD CONSTRAINT "categories_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Change Team -> Category FK to CASCADE
ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_category_id_fkey";
ALTER TABLE "teams" ADD CONSTRAINT "teams_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Change Player -> Team FK to CASCADE
ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "players_team_id_fkey";
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Change Match -> Category FK to CASCADE
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_category_id_fkey";
ALTER TABLE "matches" ADD CONSTRAINT "matches_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Change Standing -> Category FK to CASCADE
ALTER TABLE "standings" DROP CONSTRAINT IF EXISTS "standings_category_id_fkey";
ALTER TABLE "standings" ADD CONSTRAINT "standings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create unique index on league slug (only after backfill will be set NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "leagues_slug_key" ON "leagues"("slug");
