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
  freeTier?: boolean;
  providerUrl?: string;
}

// Health status for a model
export interface ModelHealth {
  modelId: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latencyMs: number;
  lastChecked: Date;
  errorRate: number;
  consecutiveFailures: number;
}

interface ModelStore {
  models: ModelInfo[];
  selectedModel: string;
  isLoading: boolean;
  modelHealth: ModelHealth[];
  autoSwitch: boolean;
  fallbackChain: string[];

  // Actions
  setModels: (models: ModelInfo[]) => void;
  setSelectedModel: (modelId: string) => void;
  toggleModel: (modelId: string) => void;
  getSelectedModel: () => ModelInfo | undefined;
  fetchModels: () => Promise<void>;
  checkModelHealth: () => Promise<void>;
  getBestAvailableModel: () => ModelInfo;
  setAutoSwitch: (enabled: boolean) => void;
}

// Default models - kept in sync with /api/models route
// These are the latest FREE models available as of June 2026
const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'auto',
    name: 'Auto (Best Available)',
    provider: 'multi',
    capabilities: ['chat', 'code', 'agent', 'search', 'reasoning', 'vision'],
    speed: 'optimal',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Automatically routes to the best free model for your task',
    freeTier: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    capabilities: ['chat', 'code', 'vision', 'search', 'reasoning'],
    speed: 'fast',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Google\'s 1M context workhorse — free on AI Studio',
    freeTier: true,
    providerUrl: 'https://ai.google.dev/',
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'google',
    capabilities: ['chat', 'code', 'vision', 'reasoning'],
    speed: 'fast',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Google\'s latest Flash — improved reasoning, 1M context, free',
    freeTier: true,
    providerUrl: 'https://ai.google.dev/',
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'fast',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'DeepSeek\'s latest 1.6T MoE — 1M context, free API',
    freeTier: true,
    providerUrl: 'https://api.deepseek.com/',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Deep reasoning for complex problems — free API tier',
    freeTier: true,
    providerUrl: 'https://api.deepseek.com/',
  },
  {
    id: 'llama-4-scout-17b',
    name: 'Llama 4 Scout 17B',
    provider: 'meta',
    capabilities: ['chat', 'code', 'vision'],
    speed: 'ultra',
    contextWindow: 10000000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Meta\'s 10M context multimodal — free via Groq & Cerebras',
    freeTier: true,
    providerUrl: 'https://groq.com/',
  },
  {
    id: 'llama-4-maverick-17b',
    name: 'Llama 4 Maverick 17B',
    provider: 'meta',
    capabilities: ['chat', 'code', 'vision'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Meta\'s workhorse MoE — free via Groq & Together AI',
    freeTier: true,
    providerUrl: 'https://groq.com/',
  },
  {
    id: 'qwen3-coder-480b',
    name: 'Qwen3 Coder 480B',
    provider: 'alibaba',
    capabilities: ['chat', 'code', 'agent', 'reasoning'],
    speed: 'medium',
    contextWindow: 256000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Best free coding model — agentic, 480B MoE, free via OpenRouter',
    freeTier: true,
    providerUrl: 'https://openrouter.ai/',
  },
  {
    id: 'qwen3.7-max',
    name: 'Qwen3.7 Max',
    provider: 'alibaba',
    capabilities: ['chat', 'code', 'reasoning', 'vision'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Alibaba\'s flagship agent model — versatile for code & automation',
    freeTier: true,
    providerUrl: 'https://openrouter.ai/',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Mistral\'s flagship — free Experiment tier on La Plateforme',
    freeTier: true,
    providerUrl: 'https://console.mistral.ai/',
  },
  {
    id: 'codestral',
    name: 'Codestral',
    provider: 'mistral',
    capabilities: ['chat', 'code'],
    speed: 'fast',
    contextWindow: 256000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Mistral\'s open-weight code model — free tier',
    freeTier: true,
    providerUrl: 'https://console.mistral.ai/',
  },
  {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'groq',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'ultra',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Open-source GPT on Groq LPU — blazing fast, free',
    freeTier: true,
    providerUrl: 'https://groq.com/',
  },
  {
    id: 'cerebras-glm-4.7',
    name: 'GLM 4.7 (Cerebras)',
    provider: 'cerebras',
    capabilities: ['chat', 'code'],
    speed: 'ultra',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Zhipu GLM 4.7 on Cerebras wafer-scale — fastest inference, free',
    freeTier: true,
    providerUrl: 'https://cerebras.ai/',
  },
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    capabilities: ['chat', 'code', 'search'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Cohere\'s RAG flagship — built-in search, free trial key',
    freeTier: true,
    providerUrl: 'https://dashboard.cohere.com/',
  },
  {
    id: 'deepseek-r1-sambanova',
    name: 'DeepSeek R1 (SambaNova)',
    provider: 'sambanova',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'DeepSeek R1 on SambaNova RDU — fast reasoning, free credits',
    freeTier: true,
    providerUrl: 'https://sambanova.ai/',
  },
  {
    id: 'openrouter-free',
    name: 'OpenRouter Free Router',
    provider: 'openrouter',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0,
    enabled: true,
    description: 'Aggregates 26+ free models — auto-selects, zero cost',
    freeTier: true,
    providerUrl: 'https://openrouter.ai/',
  },
];

// Default fallback chain — ordered by reliability/speed for auto-switching
const DEFAULT_FALLBACK_CHAIN: string[] = [
  'gemini-2.5-flash',
  'deepseek-v4-flash',
  'gemini-3-flash',
  'llama-4-scout-17b',
  'qwen3-coder-480b',
  'deepseek-r1',
  'mistral-large',
  'codestral',
  'command-r-plus',
  'openrouter-free',
];

export const useModelStore = create<ModelStore>((set, get) => ({
  models: DEFAULT_MODELS,
  selectedModel: 'auto',
  isLoading: false,
  modelHealth: [],
  autoSwitch: true,
  fallbackChain: DEFAULT_FALLBACK_CHAIN,

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

  checkModelHealth: async () => {
    try {
      const res = await fetch('/api/model-health');
      if (res.ok) {
        const data = await res.json();
        const healthEntries: ModelHealth[] = (data.models || []).map(
          (m: { id: string; status: string; latencyMs: number; lastChecked: string; errorRate: number; consecutiveFailures?: number }) => ({
            modelId: m.id,
            status: (m.status === 'healthy' || m.status === 'degraded' || m.status === 'down' || m.status === 'unknown')
              ? m.status
              : 'unknown',
            latencyMs: m.latencyMs || 0,
            lastChecked: new Date(m.lastChecked),
            errorRate: m.errorRate || 0,
            consecutiveFailures: m.consecutiveFailures || 0,
          })
        );

        // Also store fallback chain from API response
        const fallbackOrder: string[] = data.fallbackOrder || DEFAULT_FALLBACK_CHAIN;

        set({ modelHealth: healthEntries, fallbackChain: fallbackOrder });

        // If auto-switch is enabled, check if selected model is down and switch
        const state = get();
        if (state.autoSwitch && state.selectedModel !== 'auto') {
          const selectedHealth = healthEntries.find(
            (h) => h.modelId === state.selectedModel
          );
          if (selectedHealth && selectedHealth.status === 'down') {
            // Auto-switch to best available
            const best = get().getBestAvailableModel();
            if (best && best.id !== state.selectedModel) {
              set({ selectedModel: best.id });
            }
          }
        }
      }
    } catch {
      // Health check failed — keep existing health data
    }
  },

  getBestAvailableModel: () => {
    const state = get();
    const enabledModels = state.models.filter((m) => m.enabled && m.id !== 'auto');

    // Try fallback chain first
    for (const fallbackId of state.fallbackChain) {
      const health = state.modelHealth.find((h) => h.modelId === fallbackId);
      const model = enabledModels.find((m) => m.id === fallbackId);
      if (model && health && (health.status === 'healthy' || health.status === 'degraded')) {
        return model;
      }
    }

    // If no healthy model in fallback chain, try any enabled healthy model
    for (const model of enabledModels) {
      const health = state.modelHealth.find((h) => h.modelId === model.id);
      if (health && (health.status === 'healthy' || health.status === 'degraded')) {
        return model;
      }
    }

    // If no health data at all, return first enabled model
    if (enabledModels.length > 0) {
      return enabledModels[0];
    }

    // Absolute fallback — return the 'auto' model
    return state.models[0];
  },

  setAutoSwitch: (enabled) => set({ autoSwitch: enabled }),
}));
