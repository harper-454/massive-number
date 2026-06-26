import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Default dev surfaces to seed — colors match the design spec
const DEFAULT_DEV_SURFACES = [
  {
    name: 'Modeling',
    type: 'modeling',
    description: '3D/visual design workspace for creating and editing 3D models, scenes, and visual assets with real-time rendering',
    icon: '🎨',
    color: '#f43f5e',
    tools: JSON.stringify(['three.js', 'blender', 'spline', 'react-three-fiber', 'drei']),
    layout: JSON.stringify({ left: 'scene-tree', center: 'viewport', right: 'properties', bottom: 'timeline' }),
    status: 'active',
    sortOrder: 0,
  },
  {
    name: 'Game Dev',
    type: 'game',
    description: 'Game development workspace with scene editor, scripting, physics engine, and asset management',
    icon: '🎮',
    color: '#8b5cf6',
    tools: JSON.stringify(['unity', 'unreal', 'godot', 'phaser', 'babylon.js']),
    layout: JSON.stringify({ left: 'hierarchy', center: 'scene', right: 'inspector', bottom: 'console' }),
    status: 'active',
    sortOrder: 1,
  },
  {
    name: 'Web Design',
    type: 'web-design',
    description: 'Visual web design workspace with drag-and-drop layout, styling tools, and responsive preview',
    icon: '🌐',
    color: '#10b981',
    tools: JSON.stringify(['figma', 'tailwind', 'framer-motion', 'storybook', 'radix']),
    layout: JSON.stringify({ left: 'layers', center: 'canvas', right: 'styles', bottom: 'assets' }),
    status: 'active',
    sortOrder: 2,
  },
  {
    name: 'Backend',
    type: 'backend',
    description: 'API/server development workspace with database browser, API testing, server logs, and middleware config',
    icon: '⚙️',
    color: '#f59e0b',
    tools: JSON.stringify(['prisma', 'express', 'postgresql', 'redis', 'docker']),
    layout: JSON.stringify({ left: 'file-tree', center: 'editor', right: 'api-tester', bottom: 'terminal' }),
    status: 'active',
    sortOrder: 3,
  },
  {
    name: 'Frontend',
    type: 'frontend',
    description: 'UI/component development workspace with live preview, component library, props editor, and style inspector',
    icon: '🖥️',
    color: '#06b6d4',
    tools: JSON.stringify(['react', 'next.js', 'tailwind', 'shadcn', 'typescript']),
    layout: JSON.stringify({ left: 'components', center: 'preview', right: 'props', bottom: 'console' }),
    status: 'active',
    sortOrder: 4,
  },
  {
    name: 'Fullstack',
    type: 'fullstack',
    description: 'End-to-end development workspace combining frontend, backend, and database tools in a unified layout',
    icon: '🔗',
    color: '#14b8a6',
    tools: JSON.stringify(['next.js', 'prisma', 'tailwind', 'api-routes', 'vercel']),
    layout: JSON.stringify({ left: 'file-tree', center: 'split-editor', right: 'preview', bottom: 'terminal' }),
    status: 'active',
    sortOrder: 5,
  },
  {
    name: 'Mobile',
    type: 'mobile',
    description: 'Mobile app development workspace with device preview, native APIs, hot reload, and app store deployment',
    icon: '📱',
    color: '#0ea5e9',
    tools: JSON.stringify(['react-native', 'expo', 'flutter', 'swift', 'kotlin']),
    layout: JSON.stringify({ left: 'navigator', center: 'device-preview', right: 'inspector', bottom: 'logs' }),
    status: 'active',
    sortOrder: 6,
  },
  {
    name: 'Data',
    type: 'data',
    description: 'Data science and analysis workspace with notebooks, visualization, ML model training, and statistical tools',
    icon: '📊',
    color: '#eab308',
    tools: JSON.stringify(['python', 'pandas', 'jupyter', 'matplotlib', 'tensorflow']),
    layout: JSON.stringify({ left: 'file-tree', center: 'notebook', right: 'variables', bottom: 'output' }),
    status: 'active',
    sortOrder: 7,
  },
  {
    name: 'API Design',
    type: 'api',
    description: 'REST/GraphQL API design workspace with schema editor, endpoint tester, documentation generator, and mocking',
    icon: '🔌',
    color: '#f97316',
    tools: JSON.stringify(['openapi', 'graphql', 'postman', 'swagger', 'insomnia']),
    layout: JSON.stringify({ left: 'endpoints', center: 'schema-editor', right: 'tester', bottom: 'docs' }),
    status: 'active',
    sortOrder: 8,
  },
  {
    name: 'DevOps',
    type: 'devops',
    description: 'CI/CD and infrastructure workspace with pipeline editor, monitoring dashboards, and deployment tools',
    icon: '🚀',
    color: '#71717a',
    tools: JSON.stringify(['docker', 'kubernetes', 'github-actions', 'terraform', 'aws']),
    layout: JSON.stringify({ left: 'pipelines', center: 'logs', right: 'config', bottom: 'terminal' }),
    status: 'active',
    sortOrder: 9,
  },
];

// Seed default surfaces if table is empty
async function seedIfEmpty() {
  const count = await db.devSurface.count();
  if (count === 0) {
    for (const surface of DEFAULT_DEV_SURFACES) {
      await db.devSurface.create({ data: surface });
    }
  }
}

// GET - List all dev surfaces
export async function GET() {
  try {
    await seedIfEmpty();

    const surfaces = await db.devSurface.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Parse JSON fields for response
    const parsedSurfaces = surfaces.map((surface) => ({
      ...surface,
      tools: JSON.parse(surface.tools),
      layout: JSON.parse(surface.layout),
    }));

    return NextResponse.json({ surfaces: parsedSurfaces });
  } catch (error) {
    console.error('DevSurfaces GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dev surfaces' },
      { status: 500 }
    );
  }
}

// POST - Create custom dev surface
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, description, icon, color, tools, layout } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    // Get the next sort order
    const maxSortOrder = await db.devSurface.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const surface = await db.devSurface.create({
      data: {
        name,
        type,
        description: description || null,
        icon: icon || null,
        color: color || '#10b981',
        tools: JSON.stringify(tools || []),
        layout: JSON.stringify(layout || {}),
        sortOrder,
      },
    });

    return NextResponse.json({
      surface: {
        ...surface,
        tools: JSON.parse(surface.tools),
        layout: JSON.parse(surface.layout),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('DevSurfaces POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create dev surface' },
      { status: 500 }
    );
  }
}

// PUT - Update dev surface
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, icon, color, tools, layout, sortOrder, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Surface ID is required' },
        { status: 400 }
      );
    }

    // Check if surface exists
    const existing = await db.devSurface.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Dev surface not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Prisma.DevSurfaceUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (tools !== undefined) updateData.tools = JSON.stringify(tools);
    if (layout !== undefined) updateData.layout = JSON.stringify(layout);
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (status !== undefined) updateData.status = status;

    const surface = await db.devSurface.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      surface: {
        ...surface,
        tools: JSON.parse(surface.tools),
        layout: JSON.parse(surface.layout),
      },
    });
  } catch (error) {
    console.error('DevSurfaces PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update dev surface' },
      { status: 500 }
    );
  }
}

// DELETE - Delete dev surface
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Surface ID is required' },
        { status: 400 }
      );
    }

    // Check if surface exists
    const existing = await db.devSurface.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Dev surface not found' },
        { status: 404 }
      );
    }

    await db.devSurface.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DevSurfaces DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete dev surface' },
      { status: 500 }
    );
  }
}
