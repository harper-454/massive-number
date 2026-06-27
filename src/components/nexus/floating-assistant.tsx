'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PanelView } from '@/stores/ui-store';

// ── Types ──────────────────────────────────────────────────────────────

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
  timestamp: Date;
}

interface AssistantAction {
  label: string;
  view: PanelView;
}

// ── Knowledge Base ─────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  { id: 'get-started', label: 'Get Started', emoji: '🚀' },
  { id: 'view-surfaces', label: 'View Surfaces', emoji: '🎮' },
  { id: 'pricing', label: 'Pricing', emoji: '💰' },
  { id: 'use-my-key', label: 'Use My Key', emoji: '🔑' },
  { id: 'whats-new', label: "What's New?", emoji: '✨' },
];

const SURFACES_LIST = [
  { name: 'Modeling', desc: '3D modeling, CAD, sculpting', view: 'editor' as PanelView },
  { name: 'Game Dev', desc: 'Game design & development', view: 'editor' as PanelView },
  { name: 'Web Design', desc: 'Websites, landing pages, UI/UX', view: 'editor' as PanelView },
  { name: 'Backend', desc: 'APIs, servers, databases', view: 'terminal' as PanelView },
  { name: 'Frontend', desc: 'React, Vue, UI components', view: 'editor' as PanelView },
  { name: 'Fullstack', desc: 'End-to-end applications', view: 'editor' as PanelView },
  { name: 'Mobile', desc: 'iOS, Android, React Native', view: 'editor' as PanelView },
  { name: 'Data', desc: 'Analysis, visualization, pipelines', view: 'terminal' as PanelView },
  { name: 'API Design', desc: 'REST, GraphQL, OpenAPI specs', view: 'editor' as PanelView },
  { name: 'DevOps', desc: 'CI/CD, containers, infrastructure', view: 'terminal' as PanelView },
  { name: '3D Modeling', desc: 'Blender, three.js, Spline', view: 'editor' as PanelView },
  { name: 'Unity SDK', desc: 'Unity Editor, C#, Prefabs', view: 'editor' as PanelView },
  { name: 'Unreal SDK', desc: 'Unreal Engine, Blueprints, C++', view: 'editor' as PanelView },
  { name: 'Godot SDK', desc: 'Godot Engine, GDScript', view: 'editor' as PanelView },
  { name: 'Chrome Extension', desc: 'Manifest V3, Content Scripts', view: 'editor' as PanelView },
  { name: 'VS Code Extension', desc: 'Extension API, Language Server', view: 'editor' as PanelView },
  { name: 'Blockchain/Web3', desc: 'Solidity, Hardhat, Smart Contracts', view: 'editor' as PanelView },
  { name: 'AI/ML Training', desc: 'PyTorch, TensorFlow, GPU ops', view: 'terminal' as PanelView },
  { name: 'DevOps Pro', desc: 'Kubernetes, Terraform, SRE', view: 'terminal' as PanelView },
  { name: 'Security', desc: 'Pen testing, OWASP, compliance', view: 'terminal' as PanelView },
  { name: 'Audio/Music', desc: 'Web Audio, Tone.js, MIDI', view: 'editor' as PanelView },
  { name: 'Video/Streaming', desc: 'FFmpeg, WebRTC, streaming', view: 'editor' as PanelView },
  { name: 'Maps/GIS', desc: 'Mapbox, Leaflet, GeoJSON', view: 'editor' as PanelView },
  { name: 'IoT/Embedded', desc: 'Arduino, MQTT, edge computing', view: 'terminal' as PanelView },
  { name: 'Database Design', desc: 'Schema design, ER diagrams, migrations', view: 'editor' as PanelView },
];

