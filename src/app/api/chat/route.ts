import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Model cost mapping per 1K tokens
const MODEL_COST_MAP: Record<string, number> = {
  auto: 0.003,
  'gpt-4o': 0.005,
  'claude-sonnet-4-20250514': 0.003,
  'gemini-2.5-pro': 0.002,
  'deepseek-r1': 0.001,
  'llama-4-maverick': 0.0005,
  'qwen3-235b': 0.001,
};

// Map friendly model names to SDK-compatible model IDs
const MODEL_ID_MAP: Record<string, string> = {
  auto: 'auto',
  'gpt-4o': 'gpt-4o',
  'claude-sonnet': 'claude-sonnet-4-20250514',
  'gemini-pro': 'gemini-2.5-pro',
  'deepseek-chat': 'deepseek-r1',
  'llama-3.1': 'llama-4-maverick',
  'qwen3-235b': 'qwen3-235b',
};

function resolveModel(model: string): string {
  return MODEL_ID_MAP[model] || model;
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

function calculateCost(tokens: number, model: string): number {
  const costPer1k = MODEL_COST_MAP[model] || 0.003;
  return (tokens / 1000) * costPer1k;
}

// GET - List recent chats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = { userId };
    if (projectId) {
      where.projectId = projectId;
    }

    const chats = await db.chat.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.chat.count({ where });

    return NextResponse.json({ chats, total, limit, offset });
  } catch (error) {
    console.error('Chat list error:', error);
    return NextResponse.json(
      { error: 'Failed to list chats' },
      { status: 500 }
    );
  }
}

// POST - Send message and get AI response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = 'auto', mode = 'chat', userId = 'default', projectId, chatId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const selectedModel = resolveModel(model);
    const startTime = Date.now();

    // Create or find chat
    let chat;
    if (chatId) {
      chat = await db.chat.findUnique({
        where: { id: chatId },
        include: { messages: true },
      });
      if (!chat) {
        return NextResponse.json(
          { error: 'Chat not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new chat
      const title = messages[0]?.content?.slice(0, 50) || 'New Chat';
      chat = await db.chat.create({
        data: {
          title,
          userId,
          model: selectedModel,
          mode,
          projectId: projectId || null,
        },
        include: { messages: true },
      });
    }

    // Save user messages to database
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === 'user') {
      await db.message.create({
        data: {
          chatId: chat.id,
          role: 'user',
          content: userMessage.content,
          model: selectedModel,
        },
      });
    }

    // Call AI SDK
    const zai = await ZAI.create();
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    let assistantContent = '';
    try {
      const completion = await zai.chat.completions.create({
        messages: formattedMessages,
        model: selectedModel === 'auto' ? undefined : selectedModel,
      });

      assistantContent = completion.choices?.[0]?.message?.content || '';
    } catch (aiError) {
      console.error('AI completion error:', aiError);
      // Fallback response if AI call fails
      assistantContent = 'I apologize, but I encountered an error processing your request. Please try again.';
    }

    const duration = Date.now() - startTime;
    const inputTokens = estimateTokens(messages.map((m: { content: string }) => m.content).join(''));
    const outputTokens = estimateTokens(assistantContent);
    const totalTokens = inputTokens + outputTokens;
    const cost = calculateCost(totalTokens, selectedModel);

    // Save assistant message to database
    const assistantMessage = await db.message.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: assistantContent,
        model: selectedModel,
        tokens: totalTokens,
        cost,
        duration,
      },
    });

    // Update chat timestamp
    await db.chat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      chatId: chat.id,
      message: assistantMessage,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        duration,
        model: selectedModel,
      },
    });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
