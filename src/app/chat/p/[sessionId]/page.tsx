import LoadingText from "@/components/LoadingText";
import { auth } from "@/auth";
import { Suspense } from "react";
import { PrismaClient } from '@/generated/project-client';
import { SessionHistory } from "@/types/Message";
import AstrologyClient from "./client";
import { UserData } from "@/types/User";
import { Message } from "@/types/Message";

const prisma = new PrismaClient();

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  const user = session?.user as UserData;
  const { sessionId } = await params;

  let chatHistory: SessionHistory | null = null;

  try {
    if (!user) {
      return (
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <p className="text-xl text-destructive">Please login first</p>
        </div>
      );
    }

    // Try to get chat history from PostgreSQL, but don't force it to exist here
    try {
      const chatSession = await prisma.chatSession.findFirst({
        where: {
          sessionId: sessionId,
          userId: user.id,
        },
        include: {
          messages: {
            orderBy: {
              messageOrder: 'asc'
            }
          }
        }
      });

      if (chatSession) {
        const messages = chatSession.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          type: msg.messageType,
          messageOrder: msg.messageOrder,
          createdAt: msg.createdAt,
          score: msg.score,
          note: msg.note,
          // Tool-related fields
          ...(msg.toolId && {
            tool_id: msg.toolId,
            tool_name: msg.toolName,
            tool_args: msg.toolArgs,
            tool_result: msg.toolResult
          }),
          // Text-related fields
          ...(msg.sources && { sources: msg.sources }),
          ...(msg.prompts && { prompts: msg.prompts }),
          // choose_agent related fields
          ...(msg.messageType === 'choose_agent' && {
            agent: (msg.toolArgs as any)?.agent || ''
          })
        }));

        chatHistory = {
          sessionId: chatSession.sessionId,
          userId: chatSession.userId,
          title: chatSession.title,
          messages: messages as Message[],
          createdAt: chatSession.createdAt,
          updatedAt: chatSession.updatedAt
        };
      }
    } catch (error) {
      console.error("Failed to get chat history:", error);
      chatHistory = null;
    } finally {
      await prisma.$disconnect();
    }

    // Note: Even if chatHistory is not found, don't redirect
    // Let the client component handle initialization logic
  } catch (error) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-xl text-red-500">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    );
  }

  // Render page, pass chatHistory to client component (even if null)
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <LoadingText />
        </div>
      }
    >
      <AstrologyClient
        sessionId={sessionId}
        user={user}
        chatHistory={chatHistory as SessionHistory}
      />
    </Suspense>
  );
}