const FREE_MODELS = [
  { name: 'Gemini 2.5 Flash', provider: 'Google', ctx: '1M' },
  { name: 'Gemini 3 Flash', provider: 'Google', ctx: '1M' },
  { name: 'DeepSeek V3', provider: 'DeepSeek', ctx: '128K' },
  { name: 'DeepSeek R1', provider: 'DeepSeek', ctx: '128K' },
  { name: 'Llama 4 Maverick', provider: 'Meta', ctx: '1M' },
  { name: 'Llama 4 Scout', provider: 'Meta', ctx: '10M' },
  { name: 'Qwen 3 235B', provider: 'Qwen', ctx: '128K' },
  { name: 'Qwen 3 30B', provider: 'Qwen', ctx: '128K' },
  { name: 'Mistral Small 3.1', provider: 'Mistral', ctx: '128K' },
  { name: 'Gemma 3 27B', provider: 'Google', ctx: '128K' },
  { name: 'Llama 3.3 70B', provider: 'Groq', ctx: '128K' },
  { name: 'Qwen 2.5 Coder 32B', provider: 'Qwen', ctx: '128K' },
  { name: 'Phi-4', provider: 'Microsoft', ctx: '128K' },
  { name: 'Command R+', provider: 'Cohere', ctx: '128K' },
  { name: 'DeepSeek R1 70B', provider: 'SambaNova', ctx: '128K' },
  { name: 'Auto (Best Available)', provider: 'Multi', ctx: '1M' },
];

// ── Response Generator ─────────────────────────────────────────────────

