/*
  Warnings:

  - Made the column `birth_date` on table `astro_users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."astro_users" ALTER COLUMN "birth_date" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."astro_dataset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prompt_template" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "tool_result" TEXT NOT NULL,
    "user_input" TEXT NOT NULL,
    "model_answer" TEXT NOT NULL,
    "tristan_answer" TEXT NOT NULL,
    "model_score" DOUBLE PRECISION,
    "tristan_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "astro_dataset_pkey" PRIMARY KEY ("id")
);
