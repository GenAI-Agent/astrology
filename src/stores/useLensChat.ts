import { SessionHistory } from "@/types/Message";
import axios from "axios";
import { create } from "zustand";

interface LensChatState {
  lensChatHistories: SessionHistory[];
  lensChatHistory: SessionHistory | null;
  isLoading: boolean;
  fetchLensChatHistory: (userId: string, sessionId: string) => Promise<void>;
  fetchAllLensChatHistory: (userId: string) => Promise<void>;
  deleteLensChatHistory: (userId: string, sessionId: string) => void;
}

export const useLensChat = create<LensChatState>((set, get) => ({
  lensChatHistories: [],
  lensChatHistory: null,
  isLoading: false,
  fetchLensChatHistory: async (userId: string, sessionId?: string) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(
        `/api/chat?userId=${userId}${
          sessionId ? `&sessionId=${sessionId}` : ""
        }`
      );
      const data = response.data;
      if (data.code === 200) {
        set((state) => ({
          lensChatHistory: data.data || null,
        }));
      }
    } catch (error) {
      console.error("Error fetching lens chat history:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteLensChatHistory: async (userId: string, sessionId: string) => {
    try {
      set({ isLoading: true });
      const response = await axios.delete(
        `/api/chat?userId=${userId}&sessionId=${sessionId}`
      );
      const data = response.data;
      if (data.code === 200) {
        set((state) => {
          const newLensChatHistories = state.lensChatHistories.filter(
            (history) => history.sessionId !== sessionId
          );
          return {
            lensChatHistories: newLensChatHistories,
            lensChatHistory: null,
          };
        });
      }
    } catch (error) {
      console.error("Error deleting lens chat history:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllLensChatHistory: async (userId: string) => {
    try {
      set({ isLoading: true });
      const response = await axios.get(`/api/chat?userId=${userId}`);
      const data = response.data;
      if (data.code === 200) {
        const historiesOrder = data.data.sort(
          (a: SessionHistory, b: SessionHistory) =>
            new Date(b.createdAt || new Date()).getTime() -
            new Date(a.createdAt || new Date()).getTime()
        );

        set({ lensChatHistories: historiesOrder || [] });
      }
    } catch (error) {
      console.error("Error fetching all lens chat histories:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
