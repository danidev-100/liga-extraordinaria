-- CreateTable
CREATE TABLE "round_notifications" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "round_notifications_category_id_round_key" ON "round_notifications"("category_id", "round");

-- AddForeignKey
ALTER TABLE "round_notifications" ADD CONSTRAINT "round_notifications_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