function generateResponse(input: string): { content: string; actions?: AssistantAction[] } {
  const lower = input.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|sup|yo|howdy|greetings)/i.test(lower)) {
    return {
      content: `Hey there! 👋 I'm the **MASSIVE AI** assistant. I know everything about this platform and I'm here to help you get the most out of it.\n\nYou can ask me about:\n• **Getting started** with the platform\n• **25 dev surfaces** you can build with\n• **16+ free AI models** available\n• **Pricing & plans** (Free, Pro, Enterprise)\n• **Using your own API keys** (BYOK)\n• **Running local models** (LM Studio, Ollama)\n• **Self-improving AI loops**\n• And much more!\n\nWhat would you like to know?`,
      actions: [
        { label: 'Open Chat', view: 'chat' },
        { label: 'View Surfaces', view: 'dev-surfaces' },
      ],
    };
  }

  // Getting started
  if (/get(ting)? ?start|how do i (begin|use|start)|new here|first time|onboard/i.test(lower)) {
    return {
      content: `## 🚀 Getting Started with MASSIVE NUMBER\n\nHere's your quick-start guide:\n\n**1. Start Chatting** — The Chat panel is your default view. Just type a message and the AI will respond using the best available free model.\n\n**2. Pick a Model** — Click the model selector in the chat header to switch between 16+ free models, or use "Auto" to let the system pick the best one.\n\n**3. Try a Dev Surface** — Go to the Surfaces panel to explore 25 specialized workspaces for everything from Game Dev to Blockchain.\n\n**4. Use the Editor** — Code surfaces open in the Editor panel with syntax highlighting and AI-assisted coding.\n\n**5. Explore Agent Mode** — Switch to the Agent panel for autonomous AI that can execute multi-step tasks.\n\n**Keyboard Shortcuts:**\n• \`1\` — Chat • \`2\` — Editor • \`3\` — Agent\n• \`4\` — Search • \`5\` — Terminal • \`⌘K\` — Command Palette`,
      actions: [
        { label: 'Open Chat', view: 'chat' },
        { label: 'View Surfaces', view: 'dev-surfaces' },
      ],
    };
  }

  // What can I build / surfaces
  if (/what can i build|surfaces|dev surface|workspace|what can (i|you) (make|create|build)/i.test(lower)) {
    const surfaceList = SURFACES_LIST.map(s => `• **${s.name}** — ${s.desc}`).join('\n');
    return {
      content: `## 🎮 25 Dev Surfaces\n\nMASSIVE NUMBER gives you specialized workspaces for every development domain:\n\n${surfaceList}\n\nEach surface launches into the right workspace — **Editor** for code-heavy surfaces, **Terminal** for infrastructure surfaces. Just click "Launch" on any surface card!`,
      actions: [
        { label: 'View All Surfaces', view: 'dev-surfaces' },
        { label: 'Open Editor', view: 'editor' },
        { label: 'Open Terminal', view: 'terminal' },
      ],
    };
  }

  // Pricing / cost
  if (/price|cost|how much|plan|subscription|tier|billing|pro|enterprise|free/i.test(lower)) {
    return {
      content: `## 💰 Pricing Plans\n\n**🆓 Free Tier** — $0/month\n• 16+ AI models from 10+ providers\n• 100K tokens/month\n• 10 dev surfaces\n• Chat export (Markdown, JSON)\n• Persona system\n\n**⭐ Pro** — $8/month\n• 2M tokens/month\n• Premium models (GPT-4o, Claude Sonnet 4)\n• API access\n• Custom personas\n• Unlimited surfaces\n• Priority support\n\n**🏢 Enterprise** — $49/month\n• Unlimited tokens\n• Dedicated support\n• Custom hosting\n• SSO & team management\n• Custom model fine-tuning\n\nAll plans include the self-improving AI loops system and health-scored model routing. Billing is powered by **Stripe**.`,
      actions: [
        { label: 'View Account', view: 'account' },
        { label: 'View Surfaces', view: 'dev-surfaces' },
      ],
    };
  }

  // BYOK / own key
  if (/own key|byok|bring.*(own|your).*key|api key|my (own )?(openai|anthropic|google|deepseek)/i.test(lower)) {
    return {
      content: `## 🔑 Bring Your Own Key (BYOK)\n\nYou can use your own API keys to access premium models directly:\n\n**Supported Providers:**\n• **OpenAI** — GPT-4o, GPT-4 Turbo, o1, o3\n• **Anthropic** — Claude Sonnet 4, Claude Opus 4\n• **Google** — Gemini Pro, Gemini Ultra\n• **DeepSeek** — DeepSeek V3, R1\n• **Custom** — Any OpenAI-compatible endpoint\n\n**How to set it up:**\n1. Open the **Account** panel\n2. Go to the **API Keys** tab\n3. Click "Add Key" and select your provider\n4. Paste your key (it's stored securely)\n5. Toggle the key on — done!\n\nYour keys are encrypted at rest and never shared. You can test connections and toggle keys on/off anytime.`,
      actions: [
        { label: 'Open Account', view: 'account' },
      ],
    };
  }

  // Local models / LM Studio / Ollama
  if (/local model|lm studio|ollama|localhost|run.*(local|own)|self.host/i.test(lower)) {
    return {
      content: `## 🏠 Running Local Models\n\nYou can connect local AI models to MASSIVE NUMBER:\n\n**LM Studio** (localhost:1234)\n• Download any GGUF model from Hugging Face\n• Start the local server in LM Studio\n• Add it as a local provider in Account → Local Providers\n\n**Ollama** (localhost:11434)\n• Install Ollama and pull models (\`ollama pull llama3\`)\n• The server starts automatically\n• Add it as a local provider\n\n**Custom Endpoints**\n• Any OpenAI-compatible API endpoint\n• Set the base URL and optional API key\n• Great for vLLM, TGI, or custom inference servers\n\n**Plugin System**\n• Mac/PC plugins bridge local models to the cloud app\n• Your local models appear alongside cloud models\n• Full chat & agent capabilities with local models\n\nAll connections can be tested from the Account panel.`,
      actions: [
        { label: 'Open Account', view: 'account' },
      ],
    };
  }

  // Available models
  if (/what model|available model|which model|model.*(list|avail|free|support)|16.*model/i.test(lower)) {
    const modelList = FREE_MODELS.map(m => `• **${m.name}** (${m.provider}) — ${m.ctx} context`).join('\n');
    return {
      content: `## 🤖 16+ Free AI Models\n\nAll of these models are available on the **Free tier** at zero cost:\n\n${modelList}\n\n**Auto Model Selection** — The "Auto" mode monitors model health across all providers and automatically routes your request to the fastest, most reliable model. If a model goes down, it seamlessly fails over to the next best option.\n\n**Pro Models** (with Pro plan): GPT-4o, Claude Sonnet 4, and more premium options.`,
      actions: [
        { label: 'Open Chat', view: 'chat' },
        { label: 'View Account', view: 'account' },
      ],
    };
  }

  // Deploy
  if (/deploy|deployment|publish|host|ship|launch.*(app|project|code)/i.test(lower)) {
    return {
      content: `## 🚀 Deployment Features\n\nMASSIVE NUMBER supports multiple deployment workflows:\n\n**Git Integration**\n• Connect your GitHub repos directly\n• Auto-commit generated code\n• Branch management from the Git panel\n\n**Spec-to-Code Pipeline**\n• Write a specification in natural language\n• AI generates the full project structure\n• One-click deployment to various platforms\n\n**Project Templates**\n• Pre-built templates for common stacks\n• Next.js, React, Vue, Svelte, and more\n• Customize and deploy in minutes\n\n**DevOps Pro Surface**\n• Kubernetes, Terraform, Ansible configs\n• CI/CD pipeline generation\n• Infrastructure as Code with AI assistance\n\nThe platform generates production-ready code that you can deploy anywhere!`,
      actions: [
        { label: 'Open Git', view: 'git' },
        { label: 'View Templates', view: 'templates' },
        { label: 'View Specs', view: 'spec' },
      ],
    };
  }

  // Feature not available / request
  if (/not.*(here|available|found)|need.*feature|missing|request|wish|want.*that.*(doesn't|isn't|not)/i.test(lower)) {
    return {
      content: `## 💡 Feature Requests & Improvement Loops\n\nGreat news — MASSIVE NUMBER has a **self-improving AI system** that continuously makes the app better!\n\n**5 Improvement Loop Types:**\n1. ⚡ **Performance** — Optimizes load times, API latency, render speed\n2. 🎨 **UX** — Reduces click depth, improves task completion\n3. 🧠 **Model Quality** — Monitors satisfaction, response quality, fallback rates\n4. 🔄 **Error Recovery** — Tracks error rates, auto-retry, contextual errors\n5. 💡 **Feature Suggestion** — Analyzes feature utilization, request fulfillment\n\n**Current Health Score: 96/100** 🟢\n\n**To request a feature:**\n1. Open the **Improve** panel\n2. Go to the **Suggestions** tab\n3. Submit your idea with a description\n4. Other users can upvote it\n5. AI loops automatically evaluate and prioritize popular requests\n\nThe system gets smarter over time — it learns from usage patterns and proactively suggests improvements!`,
      actions: [
        { label: 'Open Improve Panel', view: 'improvement' },
      ],
    };
  }

  // Improvement loops / self-improving
  if (/improve|loop|self.improv|health score|auto.*(improv|better)|ai.*(loop|improv)/i.test(lower)) {
    return {
      content: `## 🔄 AI Improvement Loops\n\nMASSIVE NUMBER is **self-improving** — it gets better every time you use it!\n\n**5 Loop Types:**\n1. ⚡ **Performance Loop** — Load times: 1850→1650ms, API latency: 320→230ms\n2. 🎨 **UX Loop** — Click depth: 3.2→2.1, Task completion: 78→89%\n3. 🧠 **Model Quality Loop** — Satisfaction: 4.2→4.5, Quality: 85→91%\n4. 🔄 **Error Recovery Loop** — Error rate: 2.1→0.8%, Recovery: 65→88%\n5. 💡 **Feature Suggestion Loop** — Utilization: 62→78%, Fulfillment: 71→85%\n\n**Health Score: 96/100** 🟢\n\nEach loop runs analysis, generates findings, and creates actionable improvements. Feature suggestions are auto-generated and users can vote on them.`,
      actions: [
        { label: 'Open Improve Panel', view: 'improvement' },
      ],
    };
  }

  // What's new
  if (/what.*(new|updated|changed|latest)|changelog|release|recent/i.test(lower)) {
    return {
      content: `## ✨ What's New in v2.0\n\n**🆕 Dev Surfaces Expansion**\n25 specialized workspaces covering Game Dev, Web3, AI/ML, Audio, Video, GIS, IoT, and more!\n\n**🆕 Model Health Checking**\nReal-time health monitoring for 21 models across 10+ providers with auto-failover when models go down.\n\n**🆕 BYOK Support**\nBring your own API keys for OpenAI, Anthropic, Google, DeepSeek, and custom endpoints.\n\n**🆕 Local Model Integration**\nConnect LM Studio, Ollama, or any OpenAI-compatible local server.\n\n**🆕 AI Improvement Loops**\n5 self-improving loop types that continuously optimize the platform.\n\n**🆕 Billing & Subscriptions**\nStripe-powered billing with Free, Pro ($8/mo), and Enterprise ($49/mo) tiers.\n\n**🆕 New Panels**\nMCP Hub, Git Integration, Collaboration, Spec-to-Code, Marketplace, Competitive Comparison, and more!`,
      actions: [
        { label: 'View Surfaces', view: 'dev-surfaces' },
        { label: 'Open Improve Panel', view: 'improvement' },
        { label: 'View Account', view: 'account' },
      ],
    };
  }

  // MCP
  if (/mcp|model context protocol|context server/i.test(lower)) {
    return {
      content: `## 🔌 MCP Hub (Model Context Protocol)\n\nThe **MCP Hub** lets you connect external context servers to give AI models access to real-time data and tools.\n\n**What you can do:**\n• Connect MCP servers for custom data sources\n• Give AI access to your databases, APIs, and services\n• Enable tool use for multi-step operations\n• Manage server connections and health\n\nOpen the MCP panel to browse available servers and add your own!`,
      actions: [
        { label: 'Open MCP Hub', view: 'mcp' },
      ],
    };
  }

  // Git
  if (/git|github|version control|commit|branch|repo/i.test(lower)) {
    return {
      content: `## 🔀 Git Integration\n\nMASSIVE NUMBER includes built-in Git support:\n\n• **Connect repos** — Link your GitHub repositories\n• **Auto-commit** — AI-generated code can be committed automatically\n• **Branch management** — Create, switch, and merge branches\n• **Diff viewing** — See changes before committing\n• **Pull & push** — Full sync with remote repos\n\nOpen the Git panel to get started!`,
      actions: [
        { label: 'Open Git', view: 'git' },
      ],
    };
  }

  // Collab
  if (/collab|team|share|real.time|together/i.test(lower)) {
    return {
      content: `## 👥 Collaboration\n\nReal-time collaboration features:\n\n• **Live editing** — Multiple users can work on the same project\n• **Shared sessions** — Invite team members to your workspace\n• **Chat integration** — Discuss changes in real-time\n• **Role-based access** — Control who can edit or view\n\nOpen the Collab panel to start a session!`,
      actions: [
        { label: 'Open Collab', view: 'collab' },
      ],
    };
  }

  // Spec
  if (/spec|specification|requirement|design doc/i.test(lower)) {
    return {
      content: `## 📋 Spec-to-Code Pipeline\n\nTurn specifications into working code:\n\n1. **Write a spec** in natural language or structured format\n2. **AI analyzes** the requirements and generates a plan\n3. **Auto-generates** project structure, components, and tests\n4. **Review & iterate** — Refine the output with feedback\n5. **Deploy** — Ship the generated code to any platform\n\nOpen the Specs panel to create your first specification!`,
      actions: [
        { label: 'Open Specs', view: 'spec' },
      ],
    };
  }

  // Marketplace
  if (/marketplace|plugin|extension|integrat|addon/i.test(lower)) {
    return {
      content: `## 🏪 Marketplace\n\nBrowse and install integrations from the MASSIVE marketplace:\n\n• **AI Plugins** — Custom model providers and tools\n• **Theme Packs** — Additional themes and UI customizations\n• **Template Packs** — Project templates for various stacks\n• **Connector Packs** — Integrations with popular services\n• **Community Modules** — Built and shared by other users\n\nOpen the Marketplace panel to explore!`,
      actions: [
        { label: 'Open Marketplace', view: 'marketplace' },
      ],
    };
  }

  // Competitive / comparison
  if (/compar|compet|vs|versus|better than|alternativ/i.test(lower)) {
    return {
      content: `## 🏆 Competitive Model Comparison\n\nCompare AI models side-by-side:\n\n• **Response quality** — Side-by-side output comparison\n• **Speed benchmarks** — Latency and throughput metrics\n• **Cost analysis** — Token costs across providers\n• **Feature matrix** — Capabilities, context windows, and limits\n• **Health scores** — Real-time availability and reliability\n\nOpen the Compare panel to benchmark models!`,
      actions: [
        { label: 'Open Compare', view: 'competitive' },
      ],
    };
  }

  // Templates
  if (/template|starter|boilerplate|scaffold/i.test(lower)) {
    return {
      content: `## 📄 Project Templates\n\nJump-start your project with pre-built templates:\n\n• **Web Apps** — Next.js, React, Vue, Svelte\n• **Mobile Apps** — React Native, Flutter\n• **APIs** — Express, FastAPI, Django REST\n• **Games** — Unity, Unreal, Godot starters\n• **Fullstack** — Complete app templates with auth, DB, and deployment\n\nOpen the Templates panel to browse and use templates!`,
      actions: [
        { label: 'Open Templates', view: 'templates' },
      ],
    };
  }

  // Context memory
  if (/context|memory|remember|persist|history/i.test(lower)) {
    return {
      content: `## 🧠 Context Memory\n\nMASSIVE NUMBER remembers your context across sessions:\n\n• **Persistent context** — AI remembers previous conversations and preferences\n• **Project context** — Code, specs, and decisions are saved per project\n• **Custom memory** — Add notes, references, and important details\n• **Auto-summarization** — Long conversations are condensed for efficient recall\n\nOpen the Memory panel to manage your context!`,
      actions: [
        { label: 'Open Memory', view: 'context' },
      ],
    };
  }

  // Customization / themes
  if (/theme|custom|font|style|dark|light|appearance|look/i.test(lower)) {
    return {
      content: `## 🎨 Customization Hub\n\nPersonalize your MASSIVE NUMBER experience:\n\n• **Themes** — Dark mode (default), custom color schemes\n• **Fonts** — Choose from multiple coding and UI fonts\n• **Layout** — Customize sidebar, panel sizes, and arrangement\n• **Keybindings** — Vim, Emacs, or custom shortcuts\n• **Accent colors** — Emerald, Teal, Amber, Orange (and more)\n\nOpen the Theme panel to customize!`,
      actions: [
        { label: 'Open Theme', view: 'customization' },
      ],
    };
  }

  // Notifications
  if (/notif|alert|bell|remind|update/i.test(lower)) {
    return {
      content: `## 🔔 Notifications\n\nStay informed with the notification system:\n\n• **Model status** — Alerts when models go down or recover\n• **Agent progress** — Updates on long-running agent tasks\n• **Collaboration** — Team activity and mentions\n• **System updates** — New features and improvements\n• **Usage alerts** — Token limit warnings\n\nOpen the Alerts panel to configure your notifications!`,
      actions: [
        { label: 'Open Alerts', view: 'notifications' },
      ],
    };
  }

  // Search / web grounding
  if (/search|web search|grounding|real.time|internet|look up|find/i.test(lower)) {
    return {
      content: `## 🌐 Web Search & Grounding\n\nMASSIVE NUMBER can search the web for real-time information:\n\n• **Web grounding** — AI searches the internet before responding\n• **Source citations** — Every web result includes a source link\n• **Real-time data** — Get current information, not just training data\n• **Search panel** — Dedicated search interface for web queries\n\nSwitch to the Search panel or enable web grounding in chat mode!`,
      actions: [
        { label: 'Open Search', view: 'search' },
        { label: 'Open Chat', view: 'chat' },
      ],
    };
  }

  // Code generation / debugging
  if (/code|debug|program|syntax|error|fix|bug|explain code/i.test(lower)) {
    return {
      content: `## 💻 Code Generation & Debugging\n\nMASSIVE NUMBER is a powerful coding assistant:\n\n• **Code generation** — Write code from natural language descriptions\n• **Debugging** — Paste errors and get fix suggestions\n• **Code explanation** — Select code and get line-by-line analysis\n• **Syntax highlighting** — Markdown rendering with code highlighting\n• **Multi-language** — Python, TypeScript, Rust, Go, and 50+ more\n• **Editor panel** — Full code editor with AI assistance\n\nTry the Editor panel or ask in Chat mode!`,
      actions: [
        { label: 'Open Editor', view: 'editor' },
        { label: 'Open Chat', view: 'chat' },
      ],
    };
  }

  // Persona
  if (/persona|mode|role|character|personality/i.test(lower)) {
    return {
      content: `## 🎭 Persona System\n\nUse different AI modes for different tasks:\n\n• **Default** — General-purpose assistant\n• **Coder** — Focused on code generation and debugging\n• **Writer** — Creative writing and content\n• **Analyst** — Data analysis and insights\n• **Architect** — System design and architecture\n\nCreate custom personas on the Pro plan! Personas change the AI's behavior, tone, and expertise focus.`,
      actions: [
        { label: 'Open Chat', view: 'chat' },
      ],
    };
  }

  // Export
  if (/export|download|save|markdown|json/i.test(lower)) {
    return {
      content: `## 📤 Chat Export\n\nExport your conversations in multiple formats:\n\n• **Markdown** — Clean, readable format for documentation\n• **JSON** — Structured data for programmatic use\n• **Preserved formatting** — Code blocks, lists, and links maintained\n\nUse the export button in any chat session!`,
      actions: [
        { label: 'Open Chat', view: 'chat' },
      ],
    };
  }

  // Help / what can you do
  if (/help|what can you|what do you|capabilit|feature|everything/i.test(lower)) {
    return {
      content: `## 🎯 I Know EVERYTHING About MASSIVE NUMBER\n\nHere's what I can help with:\n\n**🤖 AI Models**\n• 16+ free models from 10+ providers\n• Auto model selection with health checking\n• BYOK (Bring Your Own Key)\n• Local models (LM Studio, Ollama)\n\n**🎮 Dev Surfaces (25)**\n• From Game Dev to Blockchain\n• From 3D Modeling to IoT\n• Each opens in the right workspace\n\n**💰 Billing**\n• Free / Pro ($8) / Enterprise ($49)\n• Token usage tracking\n• Stripe-powered\n\n**🔄 Self-Improving AI**\n• 5 improvement loop types\n• Health score dashboard (96/100)\n• Feature suggestions & voting\n\n**🛠️ Tools**\n• MCP Hub, Git, Collab, Spec-to-Code\n• Marketplace, Templates, Notifications\n• Context Memory, Customization Hub\n\nJust ask me anything!`,
      actions: [
        { label: 'View Surfaces', view: 'dev-surfaces' },
        { label: 'Open Chat', view: 'chat' },
        { label: 'View Account', view: 'account' },
      ],
    };
  }

  // Fallback
  return {
    content: `I'd be happy to help with that! Here's what I know about:\n\n• **Getting started** — How to use the platform\n• **25 Dev Surfaces** — Specialized workspaces\n• **16+ Free AI Models** — All available models\n• **Pricing** — Free, Pro, Enterprise plans\n• **BYOK** — Use your own API keys\n• **Local Models** — LM Studio, Ollama\n• **Deployment** — Git, Specs, Templates\n• **AI Improvement Loops** — Self-improving system\n• **MCP Hub, Git, Collab** — Integration tools\n\nTry asking something more specific, or click one of the suggestions below!`,
    actions: [
      { label: 'View Surfaces', view: 'dev-surfaces' },
      { label: 'Open Chat', view: 'chat' },
    ],
  };
}

