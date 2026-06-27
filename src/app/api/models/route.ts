export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { FALLBACK_MODELS } from '@/lib/db-fallback';

// Current free models as of June 2026 - sourced from web research across
// Google AI Studio, Groq, Cerebras, SambaNova, OpenRouter, DeepSeek, Mistral,
// Together AI, Cohere, HuggingFace, and Qwen API platforms.
// All models listed have permanent free tiers (no trial credits).

const MODELS = [
  // ── Auto Router ───────────────────────────────────────────────────────
  {
    id: 'auto',
    name: 'Auto (Best Available)',
    provider: 'multi',
    capabilities: ['chat', 'code', 'agent', 'search', 'reasoning', 'vision'],
    speed: 'optimal',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    description: 'Automatically routes to the best free model for your task',
    freeTier: true,
    providerUrl: '',
  },

  // ── Google Gemini (AI Studio Free Tier) ───────────────────────────────
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    capabilities: ['chat', 'code', 'vision', 'search', 'reasoning'],
    speed: 'fast',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    description: 'Google\'s 1M context workhorse — free on AI Studio. Best for long documents, code analysis, and multimodal tasks',
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
    description: 'Google\'s latest Flash generation — improved reasoning and coding, 1M context, free tier',
    freeTier: true,
    providerUrl: 'https://ai.google.dev/',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    provider: 'google',
    capabilities: ['chat', 'code', 'vision'],
    speed: 'ultra',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    description: 'Fastest & most budget-friendly Gemini model — 1M context, ultra-low latency, free tier',
    freeTier: true,
    providerUrl: 'https://ai.google.dev/',
  },

  // ── DeepSeek (Free API) ───────────────────────────────────────────────
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'fast',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    description: 'DeepSeek\'s latest MoE model — 1.6T params, 49B active, 1M context. Open-weight, free API tier',
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
    description: 'Deep reasoning model for complex problems — chain-of-thought, free API tier',
    freeTier: true,
    providerUrl: 'https://api.deepseek.com/',
  },

  // ── Meta Llama (via Groq, Cerebras, Together, OpenRouter) ─────────────
  {
    id: 'llama-4-scout-17b',
    name: 'Llama 4 Scout 17B',
    provider: 'meta',
    capabilities: ['chat', 'code', 'vision'],
    speed: 'ultra',
    contextWindow: 10000000,
    costPer1kTokens: 0,
    description: 'Meta\'s 10M context multimodal MoE model — 17B active/16 experts. Free via Groq & Cerebras',
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
    description: 'Meta\'s workhorse MoE model — 17B active/128 experts, 400B total. Free via Groq & Together AI',
    freeTier: true,
    providerUrl: 'https://groq.com/',
  },

  // ── Qwen / Alibaba (Free API & OpenRouter) ────────────────────────────
  {
    id: 'qwen3-coder-480b',
    name: 'Qwen3 Coder 480B',
    provider: 'alibaba',
    capabilities: ['chat', 'code', 'agent', 'reasoning'],
    speed: 'medium',
    contextWindow: 256000,
    costPer1kTokens: 0,
    description: 'Alibaba\'s agentic code model — 480B total/35B active MoE. Best free coding model, free via OpenRouter',
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
    description: 'Alibaba\'s flagship agent foundation model — versatile for code, automation, and reasoning. Free tier',
    freeTier: true,
    providerUrl: 'https://openrouter.ai/',
  },

  // ── Mistral (Free Experiment Tier) ─────────────────────────────────────
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0,
    description: 'Mistral\'s flagship model — free Experiment tier on La Plateforme, rate-limited',
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
    description: 'Mistral\'s open-weight code model — 22B params, optimized for code generation. Free tier',
    freeTier: true,
    providerUrl: 'https://console.mistral.ai/',
  },

  // ── Groq-Hosted (Free Tier, Ultra-Fast LPU) ───────────────────────────
  {
    id: 'gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'groq',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'ultra',
    contextWindow: 128000,
    costPer1kTokens: 0,
    description: 'Open-source GPT model on Groq LPU — blazing fast inference, free tier, no credit card',
    freeTier: true,
    providerUrl: 'https://groq.com/',
  },

  // ── Cerebras (Free Tier, Ultra-Fast) ──────────────────────────────────
  {
    id: 'cerebras-glm-4.7',
    name: 'GLM 4.7 (Cerebras)',
    provider: 'cerebras',
    capabilities: ['chat', 'code'],
    speed: 'ultra',
    contextWindow: 128000,
    costPer1kTokens: 0,
    description: 'Zhipu AI\'s GLM 4.7 on Cerebras wafer-scale — fastest inference available, free tier',
    freeTier: true,
    providerUrl: 'https://cerebras.ai/',
  },

  // ── Cohere (Free Trial API) ───────────────────────────────────────────
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    capabilities: ['chat', 'code', 'search'],
    speed: 'medium',
    contextWindow: 128000,
    costPer1kTokens: 0,
    description: 'Cohere\'s flagship RAG model — built-in web search, free trial API key',
    freeTier: true,
    providerUrl: 'https://dashboard.cohere.com/',
  },

  // ── SambaNova (Free Cloud Credits) ────────────────────────────────────
  {
    id: 'deepseek-r1-sambanova',
    name: 'DeepSeek R1 (SambaNova)',
    provider: 'sambanova',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0,
    description: 'DeepSeek R1 on SambaNova RDU — fast reasoning, free cloud credits available',
    freeTier: true,
    providerUrl: 'https://sambanova.ai/',
  },

  // ── OpenRouter (Free Models Aggregator) ───────────────────────────────
  {
    id: 'openrouter-free',
    name: 'OpenRouter Free Router',
    provider: 'openrouter',
    capabilities: ['chat', 'code', 'reasoning'],
    speed: 'fast',
    contextWindow: 128000,
    costPer1kTokens: 0,
    description: 'Aggregates 26+ free models — auto-selects best available. Single API, zero cost',
    freeTier: true,
    providerUrl: 'https://openrouter.ai/',
  },
];

// GET - Return all available free models with capabilities
export async function GET() {
  try {
    // Group by provider for stats
    const byProvider: Record<string, number> = {};
    MODELS.forEach((m) => {
      byProvider[m.provider] = (byProvider[m.provider] || 0) + 1;
    });

    return NextResponse.json({
      models: MODELS,
      default: 'auto',
      total: MODELS.length,
      providers: Object.keys(byProvider).length,
      byProvider,
      lastUpdated: '2026-06-26',
      sources: [
        'Google AI Studio (Gemini free tier)',
        'Groq (LPU free tier)',
        'Cerebras (wafer-scale free tier)',
        'DeepSeek API (free tier)',
        'Mistral La Plateforme (Experiment tier)',
        'OpenRouter (26+ free models)',
        'SambaNova Cloud (free credits)',
        'Cohere (trial API key)',
        'Together AI (84 free models)',
        'Alibaba Cloud Model Studio (Qwen free tier)',
      ],
    });
  } catch (error) {
    console.error('Models GET error:', error);
    // Return fallback models from db-fallback
    return NextResponse.json({
      models: FALLBACK_MODELS,
      default: 'auto',
      total: FALLBACK_MODELS.length,
      providers: [...new Set(FALLBACK_MODELS.map(m => m.provider))].length,
      lastUpdated: '2026-06-26',
    });
  }
}
