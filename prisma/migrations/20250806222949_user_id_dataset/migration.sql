/*
  Warnings:

  - Added the required column `user_id` to the `astro_dataset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."astro_dataset" ADD COLUMN     "user_id" TEXT NOT NULL,
ALTER COLUMN "tristan_answer" DROP NOT NULL;
