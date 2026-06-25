import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// In-memory spec storage
interface Spec {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  designNotes: string;
  implementationSteps: Array<{ name: string; description: string }>;
  testCriteria: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  affectedFiles: string[];
  status: 'draft' | 'approved' | 'implementing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

const specs: Spec[] = [
  {
    id: 'spec-1',
    title: 'MCP Server Registry',
    description: 'Build a registry system for managing MCP server connections with connect/disconnect capabilities',
    requirements: [
      'List all available MCP servers with status',
      'Connect and disconnect servers',
      'Track available tools per server',
      'Filter by category and status',
    ],
    designNotes: 'The MCP hub should provide a unified interface for managing all MCP server connections. Each server exposes tools that can be invoked by the agent system.',
    implementationSteps: [
      { name: 'Define MCP server types', description: 'Create TypeScript interfaces for MCP servers, tools, and connection state' },
      { name: 'Build API routes', description: 'Implement GET/POST/DELETE handlers for MCP server management' },
      { name: 'Add tool registry', description: 'Build a tool registry that aggregates tools from all connected servers' },
      { name: 'Implement filtering', description: 'Add category and status filtering for server listing' },
    ],
    testCriteria: [
      'Can list all available servers',
      'Can connect/disconnect servers',
      'Status updates correctly on connect/disconnect',
      'Filtering works by category and status',
    ],
    estimatedComplexity: 'medium',
    affectedFiles: ['src/app/api/mcp/route.ts', 'src/lib/mcp-registry.ts'],
    status: 'completed',
    createdAt: '2026-06-24T10:00:00Z',
    updatedAt: '2026-06-25T14:30:00Z',
  },
  {
    id: 'spec-2',
    title: 'Voice-to-Code Pipeline',
    description: 'Enable developers to write code using voice commands with TTS feedback',
    requirements: [
      'Support speech-to-text transcription',
      'Support text-to-speech for AI responses',
      'Multiple voice options',
      'Word-level confidence scores',
    ],
    designNotes: 'Voice integration should feel natural and responsive. The TTS should use high-quality voices for code explanations, and ASR should handle technical terminology well.',
    implementationSteps: [
      { name: 'Setup voice API routes', description: 'Create POST handler for TTS and ASR operations' },
      { name: 'Integrate z-ai-web-dev-sdk', description: 'Use SDK for TTS and ASR capabilities' },
      { name: 'Add voice selection UI', description: 'Build voice selector component with preview' },
      { name: 'Implement real-time streaming', description: 'Add streaming support for live voice input' },
    ],
    testCriteria: [
      'TTS generates audio from text',
      'ASR transcribes audio to text',
      'Multiple voices available',
      'Confidence scores returned with transcription',
    ],
    estimatedComplexity: 'high',
    affectedFiles: ['src/app/api/voice/route.ts', 'src/components/nexus/voice-input.tsx'],
    status: 'implementing',
    createdAt: '2026-06-25T09:00:00Z',
    updatedAt: '2026-06-26T11:00:00Z',
  },
];

// GET - List specs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const complexity = searchParams.get('complexity');

    let filtered = [...specs];

    if (status) {
      filtered = filtered.filter((s) => s.status === status);
    }

    if (complexity) {
      filtered = filtered.filter((s) => s.estimatedComplexity === complexity);
    }

    return NextResponse.json({
      specs: filtered,
      total: filtered.length,
      meta: {
        draft: specs.filter((s) => s.status === 'draft').length,
        approved: specs.filter((s) => s.status === 'approved').length,
        implementing: specs.filter((s) => s.status === 'implementing').length,
        completed: specs.filter((s) => s.status === 'completed').length,
      },
    });
  } catch (error) {
    console.error('Specs GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list specs' },
      { status: 500 }
    );
  }
}

// POST - Create a new spec from natural language description using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required to generate a spec' },
        { status: 400 }
      );
    }

    // Use z-ai-web-dev-sdk to generate structured spec from description
    let generatedSpec: Partial<Spec> = {};

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a software specification generator. Given a feature description, generate a structured specification in JSON format with these fields:
- title: A concise feature title
- requirements: Array of 3-6 requirement strings
- designNotes: A paragraph of design considerations
- implementationSteps: Array of 3-5 objects with "name" and "description" fields
- testCriteria: Array of 3-5 test criteria strings
- estimatedComplexity: One of "low", "medium", or "high"
- affectedFiles: Array of 2-4 likely file paths

