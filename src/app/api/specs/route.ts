import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// GET - List specs FROM DATABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const complexity = searchParams.get('complexity');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (complexity) where.complexity = complexity;

    const specs = await db.spec.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      specs: specs.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        requirements: JSON.parse(s.requirements),
        designNotes: s.designNotes,
        implementationSteps: JSON.parse(s.implementationSteps),
        testCriteria: JSON.parse(s.testCriteria),
        estimatedComplexity: s.complexity,
        affectedFiles: JSON.parse(s.affectedFiles),
        status: s.status,
        model: s.model,
        projectId: s.projectId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      total: specs.length,
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

// POST - Create a new spec from natural language description using AI, save to DB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, projectId } = body;

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required to generate a spec' },
        { status: 400 }
      );
    }

    let generatedSpec: {
      title?: string;
      requirements?: string[];
      designNotes?: string;
      implementationSteps?: Array<{ name: string; description: string }>;
      testCriteria?: string[];
      estimatedComplexity?: string;
      affectedFiles?: string[];
    } = {};

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

      try {
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        generatedSpec = JSON.parse(jsonStr);
      } catch {
        console.error('Failed to parse AI spec response as JSON');
        generatedSpec = {
          title: description.slice(0, 50),
          requirements: ['Implement the described feature', 'Add proper error handling', 'Write unit tests'],
          designNotes: content.slice(0, 200),
          implementationSteps: [
            { name: 'Analyze requirements', description: 'Break down the feature into components' },
            { name: 'Implement core logic', description: 'Build the main functionality' },
            { name: 'Add error handling', description: 'Ensure robust error handling' },
          ],
          testCriteria: ['Feature works as described', 'Error handling is robust'],
          estimatedComplexity: 'medium',
          affectedFiles: ['src/app/api/new-feature/route.ts'],
        };
      }
    } catch (aiError) {
      console.error('AI spec generation error:', aiError);
      generatedSpec = {
        title: description.slice(0, 60),
        requirements: ['Implement the described feature', 'Ensure proper TypeScript types', 'Add error handling'],
        designNotes: `Spec generated from description: "${description}"`,
        implementationSteps: [
          { name: 'Requirements analysis', description: 'Analyze the feature requirements' },
          { name: 'Implementation', description: 'Build the core feature functionality' },
          { name: 'Testing', description: 'Write and run tests for the feature' },
        ],
        testCriteria: ['Feature implements the described functionality', 'TypeScript types are correct'],
        estimatedComplexity: 'medium',
        affectedFiles: ['src/app/api/new-feature/route.ts'],
      };
    }

    // Save to database
    const spec = await db.spec.create({
      data: {
        title: generatedSpec.title || description.slice(0, 60),
        description,
        requirements: JSON.stringify(generatedSpec.requirements || []),
        designNotes: generatedSpec.designNotes || '',
        implementationSteps: JSON.stringify(generatedSpec.implementationSteps || []),
        testCriteria: JSON.stringify(generatedSpec.testCriteria || []),
        complexity: generatedSpec.estimatedComplexity || 'medium',
        affectedFiles: JSON.stringify(generatedSpec.affectedFiles || []),
        status: 'draft',
        projectId: projectId || null,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'spec_create',
        entity: 'Spec',
        entityId: spec.id,
        description: `Created spec: ${spec.title}`,
        metadata: JSON.stringify({ title: spec.title, complexity: spec.complexity }),
      },
    });

    return NextResponse.json({
      spec: {
        id: spec.id,
        title: spec.title,
        description: spec.description,
        requirements: JSON.parse(spec.requirements),
        designNotes: spec.designNotes,
        implementationSteps: JSON.parse(spec.implementationSteps),
        testCriteria: JSON.parse(spec.testCriteria),
        estimatedComplexity: spec.complexity,
        affectedFiles: JSON.parse(spec.affectedFiles),
        status: spec.status,
        projectId: spec.projectId,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      },
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

// PUT - Update spec status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { specId, status } = body;

    if (!specId) {
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

    const existing = await db.spec.findUnique({ where: { id: specId } });
    if (!existing) {
      return NextResponse.json(
        { error: `Spec '${specId}' not found` },
        { status: 404 }
      );
    }

    const spec = await db.spec.update({
      where: { id: specId },
      data: { status },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'spec_update',
        entity: 'Spec',
        entityId: specId,
        description: `Spec status updated from '${existing.status}' to '${status}'`,
        metadata: JSON.stringify({ previousStatus: existing.status, newStatus: status }),
      },
    });

    return NextResponse.json({
      spec: {
        id: spec.id,
        title: spec.title,
        description: spec.description,
        requirements: JSON.parse(spec.requirements),
        designNotes: spec.designNotes,
        implementationSteps: JSON.parse(spec.implementationSteps),
        testCriteria: JSON.parse(spec.testCriteria),
        estimatedComplexity: spec.complexity,
        affectedFiles: JSON.parse(spec.affectedFiles),
        status: spec.status,
        projectId: spec.projectId,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      },
      previousStatus: existing.status,
      message: `Spec status updated from '${existing.status}' to '${status}'`,
    });
  } catch (error) {
    console.error('Specs PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update spec status' },
      { status: 500 }
    );
  }
}
