"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Loader2, Scale, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, ToolResultMessage } from "@/types/Message";
import { FaSafari } from "react-icons/fa";
import { ToolResult } from "./ToolResult";
import dynamic from "next/dynamic";

// 根据action类型返回对应的中文提示文本
export function getActionText(action?: string): string {
  if (!action) return "處理中";

  switch (action) {
    case "web_search":
      return "正在搜尋";
    case "go_to_url":
      return "正在前往";
    case "scroll_down":
      return "向下滾動";
    default:
      return "處理中";
  }
}

interface RightPanelProps {
  className?: string;
  width?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  chatHistory?: Message[];
  currentChat?: Message[];
  selectedMessageId: string;
  setSelectedMessageId: (id: string) => void;
}

export function RightPanel({
  className,
  width = "w-80",
  isOpen,
  onOpenChange,
  chatHistory,
  currentChat,
  selectedMessageId,
  setSelectedMessageId,
}: RightPanelProps) {
  const [internalOpen, setInternalOpen] = useState(isOpen || false);
  // 添加一个ref来跟踪是否是第一次看到lastToolUseMessage
  const seenLastToolUseMessageRef = useRef(false);

  // 确保内部状态与外部控制同步
  useEffect(() => {
    if (isOpen !== undefined) {
      setInternalOpen(isOpen);
    }
  }, [isOpen]);

  // 使用受控或非受控状态
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // 查找选中的工具使用消息
  const selectedMessage = useMemo(() => {
    // 先在当前聊天中查找
    const currentToolMessages = currentChat?.filter(
      (message) => message.type === "tool_use",
    );
    let found = currentToolMessages?.find(
      (message) =>
        `tool-${message.tool_name}-${message.tool_id}` === selectedMessageId,
    );

    // 如果在当前聊天中没找到，再在历史记录中查找
    if (!found && chatHistory) {
      const historyToolMessages = chatHistory.filter(
        (message) => message.type === "tool_use",
      );
      found = historyToolMessages.find(
        (message) =>
          `tool-${message.tool_name}-${message.tool_id}` === selectedMessageId,
      );
    }

    return found;
  }, [currentChat, chatHistory, selectedMessageId]);

  // 查找最后一条工具使用消息（当没有选中消息时使用）
  const lastToolUseMessage = useMemo(() => {
    if (!currentChat || currentChat.length === 0) {
      if (chatHistory && chatHistory.length > 0) {
        return [...chatHistory].reverse().find((msg) => msg.type === "tool_use");
      }
      return null;
    }
    return [...currentChat].reverse().find((msg) => msg.type === "tool_use");
  }, [currentChat]);

  // 自动打开面板，如果有selectedMessage或第一次发现lastToolUseMessage
  useEffect(() => {
    // 如果有selectedMessage，打开面板
    if (selectedMessage && !open) {
      setOpen(true);
      return;
    }

    // 如果有lastToolUseMessage且是第一次看到它，打开面板
    if (lastToolUseMessage && !seenLastToolUseMessageRef.current) {
      seenLastToolUseMessageRef.current = true;
      if (!open) {
        setOpen(true);
      }
    }
  }, [selectedMessage, lastToolUseMessage, open, setOpen]);

  // 查找匹配的工具结果消息（针对选中的消息）
  const resultMessage = useMemo(() => {
    if (!selectedMessage) return null;

    // 首先在当前聊天记录中查找
    let result = currentChat?.find(
      (msg) =>
        msg.type === "tool_result" &&
        msg.tool_name === selectedMessage.tool_name &&
        msg.tool_id === selectedMessage.tool_id,
    );

    // 如果在当前聊天中没找到，尝试在历史记录中查找
    if (!result && chatHistory) {
      result = chatHistory.find(
        (msg) =>
          msg.type === "tool_result" &&
          msg.tool_name === selectedMessage.tool_name &&
          msg.tool_id === selectedMessage.tool_id,
      );
    }

    return result;
  }, [selectedMessage, currentChat, chatHistory]);

  // 查找最后一条工具结果消息（当没有选中消息时使用）
  const lastResultMessage = useMemo(() => {
    if (!lastToolUseMessage) return null;

    // 首先在当前聊天记录中查找
    let result = currentChat?.find(
      (msg) =>
        msg.type === "tool_result" &&
        msg.tool_name === lastToolUseMessage.tool_name &&
        msg.tool_id === lastToolUseMessage.tool_id,
    );

    // 如果在当前聊天中没找到，尝试在历史记录中查找
    if (!result && chatHistory) {
      result = chatHistory.find(
        (msg) =>
          msg.type === "tool_result" &&
          msg.tool_name === lastToolUseMessage.tool_name &&
          msg.tool_id === lastToolUseMessage.tool_id,
      );
    }

    return result;
  }, [lastToolUseMessage, currentChat, chatHistory]);
  // 内嵌模式 - 作为固定侧边栏
  const AstroChart = dynamic(() => import('@/components/AstroChart'), { ssr: false });
  const latestChartMessage = useMemo(() => currentChat?.slice().reverse().find((msg): msg is ToolResultMessage =>
    msg.type === "tool_result" &&
    msg.tool_name === "get_astro_chart_image"
  ), [currentChat]);

  // Use useRef to track previous chart data and only update when it actually changes
  const previousDataRef = useRef<string | undefined>(undefined);
  const data = useMemo(() => {
    if (latestChartMessage?.tool_result && latestChartMessage.tool_result !== previousDataRef.current) {
      previousDataRef.current = latestChartMessage.tool_result;
      return latestChartMessage.tool_result;
    }
    return previousDataRef.current;
  }, [latestChartMessage]);

  const formattedData = useMemo(() => data ? JSON.parse(data) : null, [data]);
  console.log("formattedData", formattedData);
  return (
    <div
      className={cn(
        "h-full overflow-y-auto custom-scrollbar transition-all duration-300",
        open ? width : "w-0",
        className,
      )}
    >
      {/* {open && (
        <div className="relative h-full w-full">
          <button
            onClick={() => {
              setOpen(false);
              setSelectedMessageId("");
            }}
            className="absolute right-4 top-4 z-10 rounded-sm opacity-70 hover:opacity-100 focus:outline-hidden"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-full overflow-y-auto p-4 rounded-md bg-card">
            <h2 className="mb-2 text-xl font-bold">Astro Agent</h2>
            <div className="flex flex-col items-center justify-center space-y-4 px-2 text-center">
              <div className="flex w-full items-center justify-start gap-2">
                <div className="flex items-center justify-center rounded-sm bg-white/10 p-1">
                  <Scale className="size-8 text-primary" />
                </div>
                {selectedMessage ? (
                  <div className="flex flex-col items-start justify-center">
                    <p className="text-base text-zinc-500 dark:text-zinc-400">
                      Astro Agent 正在使用
                      <span className="inline-block pl-2 font-bold">
                        {selectedMessage?.tool_name}
                      </span>
                    </p>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {JSON.stringify(selectedMessage.tool_args)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-start justify-center">
                    <p className="text-base text-zinc-500">
                      Astro Agent 正在使用
                      <span className="inline-block pl-2 font-bold">
                        {lastToolUseMessage?.tool_name}
                      </span>
                    </p>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {JSON.stringify(lastToolUseMessage?.tool_args)}
                    </span>
                  </div>
                )}
              </div>
              {selectedMessage ? (
                <>
                  {resultMessage && resultMessage.type === "tool_result" ? (
                    <div className="w-full rounded-md">
                      <ToolResult
                        toolName={selectedMessage.tool_name}
                        toolArgs={selectedMessage.tool_args}
                        toolResult={(resultMessage as any).tool_result}
                      />
                    </div>
                  ) : (
                    <div className="w-full rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <Loader2 className="size-4 animate-spin text-zinc-500" />
                      </div>
                      <div className="mt-2 flex items-center justify-center rounded-md bg-black/60 p-4 dark:bg-zinc-800">
                        <p className="text-sm text-zinc-500">
                          處理中...
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {lastToolUseMessage &&
                    lastResultMessage &&
                    lastResultMessage.type === "tool_result" && (
                      <div className="w-full rounded-md">
                        <ToolResult
                          toolName={lastToolUseMessage.tool_name}
                          toolArgs={
                            lastToolUseMessage.tool_args
                          }
                          toolResult={(lastResultMessage as any).tool_result}
                        />
                      </div>
                    )}

                  {lastToolUseMessage && !lastResultMessage && (
                    <div className="w-full rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-400">
                          {lastToolUseMessage.tool_name}
                        </p>
                        <Loader2 className="size-4 animate-spin text-zinc-500" />
                      </div>
                      <div className="mt-2 flex items-center justify-center rounded-md bg-black/60 p-4 dark:bg-zinc-800">
                        <p className="text-sm text-zinc-500">
                          處理中...
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )} */}
      <div className="p-6 space-y-6">
        <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Profile</h3>
            <button
              // onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
              title="Edit Profile"
            >
              <Pencil className="w-4 h-4 text-secondary-foreground/60" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-secondary-foreground/60">Name: </span>
              <span className="text-foreground">{"userProfile?.name"}</span>
            </div>

            <div>
              <span className="text-secondary-foreground/60">Birth Date: </span>
              <span className="text-foreground">{"userProfile?.birthDate"}</span>
            </div>

            <div>
              <span className="text-secondary-foreground/60">Birth Time: </span>
              <span className="text-foreground">{"userProfile?.birthTime || '沒資料'"}</span>
            </div>

            <div>
              <span className="text-secondary-foreground/60">Birth Location: </span>
              <span className="text-foreground">{"userProfile?.birthLocation"}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">Daily Horoscope</h4>
            <p className="text-xs text-secondary-foreground/80">
              {"userProfile?.dailyHoroscope"}
            </p>
          </div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Birth Chart</h3>

          {formattedData ? <AstroChart
            id="astro-chart-home"
            data={formattedData as any}
            width={450}
            height={450}
            showAspects={true}
            className="w-full max-w-lg"
          /> : <div className="flex items-center justify-center h-full">
            <Loader2 className="size-4 animate-spin text-zinc-500" />
          </div>}
        </div>

        <div className="bg-secondary/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Planetary Positions</h3>

          <div className="space-y-2">
            {[
              { planet: '☉ Sun', position: 'Capricorn 10°' },
              { planet: '☽ Moon', position: 'Pisces 25°' },
              { planet: '☿ Mercury', position: 'Aquarius 5°' },
              { planet: '♀ Venus', position: 'Sagittarius 20°' },
              { planet: '♂ Mars', position: 'Aries 15°' },
              { planet: '♃ Jupiter', position: 'Gemini 8°' },
              { planet: '♄ Saturn', position: 'Virgo 12°' },
              { planet: '♅ Uranus', position: 'Scorpio 18°' },
              { planet: '♆ Neptune', position: 'Capricorn 3°' },
              { planet: '♇ Pluto', position: 'Libra 22°' },
              { planet: '☊ North Node', position: 'Cancer 7°' },
              { planet: '☋ South Node', position: 'Capricorn 7°' }
            ].map((item, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-secondary-foreground/80">{item.planet}</span>
                <span className="text-foreground">{item.position}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 导出一个简单的控制函数
export function useRightPanel(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle, setIsOpen };
}
