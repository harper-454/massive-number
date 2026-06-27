import { NextResponse } from 'next/server';

// ── Model/Provider health definitions ────────────────────────────────────

interface ModelHealthEntry {
  id: string;
  name: string;
  provider: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latencyMs: number;
  availability: number; // 0-100%
  errorRate: number; // 0-100%
  lastChecked: string;
  consecutiveFailures: number;
  tier: 'free' | 'pro' | 'enterprise';
  endpoint: string;
}

// Models aligned with model-store.ts DEFAULT_MODELS + extended providers
const MODEL_DEFINITIONS: Array<{
  id: string;
  name: string;
  provider: string;
  tier: 'free' | 'pro' | 'enterprise';
  endpoint: string;
  priority: number; // Lower = better fallback candidate
}> = [
  // Free tier models (aligned with model-store)
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', tier: 'free', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', priority: 1 },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'google', tier: 'free', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', priority: 3 },
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'deepseek', tier: 'free', endpoint: 'https://api.deepseek.com/v1/models', priority: 2 },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', tier: 'free', endpoint: 'https://api.deepseek.com/v1/models', priority: 5 },
  { id: 'llama-4-scout-17b', name: 'Llama 4 Scout 17B', provider: 'meta', tier: 'free', endpoint: 'https://api.groq.com/openai/v1/models', priority: 4 },
  { id: 'llama-4-maverick-17b', name: 'Llama 4 Maverick 17B', provider: 'meta', tier: 'free', endpoint: 'https://api.groq.com/openai/v1/models', priority: 6 },
  { id: 'qwen3-coder-480b', name: 'Qwen3 Coder 480B', provider: 'alibaba', tier: 'free', endpoint: 'https://openrouter.ai/api/v1/models', priority: 4 },
  { id: 'qwen3.7-max', name: 'Qwen3.7 Max', provider: 'alibaba', tier: 'free', endpoint: 'https://openrouter.ai/api/v1/models', priority: 7 },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'mistral', tier: 'free', endpoint: 'https://api.mistral.ai/v1/models', priority: 6 },
  { id: 'codestral', name: 'Codestral', provider: 'mistral', tier: 'free', endpoint: 'https://api.mistral.ai/v1/models', priority: 8 },
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'groq', tier: 'free', endpoint: 'https://api.groq.com/openai/v1/models', priority: 9 },
  { id: 'cerebras-glm-4.7', name: 'GLM 4.7 (Cerebras)', provider: 'cerebras', tier: 'free', endpoint: 'https://api.cerebras.ai/v1/models', priority: 10 },
  { id: 'command-r-plus', name: 'Command R+', provider: 'cohere', tier: 'free', endpoint: 'https://api.cohere.ai/v1/models', priority: 9 },
  { id: 'deepseek-r1-sambanova', name: 'DeepSeek R1 (SambaNova)', provider: 'sambanova', tier: 'free', endpoint: 'https://api.sambanova.ai/v1/models', priority: 10 },
  { id: 'openrouter-free', name: 'OpenRouter Free Router', provider: 'openrouter', tier: 'free', endpoint: 'https://openrouter.ai/api/v1/models', priority: 10 },
  // Pro / Enterprise models (for BYOK users)
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', tier: 'pro', endpoint: 'https://api.openai.com/v1/models', priority: 11 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', tier: 'pro', endpoint: 'https://api.openai.com/v1/models', priority: 11 },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'anthropic', tier: 'pro', endpoint: 'https://api.anthropic.com/v1/models', priority: 11 },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', tier: 'pro', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', priority: 11 },
  // Local providers
  { id: 'lm-studio', name: 'LM Studio (Local)', provider: 'lmstudio', tier: 'free', endpoint: 'http://localhost:1234/v1/models', priority: 12 },
  { id: 'ollama', name: 'Ollama (Local)', provider: 'ollama', tier: 'free', endpoint: 'http://localhost:11434/api/tags', priority: 12 },
];

// Track consecutive failures across health checks (persisted in memory)
const failureTracker = new Map<string, number>();

// Cache health results for 60 seconds
let cachedResults: ModelHealthEntry[] | null = null;
let lastCheckTime = 0;
const CACHE_TTL = 60_000;

