import { create } from 'zustand';

export interface AgentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
  duration?: number;
}

export interface AgentRun {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  steps: AgentStep[];
  model: string;
  result?: string;
  tokens: number;
  cost: number;
  duration: number;
  createdAt: Date;
}

interface AgentStore {
  agents: AgentRun[];
  activeAgentId: string | null;
  isRunning: boolean;

  // Actions
  createAgent: (name: string, description?: string, model?: string) => string;
  setActiveAgent: (id: string | null) => void;
  updateAgentStep: (agentId: string, stepIndex: number, updates: Partial<AgentStep>) => void;
  completeAgent: (agentId: string, result: string, tokens: number, cost: number, duration: number) => void;
  errorAgent: (agentId: string, error: string) => void;
  deleteAgent: (id: string) => void;
  getActiveAgent: () => AgentRun | undefined;
  setIsRunning: (running: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: [],
  activeAgentId: null,
  isRunning: false,

  createAgent: (name, description, model = 'auto') => {
    const id = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const agent: AgentRun = {
      id,
      name,
      description,
      status: 'pending',
      steps: [
        { id: 'step-1', name: 'Analyzing requirements', status: 'pending' },
        { id: 'step-2', name: 'Searching codebase patterns', status: 'pending' },
        { id: 'step-3', name: 'Generating implementation plan', status: 'pending' },
        { id: 'step-4', name: 'Writing code', status: 'pending' },
        { id: 'step-5', name: 'Running validation', status: 'pending' },
        { id: 'step-6', name: 'Applying optimizations', status: 'pending' },
      ],
      model,
      tokens: 0,
      cost: 0,
      duration: 0,
      createdAt: new Date(),
    };
    set((state) => ({
      agents: [agent, ...state.agents],
      activeAgentId: id,
    }));
    return id;
  },

  setActiveAgent: (id) => set({ activeAgentId: id }),

  updateAgentStep: (agentId, stepIndex, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              status: 'running',
              steps: agent.steps.map((step, i) =>
                i === stepIndex ? { ...step, ...updates } : step
              ),
            }
          : agent
      ),
    })),

  completeAgent: (agentId, result, tokens, cost, duration) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, status: 'completed', result, tokens, cost, duration }
          : agent
      ),
      isRunning: false,
    })),

  errorAgent: (agentId, error) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, status: 'error', result: error }
          : agent
      ),
      isRunning: false,
    })),

  deleteAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
      activeAgentId:
        state.activeAgentId === id ? null : state.activeAgentId,
    })),

  getActiveAgent: () => {
    const state = get();
    return state.agents.find((a) => a.id === state.activeAgentId);
  },

  setIsRunning: (running) => set({ isRunning: running }),
}));
