"use client";

import { useEffect, useRef, useState } from "react";
import ChatSection from "@/components/chat/Section";
// import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import LoadingText from "@/components/LoadingText";
import EditableTitle from "@/components/EditableTitle";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { SessionHistory } from "@/types/Message";
import { UserData } from "@/types/User";
import { useChatStore } from "@/stores/useChatStore";

export default function AstrologyClient({
  sessionId,
  user,
  chatHistory,
}: {
  sessionId: string;
  user: UserData;
  chatHistory: SessionHistory;
}) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [currentTitle, setCurrentTitle] = useState(chatHistory?.title || "");
  const [isInitializing, setIsInitializing] = useState(true);
  const { fetchAllChatSessions } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      fetchAllChatSessions(user.id);
    }
  }, [user?.id, fetchAllChatSessions]);

  const {
    handleChat,
    handleStopChat,
    currentChat,
    setCurrentChat,
    isChatLoading,
    isStreaming,
  } = useChat({
    userId: user.id,
    sessionId,
    setQuery,
    chatContainerRef: chatContainerRef as React.RefObject<HTMLDivElement>,
    apiPath: "astro_agent",
    needLogin: false,
  });

  const handleSend = async (message: string) => {
    await handleChat(message);
  };

  // 使用自定义滚动Hook
  // const { shouldAutoScroll, scrollToBottom } = useScrollToBottom({
  //   threshold: 50,
  //   isStreaming,
  //   dependencies: [currentChat?.length],
  //   containerRef: chatContainerRef as React.RefObject<HTMLDivElement>,
  // });

  const handleTitleUpdate = (newTitle: string) => {
    setCurrentTitle(newTitle);
  };

  // useEffect(() => {
  //   if (isStreaming || shouldAutoScroll) {
  //     setTimeout(() => {
  //       scrollToBottom();
  //     }, 100);
  //   }
  // }, [isStreaming, currentChat?.length, scrollToBottom, shouldAutoScroll]);

  // 新增初始化邏輯
  useEffect(() => {
    const initializeChat = async () => {
      if (!sessionId) return;

      try {
        // 如果已經有聊天歷史，不需要初始化
        if (chatHistory) {
          setIsInitializing(false);
          return;
        }

        // 從 sessionStorage 獲取初始聊天數據
        const initialChatData = sessionStorage.getItem(
          `initial_chat_${sessionId}`,
        );
        if (!initialChatData) {
          // 如果沒有初始數據且沒有 chatHistory，跳回主頁
          router.push(
            `/chat/?error=chat_history_not_found&sessionId=${sessionId}`,
          );
          return;
        }

        // 解析初始聊天數據
        const chatData = JSON.parse(initialChatData);

        // 保存到數據庫
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatData),
        });
        setCurrentTitle(chatData.title);

        if (!response.ok) {
          throw new Error("保存聊天記錄失敗");
        }
        // 清理 sessionStorage
        sessionStorage.removeItem(`initial_chat_${sessionId}`);
      } catch (error) {
        console.error("初始化聊天失敗:", error);
        toast.error("載入聊天記錄時發生錯誤");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [
    sessionId,
    user.id,
    chatHistory,
    router,
    setCurrentChat,
  ]);

  // 修改現有的 prompt 處理邏輯
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      sessionId &&
      !isChatLoading &&
      user.id &&
      !isInitializing // 確保初始化完成
    ) {
      const storedPrompt = sessionStorage.getItem(`prompt_${sessionId}`);
      if (storedPrompt) {
        const timer = setTimeout(() => {
          handleSend(storedPrompt);
          sessionStorage.removeItem(`prompt_${sessionId}`);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [
    sessionId,
    isChatLoading,
    handleSend,
    user.id,
    isInitializing, // 添加這個依賴項
  ]);

  return (
    <div className="relative flex h-screen flex-col">
      {isInitializing ? (
        <div className="flex h-full items-center justify-center">
          <LoadingText />
        </div>
      ) : (
        <div className="mx-auto flex h-full w-full px-2 sm:px-4 gap-2 sm:gap-4 flex-1">
          <ChatSection
            isToolPanel={true}
            chatHistory={chatHistory?.messages || []}
            currentChat={currentChat}
            isLoading={isChatLoading || isStreaming}
            isStreaming={isStreaming}
            handleStopChat={handleStopChat}
            query={query}
            onChange={(e) => setQuery(e.target.value)}
            chatRef={chatContainerRef as React.RefObject<HTMLDivElement>}
            handleChat={handleSend}
            editableTitle={
              <EditableTitle
                title={currentTitle}
                sessionId={sessionId}
                userId={user.id}
                onTitleUpdate={handleTitleUpdate}
              />
            }
          />
        </div>
      )}
    </div>
  );
}