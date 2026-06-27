// Database fallback for Cloudflare Workers (no SQLite)
// When running on Cloudflare, Prisma/SQLite is not available
// This module provides seeded/fallback data

let _dbAvailable: boolean | null = null;

export async function isDbAvailable(): Promise<boolean> {
  if (_dbAvailable !== null) return _dbAvailable;
  try {
    const { db } = await import('@/lib/db');
    await db.$queryRaw`SELECT 1`;
    _dbAvailable = true;
    return true;
  } catch {
    _dbAvailable = false;
    return false;
  }
}

// Fallback data for when database is not available
export const FALLBACK_SURFACES = [
  { id: '1', name: 'Modeling', type: 'modeling', description: '3D/visual design workspace', icon: '🎨', color: '#f43f5e', tools: ['three.js','blender','spline'], layout: {}, status: 'active', sortOrder: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Game Dev', type: 'game', description: 'Game development workspace', icon: '🎮', color: '#8b5cf6', tools: ['unity','unreal','godot'], layout: {}, status: 'active', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'Web Design', type: 'web-design', description: 'Visual web design workspace', icon: '🌐', color: '#10b981', tools: ['figma','tailwind','framer-motion'], layout: {}, status: 'active', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', name: 'Backend', type: 'backend', description: 'API/server development workspace', icon: '⚙️', color: '#f59e0b', tools: ['prisma','express','docker'], layout: {}, status: 'active', sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', name: 'Frontend', type: 'frontend', description: 'UI/component development workspace', icon: '🖥️', color: '#06b6d4', tools: ['react','next.js','tailwind'], layout: {}, status: 'active', sortOrder: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', name: 'Fullstack', type: 'fullstack', description: 'End-to-end development workspace', icon: '🔗', color: '#14b8a6', tools: ['next.js','prisma','api-routes'], layout: {}, status: 'active', sortOrder: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', name: 'Mobile', type: 'mobile', description: 'Mobile app development workspace', icon: '📱', color: '#0ea5e9', tools: ['react-native','expo','flutter'], layout: {}, status: 'active', sortOrder: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', name: 'Data', type: 'data', description: 'Data science workspace', icon: '📊', color: '#eab308', tools: ['python','pandas','jupyter'], layout: {}, status: 'active', sortOrder: 7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '9', name: 'API Design', type: 'api', description: 'REST/GraphQL API design workspace', icon: '🔌', color: '#f97316', tools: ['openapi','graphql','postman'], layout: {}, status: 'active', sortOrder: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '10', name: 'DevOps', type: 'devops', description: 'CI/CD and infrastructure workspace', icon: '🚀', color: '#71717a', tools: ['docker','kubernetes','terraform'], layout: {}, status: 'active', sortOrder: 9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '11', name: '3D Modeling', type: '3d-modeling', description: 'Professional 3D asset creation', icon: '🧊', color: '#ec4899', tools: ['blender','three.js','spline'], layout: {}, status: 'active', sortOrder: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '12', name: 'Game SDK - Unity', type: 'unity', description: 'Full Unity game development', icon: '🕹️', color: '#a855f7', tools: ['unity-editor','c-sharp','prefabs'], layout: {}, status: 'active', sortOrder: 11, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '13', name: 'Game SDK - Unreal', type: 'unreal', description: 'Full Unreal Engine development', icon: '🔥', color: '#6366f1', tools: ['unreal-engine','blueprints','cpp'], layout: {}, status: 'active', sortOrder: 12, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '14', name: 'Game SDK - Godot', type: 'godot', description: 'Full Godot Engine development', icon: '🎯', color: '#3b82f6', tools: ['godot-engine','gdscript','scenes'], layout: {}, status: 'active', sortOrder: 13, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '15', name: 'Chrome Extension', type: 'chrome-ext', description: 'Browser extension development', icon: '🧩', color: '#22c55e', tools: ['manifest-v3','content-scripts','chrome-apis'], layout: {}, status: 'active', sortOrder: 14, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '16', name: 'VS Code Extension', type: 'vscode-ext', description: 'VS Code extension development', icon: '⚡', color: '#0ea5e9', tools: ['extension-api','language-server','webviews'], layout: {}, status: 'active', sortOrder: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '17', name: 'Blockchain/Web3', type: 'web3', description: 'Decentralized app development', icon: '⛓️', color: '#f59e0b', tools: ['solidity','hardhat','ethers-js'], layout: {}, status: 'active', sortOrder: 16, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '18', name: 'AI/ML Training', type: 'ml-training', description: 'ML model training workspace', icon: '🧠', color: '#ef4444', tools: ['pytorch','tensorflow','jax'], layout: {}, status: 'active', sortOrder: 17, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '19', name: 'Security', type: 'security', description: 'Application security workspace', icon: '🛡️', color: '#dc2626', tools: ['pentesting','owasp','sast-dast'], layout: {}, status: 'active', sortOrder: 18, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '20', name: 'Audio/Music', type: 'audio', description: 'Audio and music development', icon: '🎵', color: '#a855f7', tools: ['web-audio-api','tone-js','midi'], layout: {}, status: 'active', sortOrder: 19, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '21', name: 'Video/Streaming', type: 'video', description: 'Video processing and streaming', icon: '🎬', color: '#e11d48', tools: ['ffmpeg','webrtc','streaming'], layout: {}, status: 'active', sortOrder: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '22', name: 'Maps/GIS', type: 'gis', description: 'Geographic information systems', icon: '🗺️', color: '#059669', tools: ['mapbox','leaflet','geojson'], layout: {}, status: 'active', sortOrder: 21, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '23', name: 'IoT/Embedded', type: 'iot', description: 'IoT and embedded systems', icon: '📡', color: '#0891b2', tools: ['arduino','raspberry-pi','mqtt'], layout: {}, status: 'active', sortOrder: 22, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '24', name: 'Database Design', type: 'database', description: 'Database schema design and optimization', icon: '🗄️', color: '#7c3aed', tools: ['schema-design','er-diagrams','sql-editor'], layout: {}, status: 'active', sortOrder: 23, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '25', name: 'DevOps Pro', type: 'devops-pro', description: 'Advanced infrastructure with Kubernetes and Terraform', icon: '🏗️', color: '#64748b', tools: ['kubernetes','terraform','ansible'], layout: {}, status: 'active', sortOrder: 24, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const FALLBACK_SUBSCRIPTION = {
  plan: 'free',
  status: 'active',
  tokensUsed: 0,
  tokensLimit: 100000,
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const FALLBACK_MODELS = [
  { id: 'auto', name: 'Auto (Best Available)', provider: 'multi', capabilities: ['chat','code','agent','search','reasoning','vision'], speed: 'optimal', contextWindow: 1000000, costPer1kTokens: 0, enabled: true, description: 'Automatically routes to the best free model', freeTier: true },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', capabilities: ['chat','code','vision','search'], speed: 'fast', contextWindow: 1000000, costPer1kTokens: 0, enabled: true, description: 'Google 1M context workhorse', freeTier: true },
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'deepseek', capabilities: ['chat','code','reasoning'], speed: 'fast', contextWindow: 1000000, costPer1kTokens: 0, enabled: true, description: 'DeepSeek 1.6T MoE', freeTier: true },
  { id: 'llama-4-scout-17b', name: 'Llama 4 Scout 17B', provider: 'meta', capabilities: ['chat','code','vision'], speed: 'ultra', contextWindow: 10000000, costPer1kTokens: 0, enabled: true, description: 'Meta 10M context multimodal', freeTier: true },
  { id: 'qwen3-coder-480b', name: 'Qwen3 Coder 480B', provider: 'alibaba', capabilities: ['chat','code','agent','reasoning'], speed: 'medium', contextWindow: 256000, costPer1kTokens: 0, enabled: true, description: 'Best free coding model', freeTier: true },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'mistral', capabilities: ['chat','code','reasoning'], speed: 'medium', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Mistral flagship', freeTier: true },
  { id: 'codestral', name: 'Codestral', provider: 'mistral', capabilities: ['chat','code'], speed: 'fast', contextWindow: 256000, costPer1kTokens: 0, enabled: true, description: 'Mistral code model', freeTier: true },
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'groq', capabilities: ['chat','code','reasoning'], speed: 'ultra', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Open-source GPT on Groq', freeTier: true },
  { id: 'cerebras-glm-4.7', name: 'GLM 4.7 (Cerebras)', provider: 'cerebras', capabilities: ['chat','code'], speed: 'ultra', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Fastest inference on Cerebras', freeTier: true },
  { id: 'command-r-plus', name: 'Command R+', provider: 'cohere', capabilities: ['chat','code','search'], speed: 'medium', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Cohere RAG flagship', freeTier: true },
  { id: 'deepseek-r1-sambanova', name: 'DeepSeek R1 (SambaNova)', provider: 'sambanova', capabilities: ['chat','code','reasoning'], speed: 'fast', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Fast reasoning on SambaNova', freeTier: true },
  { id: 'openrouter-free', name: 'OpenRouter Free Router', provider: 'openrouter', capabilities: ['chat','code','reasoning'], speed: 'fast', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Aggregates 26+ free models', freeTier: true },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'google', capabilities: ['chat','code','vision','reasoning'], speed: 'fast', contextWindow: 1000000, costPer1kTokens: 0, enabled: true, description: 'Google latest Flash', freeTier: true },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', capabilities: ['chat','code','reasoning'], speed: 'medium', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Deep reasoning', freeTier: true },
  { id: 'llama-4-maverick-17b', name: 'Llama 4 Maverick 17B', provider: 'meta', capabilities: ['chat','code','vision'], speed: 'fast', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Meta MoE workhorse', freeTier: true },
  { id: 'qwen3.7-max', name: 'Qwen3.7 Max', provider: 'alibaba', capabilities: ['chat','code','reasoning','vision'], speed: 'medium', contextWindow: 128000, costPer1kTokens: 0, enabled: true, description: 'Alibaba flagship agent model', freeTier: true },
];
