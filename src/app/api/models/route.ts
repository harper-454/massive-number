import { NextResponse } from 'next/server';

const MODELS = [
  {
    id: 'auto',
    name: 'Auto (Best Available)',
    provider: 'multi',
    capabilities: ['chat', 'code', 'agent', 'search'],
    speed: 'optimal',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: ['chat', 'code', 'vision'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0.005,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    capabilities: ['chat', 'code', 'agent', 'vision'],
    speed: 'fast',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    capabilities: ['chat', 'code', 'vision', 'search'],
    speed: 'fast',
    contextWindow: 1000000,
    costPer1kTokens: 0.002,
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0.001,
  },
  {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'meta',
    capabilities: ['chat', 'code'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0.0005,
  },
  {
    id: 'qwen3-235b',
    name: 'Qwen3 235B',
    provider: 'alibaba',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0.001,
  },
];

// GET - Return all available models with capabilities
export async function GET() {
  try {
    return NextResponse.json({
      models: MODELS,
      default: 'auto',
      total: MODELS.length,
    });
  } catch (error) {
    console.error('Models GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve models' },
      { status: 500 }
    );
  }
}
