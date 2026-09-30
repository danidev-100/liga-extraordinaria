-- CreateIndex
CREATE INDEX "cards_match_id_idx" ON "cards"("match_id");

-- CreateIndex
CREATE INDEX "goals_match_id_idx" ON "goals"("match_id");

-- CreateIndex
CREATE INDEX "matches_category_id_round_idx" ON "matches"("category_id", "round");

-- CreateIndex
CREATE INDEX "matches_date_idx" ON "matches"("date");

-- CreateIndex
CREATE INDEX "teams_category_id_idx" ON "teams"("category_id");
