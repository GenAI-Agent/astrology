"use client";

import { useState, useEffect, useMemo, useRef, memo } from "react";
import { X, Loader2, Scale, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, ToolResultMessage } from "@/types/Message";
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

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: RightPanelProps, nextProps: RightPanelProps) => {
  // Always re-render if these important props change
  if (prevProps.isOpen !== nextProps.isOpen) return false;
  // if (prevProps.selectedMessageId !== nextProps.selectedMessageId) return false;
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps.width !== nextProps.width) return false;

  // For chat arrays, only check if length changed or if there's a new chart message
  const prevChatLength = prevProps.currentChat?.length || 0;
  const nextChatLength = nextProps.currentChat?.length || 0;

  if (prevChatLength !== nextChatLength) {
    // Check if the new message is a chart message
    if (nextProps.currentChat && nextProps.currentChat.length > 0) {
      const latestMessage = nextProps.currentChat[nextProps.currentChat.length - 1];
      if (
        latestMessage.type === "tool_result" &&
        latestMessage.tool_name === "get_astro_chart_image"
      ) {
        return false; // Re-render for new chart message
      }
    }
  }

  // For history, only check length change
  if ((prevProps.chatHistory?.length || 0) !== (nextProps.chatHistory?.length || 0)) {
    return false;
  }

  return true; // Don't re-render for other changes
};

export const RightPanelTest = memo(({
  className,
  width = "w-80",
  isOpen,
  onOpenChange,
  chatHistory,
  currentChat,
  selectedMessageId,
  setSelectedMessageId,
}: RightPanelProps) => {
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

  const AstroChart = dynamic(() => import('@/components/AstroChart'), { ssr: false });

  // Track the previous length of currentChat
  const previousChatLengthRef = useRef<number>(currentChat?.length || 0);
  const chartDataRef = useRef<string | undefined>(undefined);
  const [stableFormattedData, setStableFormattedData] = useState<any>(null);

  // Check if there's any chart message in chatHistory or currentChat
  const hasChartMessage = useMemo(() => {
    const allMessages = [...(chatHistory || []), ...(currentChat || [])];
    return allMessages.some((msg): msg is ToolResultMessage =>
      msg.type === "tool_result" &&
      msg.tool_name === "get_astro_chart_image"
    );
  }, [chatHistory?.length, currentChat?.length]);

  // Update chart data only when currentChat length changes
  useEffect(() => {
    const currentLength = currentChat?.length || 0;

    // Only check when length actually changes
    if (currentLength !== previousChatLengthRef.current) {
      previousChatLengthRef.current = currentLength;

      // Check if the latest message is a chart message
      if (currentChat && currentChat.length > 0) {
        const latestMessage = currentChat[currentChat.length - 1];

        if (
          latestMessage.type === "tool_result" &&
          latestMessage.tool_name === "get_astro_chart_image"
        ) {
          // Update chart data only if it's a new chart message
          const toolResultMessage = latestMessage as ToolResultMessage;
          if (toolResultMessage.tool_result !== chartDataRef.current) {
            chartDataRef.current = toolResultMessage.tool_result;
            // Update the stable formatted data
            try {
              setStableFormattedData(JSON.parse(toolResultMessage.tool_result));
            } catch (e) {
              console.error("Failed to parse chart data:", e);
            }
          }
        }
      }
    }
  }, [currentChat]);

  // If no data in ref yet but there's a chart message in history, use it
  useEffect(() => {
    if (!chartDataRef.current && hasChartMessage) {
      const allMessages = [...(chatHistory || []), ...(currentChat || [])];
      const latestChartMessage = allMessages
        .reverse()
        .find((msg): msg is ToolResultMessage =>
          msg.type === "tool_result" &&
          msg.tool_name === "get_astro_chart_image"
        );

      if (latestChartMessage?.tool_result) {
        chartDataRef.current = latestChartMessage.tool_result;
        // Update the stable formatted data
        try {
          setStableFormattedData(JSON.parse(latestChartMessage.tool_result));
        } catch (e) {
          console.error("Failed to parse chart data:", e);
        }
      }
    }
  }, [hasChartMessage, chatHistory, currentChat]);
  console.log("stableFormattedData", stableFormattedData);
  return (
    <div
      className={cn(
        "h-full overflow-y-auto custom-scrollbar transition-all duration-300",
        open ? width : "w-0",
        className,
      )}
    >
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

        {hasChartMessage && (
          <div className="bg-secondary/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Birth Chart</h3>

            {stableFormattedData ? (
              <AstroChart
                id="astro-chart-home"
                data={stableFormattedData as any}
                width={450}
                height={450}
                showAspects={true}
                className="w-full max-w-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-[450px]">
                <Loader2 className="size-4 animate-spin text-zinc-500" />
              </div>
            )}
          </div>
        )}

        <div className="bg-secondary/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Planetary Positions</h3>

          <div className="space-y-2">
            {stableFormattedData && stableFormattedData.planets ? (
              Object.entries({
                Sun: '☉ Sun',
                Moon: '☽ Moon',
                Mercury: '☿ Mercury',
                Venus: '♀ Venus',
                Mars: '♂ Mars',
                Jupiter: '♃ Jupiter',
                Saturn: '♄ Saturn',
                Uranus: '♅ Uranus',
                Neptune: '♆ Neptune',
                Pluto: '♇ Pluto',
                NorthNode: '☊ North Node',
                SouthNode: '☋ South Node'
              }).map(([planetKey, planetSymbol]) => {
                const planetData = stableFormattedData.planets[planetKey];
                if (!planetData || !Array.isArray(planetData) || planetData.length === 0) {
                  return null;
                }

                const degree = planetData[0];
                const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
                const signIndex = Math.floor(degree / 30);
                const signDegree = Math.floor(degree % 30);
                const position = `${zodiacSigns[signIndex]} ${signDegree}°`;

                return (
                  <div key={planetKey} className="flex justify-between text-xs">
                    <span className="text-secondary-foreground/80">{planetSymbol}</span>
                    <span className="text-foreground">{position}</span>
                  </div>
                );
              }).filter(Boolean)
            ) : (
              [
                { planet: '☉ Sun', position: '—' },
                { planet: '☽ Moon', position: '—' },
                { planet: '☿ Mercury', position: '—' },
                { planet: '♀ Venus', position: '—' },
                { planet: '♂ Mars', position: '—' },
                { planet: '♃ Jupiter', position: '—' },
                { planet: '♄ Saturn', position: '—' },
                { planet: '♅ Uranus', position: '—' },
                { planet: '♆ Neptune', position: '—' },
                { planet: '♇ Pluto', position: '—' },
                { planet: '☊ North Node', position: '—' },
                { planet: '☋ South Node', position: '—' }
              ].map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-secondary-foreground/80">{item.planet}</span>
                  <span className="text-foreground">{item.position}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, arePropsEqual);

// 添加 displayName for debugging
RightPanelTest.displayName = 'RightPanelTest';

// 导出一个简单的控制函数
export function useRightPanel(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle, setIsOpen };
}
