import { SessionHistory } from "@/types/Message";
import axios from "axios";
import { create } from "zustand";

interface AstroChatState {
  chatSessions: SessionHistory[];
  currentSession: SessionHistory | null;
  isLoading: boolean;
  error: string | null;

  // 獲取該用戶的所有聊天會話
  fetchAllChatSessions: (userId: string) => Promise<void>;
  
  // 獲取特定會話的詳細信息（包含所有訊息）
  fetchChatSession: (userId: string, sessionId: string) => Promise<void>;
  
  // 刪除特定會話
  deleteChatSession: (userId: string, sessionId: string) => Promise<void>;
  
  // 清除錯誤狀態
  clearError: () => void;
  
  // 清除當前會話
  clearCurrentSession: () => void;
}

export const useChatStore = create<AstroChatState>((set, get) => ({
  chatSessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  fetchAllChatSessions: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await axios.get(`/api/chat/sessions?userId=${userId}`);
      const data = response.data;
      
      if (data.success) {
        // 按創建時間排序，最新的在前面
        const sortedSessions = data.data.sort(
          (a: SessionHistory, b: SessionHistory) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );
        
        set({ chatSessions: sortedSessions });
      } else {
        set({ error: data.message || "Failed to fetch chat sessions" });
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch chat sessions" 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChatSession: async (userId: string, sessionId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await axios.get(
        `/api/chat/session?userId=${userId}&sessionId=${sessionId}`
      );
      const data = response.data;
      
      if (data.success) {
        // 確保訊息按順序排列
        const session = data.data;
        if (session.messages) {
          session.messages.sort((a: any, b: any) => a.messageOrder - b.messageOrder);
        }
        
        set({ currentSession: session });
      } else {
        set({ error: data.message || "Failed to fetch chat session" });
      }
    } catch (error) {
      console.error("Error fetching chat session:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch chat session" 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteChatSession: async (userId: string, sessionId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await axios.delete(
        `/api/chat/session?userId=${userId}&sessionId=${sessionId}`
      );
      const data = response.data;
      
      if (data.success) {
        // 從本地狀態中移除已刪除的會話
        set((state) => ({
          chatSessions: state.chatSessions.filter(
            (session) => session.sessionId !== sessionId
          ),
          // 如果刪除的是當前會話，清除當前會話
          currentSession: state.currentSession?.sessionId === sessionId 
            ? null 
            : state.currentSession
        }));
      } else {
        set({ error: data.message || "Failed to delete chat session" });
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to delete chat session" 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentSession: () => {
    set({ currentSession: null });
  },
}));