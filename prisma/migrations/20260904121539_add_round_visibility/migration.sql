-- CreateTable
CREATE TABLE "round_visibilities" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_visibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "round_visibilities_category_id_round_key" ON "round_visibilities"("category_id", "round");

-- AddForeignKey
ALTER TABLE "round_visibilities" ADD CONSTRAINT "round_visibilities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
