import LoadingText from "@/components/LoadingText";
import { auth } from "@/auth";
import { Suspense } from "react";
import clientPromise from "@/lib/mongodb";
import { SessionHistory } from "@/types/Message";
import AstrologyClient from "./client";
import { UserData } from "@/types/User";
import { Message } from "@/types/Message";

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

    // Try to get chat history from MongoDB
    try {
      const client = await clientPromise;
      const db = client.db("Lens");
      
      const mongoHistory = await db.collection("User_History_Astro").findOne({
        userId: user.id,
        sessionId: sessionId
      });

      if (mongoHistory) {
        chatHistory = {
          sessionId: mongoHistory.sessionId,
          userId: mongoHistory.userId,
          title: mongoHistory.title || "",
          messages: mongoHistory.messages || [],
          createdAt: mongoHistory.createdAt || new Date(),
          updatedAt: mongoHistory.updatedAt || new Date()
        };
      }
    } catch (error) {
      console.error("Failed to get chat history from MongoDB:", error);
      chatHistory = null;
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