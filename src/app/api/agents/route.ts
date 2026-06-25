import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Agent workflow steps
const AGENT_STEPS = [
  { name: 'Analyzing codebase', icon: '🔍' },
  { name: 'Searching for patterns', icon: '🔎' },
  { name: 'Generating implementation', icon: '⚡' },
  { name: 'Running tests', icon: '🧪' },
  { name: 'Applying fixes', icon: '🔧' },
];

// GET - List agent runs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const agents = await db.agentRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.agentRun.count({ where });

    // Parse steps JSON for each agent
    const agentsWithParsedSteps = agents.map((agent) => ({
      ...agent,
      steps: JSON.parse(agent.steps),
    }));

    return NextResponse.json({ agents: agentsWithParsedSteps, total, limit, offset });
  } catch (error) {
    console.error('Agent list error:', error);
    return NextResponse.json(
      { error: 'Failed to list agent runs' },
      { status: 500 }
    );
  }
}

// POST - Create and execute an agent run
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, model = 'auto', projectId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Initialize agent steps with pending status
    const initialSteps = AGENT_STEPS.map((step, index) => ({
      id: index + 1,
      name: step.name,
      icon: step.icon,
      status: index === 0 ? 'running' : 'pending',
      startedAt: index === 0 ? new Date().toISOString() : null,
      completedAt: null,
      output: null,
    }));

    // Create agent run in database
    const agentRun = await db.agentRun.create({
      data: {
        projectId,
        name,
        description: description || null,
        model,
        status: 'running',
        steps: JSON.stringify(initialSteps),
      },
    });

    // Execute agent workflow asynchronously
    executeAgentWorkflow(agentRun.id, model, name, description).catch((err) => {
      console.error('Agent workflow error:', err);
    });

    return NextResponse.json({
      ...agentRun,
      steps: initialSteps,
    }, { status: 201 });
  } catch (error) {
    console.error('Agent create error:', error);
    return NextResponse.json(
      { error: 'Failed to create agent run' },
      { status: 500 }
    );
  }
}

// PATCH - Update agent run status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, steps, result } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Agent run ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.agentRun.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Agent run not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (steps) updateData.steps = JSON.stringify(steps);
    if (result !== undefined) updateData.result = result;

    const updated = await db.agentRun.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      steps: JSON.parse(updated.steps),
    });
  } catch (error) {
    console.error('Agent update error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent run' },
      { status: 500 }
    );
  }
}

// Simulated agent workflow execution
async function executeAgentWorkflow(
  agentRunId: string,
  model: string,
  name: string,
  description: string | null
) {
  const steps = AGENT_STEPS.map((step, index) => ({
    id: index + 1,
    name: step.name,
    icon: step.icon,
    status: index === 0 ? 'running' : 'pending',
    startedAt: new Date().toISOString(),
    completedAt: null,
    output: null,
  }));

  let totalTokens = 0;
  let totalCost = 0;
  const startTime = Date.now();

  for (let i = 0; i < AGENT_STEPS.length; i++) {
    const step = AGENT_STEPS[i];
    steps[i].status = 'running';
    steps[i].startedAt = new Date().toISOString();

    // Update database with running step
    await db.agentRun.update({
      where: { id: agentRunId },
      data: { steps: JSON.stringify(steps) },
    });

    try {
      // Use AI for the "Generating implementation" step
      let output = '';
      if (i === 2) {
        // Generating implementation - use actual AI
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an expert coding agent. Generate a concise implementation plan.',
            },
            {
              role: 'user',
              content: `Generate an implementation plan for: ${name}${description ? `\nDescription: ${description}` : ''}`,
            },
          ],
          model: model === 'auto' ? undefined : model,
        });
        output = completion.choices?.[0]?.message?.content || 'Implementation plan generated.';
        const stepTokens = Math.ceil(output.length / 4);
        totalTokens += stepTokens;
        totalCost += (stepTokens / 1000) * 0.003;
      } else {
        // Simulate other steps
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));
        const outputs = [
          'Codebase structure analyzed. Found 47 files across 8 directories.',
          'Identified 12 patterns and 3 potential optimization areas.',
          '', // Filled by AI above
          'All 23 tests passed. 0 failures detected.',
          'Applied 2 fixes: updated imports, resolved type errors.',
        ];
        output = outputs[i];
      }

      steps[i].status = 'completed';
      steps[i].completedAt = new Date().toISOString();
      steps[i].output = output;
    } catch (error) {
      console.error(`Step ${i} error:`, error);
      steps[i].status = 'failed';
      steps[i].completedAt = new Date().toISOString();
      steps[i].output = 'Step failed due to an error.';

      // Mark agent as failed
      await db.agentRun.update({
        where: { id: agentRunId },
        data: {
          status: 'failed',
          steps: JSON.stringify(steps),
          result: `Failed at step: ${step.name}`,
        },
      });
      return;
    }

    // Update steps after each completion
    // Mark next step as pending if it exists
    if (i + 1 < AGENT_STEPS.length) {
      steps[i + 1].status = 'pending';
    }
  }

  const duration = Date.now() - startTime;

  // Generate final result
  const resultSummary = `Agent "${name}" completed successfully.\n\n${steps.map((s) => `${s.icon} ${s.name}: ${s.status}`).join('\n')}`;

  // Update agent run as completed
  await db.agentRun.update({
    where: { id: agentRunId },
    data: {
      status: 'completed',
      steps: JSON.stringify(steps),
      result: resultSummary,
      tokens: totalTokens,
      cost: totalCost,
      duration,
    },
  });
}
