export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { isDbAvailable, FALLBACK_SURFACES } from '@/lib/db-fallback';
import type { Prisma } from '@prisma/client';

// Default dev surfaces to seed — 25 surfaces across all domains
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
  // ── New Surfaces (15 additions) ────────────────────────────────────────
  {
    name: '3D Modeling',
    type: '3d-modeling',
    description: 'Professional 3D asset creation, sculpting, rigging, and animation with industry-standard tools',
    icon: '🧊',
    color: '#ec4899',
    tools: JSON.stringify(['blender', 'three.js', 'spline', 'zbrush', 'maya']),
    layout: JSON.stringify({ left: 'outliner', center: '3d-viewport', right: 'properties', bottom: 'timeline' }),
    status: 'active',
    sortOrder: 10,
  },
  {
    name: 'Game SDK - Unity',
    type: 'unity',
    description: 'Full Unity game development with C# scripting, Prefabs, Physics, and NavMesh systems',
    icon: '🕹️',
    color: '#a855f7',
    tools: JSON.stringify(['unity-editor', 'c-sharp', 'prefabs', 'physics', 'navmesh']),
    layout: JSON.stringify({ left: 'hierarchy', center: 'scene-view', right: 'inspector', bottom: 'console' }),
    status: 'active',
    sortOrder: 11,
  },
  {
    name: 'Game SDK - Unreal',
    type: 'unreal',
    description: 'Full Unreal Engine development with Blueprints, C++, Niagara VFX, and Lumen lighting',
    icon: '🔥',
    color: '#6366f1',
    tools: JSON.stringify(['unreal-engine', 'blueprints', 'cpp', 'niagara', 'lumen']),
    layout: JSON.stringify({ left: 'world-outliner', center: 'viewport', right: 'details', bottom: 'output-log' }),
    status: 'active',
    sortOrder: 12,
  },
  {
    name: 'Game SDK - Godot',
    type: 'godot',
    description: 'Full Godot Engine development with GDScript, Scenes, Physics, and Shader editing',
    icon: '🎯',
    color: '#3b82f6',
    tools: JSON.stringify(['godot-engine', 'gdscript', 'scenes', 'physics', 'shaders']),
    layout: JSON.stringify({ left: 'scene-tree', center: '2d-3d-view', right: 'inspector', bottom: 'output' }),
    status: 'active',
    sortOrder: 13,
  },
  {
    name: 'Chrome Extension',
    type: 'chrome-ext',
    description: 'Browser extension development with Manifest V3, Content Scripts, Background Workers, and Chrome APIs',
    icon: '🧩',
    color: '#22c55e',
    tools: JSON.stringify(['manifest-v3', 'content-scripts', 'background-workers', 'devtools', 'chrome-apis']),
    layout: JSON.stringify({ left: 'file-tree', center: 'editor', right: 'manifest-editor', bottom: 'debugger' }),
    status: 'active',
    sortOrder: 14,
  },
  {
    name: 'VS Code Extension',
    type: 'vscode-ext',
    description: 'VS Code extension development with Extension API, Language Server, Webviews, and Debug Adapter',
    icon: '⚡',
    color: '#0ea5e9',
    tools: JSON.stringify(['extension-api', 'language-server', 'webviews', 'tree-views', 'debug-adapter']),
    layout: JSON.stringify({ left: 'api-explorer', center: 'extension-host', right: 'webview-preview', bottom: 'debug-console' }),
    status: 'active',
    sortOrder: 15,
  },
  {
    name: 'Blockchain/Web3',
    type: 'web3',
    description: 'Decentralized app development with Solidity, Hardhat, Ethers.js, IPFS, and Smart Contracts',
    icon: '⛓️',
    color: '#f59e0b',
    tools: JSON.stringify(['solidity', 'hardhat', 'ethers-js', 'ipfs', 'smart-contracts']),
    layout: JSON.stringify({ left: 'contracts', center: 'solidity-editor', right: 'deploy-panel', bottom: 'terminal' }),
    status: 'active',
    sortOrder: 16,
  },
  {
    name: 'AI/ML Training',
    type: 'ml-training',
    description: 'Machine learning model training with PyTorch, TensorFlow, JAX, training loops, and GPU optimization',
    icon: '🧠',
    color: '#ef4444',
    tools: JSON.stringify(['pytorch', 'tensorflow', 'jax', 'training-loops', 'gpu-optimization']),
    layout: JSON.stringify({ left: 'experiments', center: 'notebook', right: 'tensorboard', bottom: 'gpu-monitor' }),
    status: 'active',
    sortOrder: 17,
  },
  {
    name: 'DevOps Pro',
    type: 'devops-pro',
    description: 'Advanced infrastructure with Kubernetes, Terraform, Ansible, monitoring, and SRE practices',
    icon: '🏗️',
    color: '#64748b',
    tools: JSON.stringify(['kubernetes', 'terraform', 'ansible', 'monitoring', 'sre']),
    layout: JSON.stringify({ left: 'clusters', center: 'yaml-editor', right: 'monitoring', bottom: 'terminal' }),
    status: 'active',
    sortOrder: 18,
  },
  {
    name: 'Security',
    type: 'security',
    description: 'Application security with penetration testing, OWASP, SAST/DAST, vulnerability scanning, and compliance',
    icon: '🛡️',
    color: '#dc2626',
    tools: JSON.stringify(['pentesting', 'owasp', 'sast-dast', 'vulnerability-scanning', 'compliance']),
    layout: JSON.stringify({ left: 'scan-results', center: 'code-audit', right: 'report', bottom: 'terminal' }),
    status: 'active',
    sortOrder: 19,
  },
  {
    name: 'Audio/Music',
    type: 'audio',
    description: 'Audio and music development with Web Audio API, Tone.js, MIDI, DAW integration, and sound design',
    icon: '🎵',
    color: '#a855f7',
    tools: JSON.stringify(['web-audio-api', 'tone-js', 'midi', 'daw-integration', 'sound-design']),
    layout: JSON.stringify({ left: 'tracks', center: 'waveform-editor', right: 'mixer', bottom: 'piano-roll' }),
    status: 'active',
    sortOrder: 20,
  },
  {
    name: 'Video/Streaming',
    type: 'video',
    description: 'Video processing and streaming with FFmpeg, WebRTC, streaming protocols, and video pipeline tools',
    icon: '🎬',
    color: '#e11d48',
    tools: JSON.stringify(['ffmpeg', 'webrtc', 'streaming-protocols', 'video-processing', 'transcoding']),
    layout: JSON.stringify({ left: 'media-browser', center: 'preview', right: 'pipeline-editor', bottom: 'console' }),
    status: 'active',
    sortOrder: 21,
  },
  {
    name: 'Maps/GIS',
    type: 'gis',
    description: 'Geographic information systems with Mapbox, Leaflet, GeoJSON, spatial analysis, and location services',
    icon: '🗺️',
    color: '#059669',
    tools: JSON.stringify(['mapbox', 'leaflet', 'geojson', 'spatial-analysis', 'location-services']),
    layout: JSON.stringify({ left: 'layers', center: 'map-view', right: 'data-table', bottom: 'console' }),
    status: 'active',
    sortOrder: 22,
  },
  {
    name: 'IoT/Embedded',
    type: 'iot',
    description: 'IoT and embedded systems with Arduino, Raspberry Pi, MQTT, sensor data, and edge computing',
    icon: '📡',
    color: '#0891b2',
    tools: JSON.stringify(['arduino', 'raspberry-pi', 'mqtt', 'sensor-data', 'edge-computing']),
    layout: JSON.stringify({ left: 'devices', center: 'code-editor', right: 'serial-monitor', bottom: 'terminal' }),
    status: 'active',
    sortOrder: 23,
  },
  {
    name: 'Database Design',
    type: 'database',
    description: 'Database schema design, ER diagrams, query optimization, and migration management',
    icon: '🗄️',
    color: '#7c3aed',
    tools: JSON.stringify(['schema-design', 'er-diagrams', 'query-optimization', 'migration-management', 'sql-editor']),
    layout: JSON.stringify({ left: 'schema-tree', center: 'er-diagram', right: 'query-editor', bottom: 'results' }),
    status: 'active',
    sortOrder: 24,
  },
];

// Seed default surfaces — adds missing surfaces to handle upgrades
async function seedIfEmpty() {
  const { db } = await import('@/lib/db');
  const existing = await db.devSurface.findMany({ select: { type: true } });
  const existingTypes = new Set(existing.map((s) => s.type));

  for (const surface of DEFAULT_DEV_SURFACES) {
    if (!existingTypes.has(surface.type)) {
      await db.devSurface.create({ data: surface });
    }
  }
}

// GET - List all dev surfaces
export async function GET() {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json({ surfaces: FALLBACK_SURFACES });
    }

    await seedIfEmpty();

    const { db } = await import('@/lib/db');
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
    return NextResponse.json({ surfaces: FALLBACK_SURFACES });
  }
}

// POST - Create custom dev surface
export async function POST(request: NextRequest) {
  try {
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot create surfaces on edge runtime' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, type, description, icon, color, tools, layout } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');

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
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot update surfaces on edge runtime' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { id, name, description, icon, color, tools, layout, sortOrder, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Surface ID is required' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');

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
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database not available — cannot delete surfaces on edge runtime' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Surface ID is required' },
        { status: 400 }
      );
    }

    const { db } = await import('@/lib/db');

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
