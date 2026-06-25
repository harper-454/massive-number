import { create } from 'zustand';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  speed: string;
  contextWindow: number;
  costPer1kTokens: number;
  enabled: boolean;
  description: string;
}

interface ModelStore {
  models: ModelInfo[];
  selectedModel: string;
  isLoading: boolean;

  // Actions
  setModels: (models: ModelInfo[]) => void;
  setSelectedModel: (modelId: string) => void;
  toggleModel: (modelId: string) => void;
  getSelectedModel: () => ModelInfo | undefined;
  fetchModels: () => Promise<void>;
}

const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'auto',
    name: 'Auto (Best Available)',
    provider: 'multi',
    capabilities: ['chat', 'code', 'agent', 'search'],
    speed: 'optimal',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    enabled: true,
    description: 'Automatically selects the best model for your task',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: ['chat', 'code', 'vision'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0.005,
    enabled: true,
    description: 'OpenAI\'s flagship multimodal model',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    capabilities: ['chat', 'code', 'agent', 'vision'],
    speed: 'fast',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    enabled: true,
    description: 'Anthropic\'s balanced model for coding and analysis',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    capabilities: ['chat', 'code', 'vision', 'search'],
    speed: 'fast',
    contextWindow: 1000000,
    costPer1kTokens: 0.002,
    enabled: true,
    description: 'Google\'s 1M context window model',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0.001,
    enabled: true,
    description: 'Deep reasoning for complex problems',
  },
  {
    id: 'llama-4',
    name: 'Llama 4 Maverick',
    provider: 'meta',
    capabilities: ['chat', 'code'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0.0005,
    enabled: true,
    description: 'Meta\'s open-source powerhouse',
  },
  {
    id: 'qwen3',
    name: 'Qwen3 235B',
    provider: 'alibaba',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0.001,
    enabled: true,
    description: 'Alibaba\'s multilingual reasoning model',
  },
];

export const useModelStore = create<ModelStore>((set, get) => ({
  models: DEFAULT_MODELS,
  selectedModel: 'auto',
  isLoading: false,

  setModels: (models) => set({ models }),
  setSelectedModel: (modelId) => set({ selectedModel: modelId }),
  toggleModel: (modelId) =>
    set((state) => ({
      models: state.models.map((m) =>
        m.id === modelId ? { ...m, enabled: !m.enabled } : m
      ),
    })),

  getSelectedModel: () => {
    const state = get();
    return state.models.find((m) => m.id === state.selectedModel);
  },

  fetchModels: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          set({ models: data.models });
        }
      }
    } catch {
      // Keep default models on error
    } finally {
      set({ isLoading: false });
    }
  },
}));
