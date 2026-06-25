import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokens?: number;
  cost?: number;
  duration?: number;
  sources?: { url: string; name: string; snippet: string }[];
  toolCalls?: { name: string; args: string; result: string }[];
  isStreaming?: boolean;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  model: string;
  mode: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  isStreaming: boolean;
  streamingContent: string;

  // Actions
  createChat: (model?: string, mode?: string) => string;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  appendStreamContent: (chatId: string, messageId: string, chunk: string) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  deleteChat: (id: string) => void;
  clearChats: () => void;
  getActiveChat: () => Chat | undefined;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChatId: null,
  isStreaming: false,
  streamingContent: '',

  createChat: (model = 'auto', mode = 'chat') => {
    const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const chat: Chat = {
      id,
      title: 'New Chat',
      model,
      mode,
      messages: [],
      createdAt: new Date(),
    };
    set((state) => ({
      chats: [chat, ...state.chats],
      activeChatId: id,
    }));
    return id;
  },

  setActiveChat: (id) => set({ activeChatId: id }),

  addMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      ),
    })),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
            }
          : chat
      ),
    })),

  appendStreamContent: (chatId, messageId, chunk) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ),
            }
          : chat
      ),
    })),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  deleteChat: (id) =>
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== id),
      activeChatId:
        state.activeChatId === id
          ? state.chats[0]?.id || null
          : state.activeChatId,
    })),

  clearChats: () => set({ chats: [], activeChatId: null }),

  getActiveChat: () => {
    const state = get();
    return state.chats.find((chat) => chat.id === state.activeChatId);
  },
}));