Respond ONLY with valid JSON, no markdown or explanation.`,
          },
          {
            role: 'user',
            content: description,
          },
        ],
      });

      const content = completion.choices?.[0]?.message?.content || '';

      // Try to parse the AI response as JSON
      try {
        // Handle potential markdown code blocks
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        generatedSpec = JSON.parse(jsonStr);
      } catch {
        console.error('Failed to parse AI spec response as JSON, using fallback extraction');
        // Fallback: extract what we can from the text
        generatedSpec = {
          title: description.slice(0, 50),
          requirements: ['Implement the described feature', 'Add proper error handling', 'Write unit tests'],
          designNotes: content.slice(0, 200),
          implementationSteps: [
            { name: 'Analyze requirements', description: 'Break down the feature into components' },
            { name: 'Implement core logic', description: 'Build the main functionality' },
            { name: 'Add error handling', description: 'Ensure robust error handling' },
            { name: 'Write tests', description: 'Add comprehensive test coverage' },
          ],
          testCriteria: ['Feature works as described', 'Error handling is robust', 'Tests pass'],
          estimatedComplexity: 'medium' as const,
          affectedFiles: ['src/app/api/new-feature/route.ts'],
        };
      }
    } catch (aiError) {
      console.error('AI spec generation error, using fallback:', aiError);
      // Fallback without AI
      generatedSpec = {
        title: description.slice(0, 60),
        requirements: [
          'Implement the described feature',
          'Ensure proper TypeScript types',
          'Add error handling',
          'Write documentation',
        ],
        designNotes: `This spec was generated from the description: "${description}". The implementation should follow the existing project patterns and use the established tech stack.`,
        implementationSteps: [
          { name: 'Requirements analysis', description: 'Analyze the feature requirements and design the solution' },
          { name: 'Implementation', description: 'Build the core feature functionality' },
          { name: 'Testing', description: 'Write and run tests for the feature' },
          { name: 'Documentation', description: 'Document the feature and API' },
        ],
        testCriteria: [
          'Feature implements the described functionality',
          'TypeScript types are correct',
          'Error handling works properly',
          'API responses are well-structured',
        ],
        estimatedComplexity: 'medium' as const,
        affectedFiles: ['src/app/api/new-feature/route.ts', 'src/lib/feature.ts'],
      };
    }

    // Build the complete spec
    const newSpec: Spec = {
      id: `spec-${Date.now()}`,
      title: generatedSpec.title || description.slice(0, 60),
      description,
      requirements: generatedSpec.requirements || [],
      designNotes: generatedSpec.designNotes || '',
      implementationSteps: generatedSpec.implementationSteps || [],
      testCriteria: generatedSpec.testCriteria || [],
      estimatedComplexity: generatedSpec.estimatedComplexity || 'medium',
      affectedFiles: generatedSpec.affectedFiles || [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    specs.unshift(newSpec);

    return NextResponse.json({
      spec: newSpec,
      message: 'Spec generated successfully from description',
    }, { status: 201 });
  } catch (error) {
    console.error('Specs POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate spec' },
      { status: 500 }
    );
  }
}

// PUT - Update spec status (draft → approved → implementing → completed)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Spec ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'approved', 'implementing', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const specIndex = specs.findIndex((s) => s.id === id);
    if (specIndex === -1) {
      return NextResponse.json(
        { error: `Spec '${id}' not found` },
        { status: 404 }
      );
    }

    // Validate status transitions
    const currentStatus = specs[specIndex].status;
    const transitionOrder = ['draft', 'approved', 'implementing', 'completed'];
    const currentIndex = transitionOrder.indexOf(currentStatus);
    const newIndex = transitionOrder.indexOf(status);

    // Allow moving forward or backward to draft
    if (newIndex > currentIndex + 1 && newIndex !== transitionOrder.length - 1) {
      return NextResponse.json(
        { error: `Cannot transition from '${currentStatus}' to '${status}'. Valid next status: '${transitionOrder[currentIndex + 1]}'` },
        { status: 400 }
      );
    }

    specs[specIndex].status = status as Spec['status'];
    specs[specIndex].updatedAt = new Date().toISOString();

    return NextResponse.json({
      spec: specs[specIndex],
      previousStatus: currentStatus,
      message: `Spec status updated from '${currentStatus}' to '${status}'`,
    });
  } catch (error) {
    console.error('Specs PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update spec status' },
      { status: 500 }
    );
  }
}