async function checkEndpoint(url: string): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'MassiveNumber-HealthCheck/1.0' },
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    // Consider 200-299 and 401/403/405 as "reachable" (auth required = service is up)
    return { ok: response.status < 500, latencyMs };
  } catch {
    const latencyMs = Date.now() - start;
    return { ok: false, latencyMs };
  }
}

async function checkHealth(): Promise<ModelHealthEntry[]> {
  const now = new Date().toISOString();
  const results: ModelHealthEntry[] = [];

  for (const model of MODEL_DEFINITIONS) {
    const { ok, latencyMs } = await checkEndpoint(model.endpoint);

    let status: 'healthy' | 'degraded' | 'down' | 'unknown';
    if (!ok) {
      status = 'down';
    } else if (latencyMs > 2000) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // Track consecutive failures
    const prevFailures = failureTracker.get(model.id) || 0;
    const consecutiveFailures = status === 'down' ? prevFailures + 1 : 0;
    failureTracker.set(model.id, consecutiveFailures);

    // Calculate simulated availability and error rate based on status & history
    const availability = status === 'healthy' ? 99.9 : status === 'degraded' ? 95.0 : 0;
    const errorRate = status === 'healthy' ? 0.1 : status === 'degraded' ? 5.0 : 100;

    results.push({
      id: model.id,
      name: model.name,
      provider: model.provider,
      status,
      latencyMs,
      availability,
      errorRate,
      lastChecked: now,
      consecutiveFailures,
      tier: model.tier,
      endpoint: model.endpoint,
    });
  }

  return results;
}

// Build fallback order — healthy free models sorted by priority, then degraded, then pro
function buildFallbackOrder(models: ModelHealthEntry[]): string[] {
  const freeHealthy = models
    .filter((m) => m.tier === 'free' && m.status === 'healthy')
    .sort((a, b) => {
      const defA = MODEL_DEFINITIONS.find((d) => d.id === a.id);
      const defB = MODEL_DEFINITIONS.find((d) => d.id === b.id);
      return (defA?.priority ?? 99) - (defB?.priority ?? 99);
    });

  const freeDegraded = models
    .filter((m) => m.tier === 'free' && m.status === 'degraded')
    .sort((a, b) => {
      const defA = MODEL_DEFINITIONS.find((d) => d.id === a.id);
      const defB = MODEL_DEFINITIONS.find((d) => d.id === b.id);
      return (defA?.priority ?? 99) - (defB?.priority ?? 99);
    });

  const proModels = models
    .filter((m) => m.tier === 'pro' && m.status !== 'down')
    .sort((a, b) => a.latencyMs - b.latencyMs);

  return [
    ...freeHealthy.map((m) => m.id),
    ...freeDegraded.map((m) => m.id),
    ...proModels.map((m) => m.id),
  ];
}

// GET — health status of all models/providers with fallback chain
export async function GET() {
  try {
    const now = Date.now();

    // Return cached if still valid
    if (cachedResults && now - lastCheckTime < CACHE_TTL) {
      const fallbackOrder = buildFallbackOrder(cachedResults);
      return NextResponse.json({
        models: cachedResults,
        lastChecked: cachedResults[0]?.lastChecked || new Date().toISOString(),
        summary: getSummary(cachedResults),
        fallbackOrder,
      });
    }

    const results = await checkHealth();
    cachedResults = results;
    lastCheckTime = now;

    const fallbackOrder = buildFallbackOrder(results);

    return NextResponse.json({
      models: results,
      lastChecked: results[0]?.lastChecked || new Date().toISOString(),
      summary: getSummary(results),
      fallbackOrder,
    });
  } catch (error) {
    console.error('Model Health GET error:', error);
    return NextResponse.json(
      { error: 'Failed to check model health' },
      { status: 500 }
    );
  }
}

function getSummary(models: ModelHealthEntry[]) {
  const healthy = models.filter((m) => m.status === 'healthy').length;
  const degraded = models.filter((m) => m.status === 'degraded').length;
  const down = models.filter((m) => m.status === 'down').length;
  const unknown = models.filter((m) => m.status === 'unknown').length;
  const avgLatency =
    models.length > 0
      ? Math.round(models.reduce((sum, m) => sum + m.latencyMs, 0) / models.length)
      : 0;
  const totalFailures = models.reduce((sum, m) => sum + m.consecutiveFailures, 0);

  return { healthy, degraded, down, unknown, total: models.length, avgLatency, totalFailures };
}