// ── Main Component ─────────────────────────────────────────────────────

interface FloatingAssistantProps {
  onNavigate?: (view: PanelView) => void;
}

export function FloatingAssistant({ onNavigate }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm the **MASSIVE AI** assistant. I know everything about this platform — models, surfaces, pricing, BYOK, local models, and more. How can I help you?",
      actions: [
        { label: 'Get Started', view: 'chat' },
        { label: 'View Surfaces', view: 'dev-surfaces' },
      ],
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback((text?: string) => {
    const content = (text || inputValue).trim();
    if (!content) return;

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thinking delay
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const response = generateResponse(content);
      const assistantMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        actions: response.actions,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, delay);
  }, [inputValue]);

  const handleChipClick = useCallback((chipId: string) => {
    const chipMap: Record<string, string> = {
      'get-started': 'How do I get started?',
      'view-surfaces': 'What can I build?',
      'pricing': 'How much does it cost?',
      'use-my-key': 'Can I use my own API key?',
      'whats-new': "What's new?",
    };
    const query = chipMap[chipId];
    if (query) {
      handleSend(query);
    }
  }, [handleSend]);

  const handleAction = useCallback((action: AssistantAction) => {
    if (onNavigate) {
      onNavigate(action.view);
    }
  }, [onNavigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Simple markdown renderer for assistant messages
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-sm font-semibold text-white/90 mt-3 mb-1.5">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={i} className="text-base font-bold text-white/90 mt-3 mb-1.5">{line.replace('# ', '')}</h2>;
      }

      // List items
      if (line.startsWith('• ')) {
        return (
          <div key={i} className="flex gap-2 ml-1 my-0.5">
            <span className="text-emerald-400/60 shrink-0">•</span>
            <span className="text-[13px] text-white/70 leading-relaxed">
              {renderInlineMarkdown(line.replace('• ', ''))}
            </span>
          </div>
        );
      }

      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={i} className="flex gap-2 ml-1 my-0.5">
            <span className="text-emerald-400/60 shrink-0">{line.match(/^(\d+)\./)?.[1]}.</span>
            <span className="text-[13px] text-white/70 leading-relaxed">
              {renderInlineMarkdown(line.replace(/^\d+\.\s/, ''))}
            </span>
          </div>
        );
      }

      // Empty line
      if (!line.trim()) {
        return <div key={i} className="h-1.5" />;
      }

      // Regular paragraph
      return (
        <p key={i} className="text-[13px] text-white/70 leading-relaxed my-0.5">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Bold: **text**
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white/90 font-medium">{part}</strong>;
      }
      // Inline code: `text`
      const codeParts = part.split(/`([^`]+)`/g);
      return codeParts.map((cp, j) => {
        if (j % 2 === 1) {
          return <code key={`${i}-${j}`} className="text-[11px] font-mono bg-white/[0.06] text-emerald-400/80 px-1 py-0.5 rounded">{cp}</code>;
        }
        return <span key={`${i}-${j}`}>{cp}</span>;
      });
    });
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
            aria-label="Open AI Assistant"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
            <span className="absolute inset-[-2px] rounded-full border border-emerald-400/20" />

            <Bot className="h-6 w-6 text-white relative z-10 group-hover:scale-110 transition-transform" />

            {/* AI Badge */}
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-emerald-600 text-[9px] font-bold text-white flex items-center justify-center shadow-lg border border-emerald-400/30">
              AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-5 right-5 z-50 w-[380px] h-[520px] rounded-2xl border border-white/[0.08] bg-[#111]/95 backdrop-blur-xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.06] bg-[#0d0d0f]/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-white/90 tracking-tight">MASSIVE AI</span>
                  <span className="ml-1.5 text-[9px] font-medium text-emerald-400/80 bg-emerald-400/10 px-1.5 py-0.5 rounded">Assistant</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMessages([
                      {
                        id: 'welcome',
                        role: 'assistant',
                        content: "👋 Chat cleared! I'm ready to help. What would you like to know?",
                        actions: [
                          { label: 'Get Started', view: 'chat' },
                          { label: 'View Surfaces', view: 'dev-surfaces' },
                        ],
                        timestamp: new Date(),
                      },
                    ]);
                  }}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
                  aria-label="Clear chat"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-3 py-3">
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                        : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                    }`}>
                      {msg.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : 'U'}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[280px] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-3.5 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/15 border border-amber-500/10 rounded-br-md'
                          : 'bg-white/[0.04] border border-white/[0.06] rounded-bl-md'
                      }`}>
                        {msg.role === 'assistant' ? renderContent(msg.content) : (
                          <p className="text-[13px] text-white/80 leading-relaxed">{msg.content}</p>
                        )}
                      </div>

                      {/* Actions */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.actions.map((action, ai) => (
                            <button
                              key={ai}
                              onClick={() => handleAction(action)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/10 transition-colors"
                            >
                              {action.label}
                              <ArrowRight className="h-2.5 w-2.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                          className="h-1.5 w-1.5 rounded-full bg-emerald-400/60"
                        />
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                          className="h-1.5 w-1.5 rounded-full bg-emerald-400/60"
                        />
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                          className="h-1.5 w-1.5 rounded-full bg-emerald-400/60"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Suggestion chips */}
            <div className="px-3 py-2 border-t border-white/[0.04] shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleChipClick(chip.id)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.04] transition-colors"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1 shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 h-10 focus-within:border-emerald-500/30 focus-within:bg-white/[0.06] transition-colors">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about MASSIVE NUMBER..."
                  className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/25 outline-none min-w-0"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                    inputValue.trim() && !isTyping
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-white/[0.04] text-white/15'
                  }`}
                  aria-label="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
