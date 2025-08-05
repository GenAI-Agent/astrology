-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('human', 'ai');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('text', 'tool_use', 'tool_result', 'choose_agent');

-- CreateTable
CREATE TABLE "public"."astro_users" (
    "id" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "birth_time" TIME,
    "birth_location" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "timezone" TEXT,
    "today_divination" JSONB,
    "divination_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "astro_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "message_type" "public"."MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "tool_id" TEXT,
    "tool_name" TEXT,
    "tool_args" JSONB,
    "tool_result" TEXT,
    "sources" JSONB,
    "prompts" JSONB,
    "score" SMALLINT,
    "note" TEXT,
    "message_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "astro_users_divination_date_idx" ON "public"."astro_users"("divination_date");

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_session_id_key" ON "public"."chat_sessions"("session_id");

-- CreateIndex
CREATE INDEX "chat_sessions_user_id_idx" ON "public"."chat_sessions"("user_id");

-- CreateIndex
CREATE INDEX "chat_sessions_session_id_idx" ON "public"."chat_sessions"("session_id");

-- CreateIndex
CREATE INDEX "chat_sessions_created_at_idx" ON "public"."chat_sessions"("created_at");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_idx" ON "public"."chat_messages"("session_id");

-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "public"."chat_messages"("created_at");

-- CreateIndex
CREATE INDEX "chat_messages_session_id_message_order_idx" ON "public"."chat_messages"("session_id", "message_order");

-- AddForeignKey
ALTER TABLE "public"."chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."astro_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;
