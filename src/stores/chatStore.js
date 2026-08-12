import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

export const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      isLoading: false,
      error: null,

      setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

      fetchConversations: async (userId) => {
        if (!userId) return;
        set({ isLoading: true });
        try {
          const convs = await api.chat.getConversations(userId);
          set({ conversations: convs, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: err.message });
        }
      },

      fetchMessages: async (conversationId) => {
        try {
          const messages = await api.chat.getMessages(conversationId);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? { ...c, messages } : c
            ),
            currentConversation: state.currentConversation?.id === conversationId
              ? { ...state.currentConversation, messages }
              : state.currentConversation,
          }));
          return messages;
        } catch (err) {
          set({ error: err.message });
          return [];
        }
      },

      createNewConversation: async (userId, title = 'New Chat') => {
        try {
          const result = await api.chat.createConversation(userId, title);
          const greetingMsg = {
            id: `msg-greeting-${Date.now()}`,
            role: 'assistant',
            content: 'Hello! Main SONIC AI hoon. Aaj aapko kya karna hai?',
            timestamp: new Date().toISOString(),
          };
          const newConv = {
            ...result,
            message_count: 1,
            preview: 'Hello! Main SONIC AI hoon. Aaj aapko kya karna hai?',
            messages: [greetingMsg],
          };
          set((state) => ({
            conversations: [newConv, ...state.conversations],
            currentConversation: newConv,
          }));
          return newConv;
        } catch (err) {
          set({ error: err.message });
          return null;
        }
      },

      sendMessage: async (userId, conversationId, content) => {
        const userMessage = {
          id: `temp-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          const update = (c) =>
            c.id === conversationId
              ? { ...c, messages: [...(c.messages || []), userMessage] }
              : c;
          return {
            conversations: state.conversations.map(update),
            currentConversation: state.currentConversation?.id === conversationId
              ? update(state.currentConversation)
              : state.currentConversation,
          };
        });

        try {
          const result = await api.chat.sendMessage(userId, conversationId, content);
          const aiMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
          };
          set((state) => {
            const update = (c) =>
              c.id === conversationId
                ? { ...c, messages: [...(c.messages || []), aiMessage], preview: (result.response || '').slice(0, 80) }
                : c;
            return {
              conversations: state.conversations.map(update),
              currentConversation: state.currentConversation?.id === conversationId
                ? update(state.currentConversation)
                : state.currentConversation,
            };
          });
          return aiMessage;
        } catch (err) {
          set({ error: err.message });
          const errorMsg = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Error: ${err.message}`,
            timestamp: new Date().toISOString(),
          };
          set((state) => {
            const update = (c) =>
              c.id === conversationId
                ? { ...c, messages: [...(c.messages || []), errorMsg] }
                : c;
            return {
              conversations: state.conversations.map(update),
              currentConversation: state.currentConversation?.id === conversationId
                ? update(state.currentConversation)
                : state.currentConversation,
            };
          });
          return null;
        }
      },

      deleteConversation: async (id) => {
        try {
          await api.chat.deleteConversation(id);
          set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
            currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
          }));
        } catch (err) {
          set({ error: err.message });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sonic-chat',
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);