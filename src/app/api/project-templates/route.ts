export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Default project templates to seed
const DEFAULT_TEMPLATES = [
  {
    name: 'Next.js Starter',
    description: 'Full-featured Next.js app with TypeScript, Tailwind CSS, and App Router',
    category: 'starter',
    framework: 'next.js',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'tsconfig.json', content: '{}' },
      { path: 'next.config.ts', content: 'export default {};' },
      { path: 'src/app/layout.tsx', content: 'export default function RootLayout({ children }) { return children; }' },
      { path: 'src/app/page.tsx', content: 'export default function Home() { return <div>Hello World</div>; }' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: 'latest', react: 'latest', 'react-dom': 'latest', typescript: 'latest' },
    }),
    isOfficial: true,

  },
  {
    name: 'React + Vite',
    description: 'Fast React development with Vite, TypeScript, and modern tooling',
    category: 'starter',
    framework: 'react',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'vite.config.ts', content: 'export default {};' },
      { path: 'src/main.tsx', content: 'import React from "react";' },
      { path: 'src/App.tsx', content: 'export default function App() { return <div>Hello Vite</div>; }' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: { react: 'latest', 'react-dom': 'latest', vite: 'latest' },
    }),
    isOfficial: true,

  },
  {
    name: 'Fullstack SaaS',
    description: 'Complete SaaS starter with authentication, database, payments, and dashboard',
    category: 'fullstack',
    framework: 'next.js',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'prisma/schema.prisma', content: '// Prisma schema' },
      { path: 'src/app/api/auth/route.ts', content: '// Auth API' },
      { path: 'src/app/dashboard/page.tsx', content: '// Dashboard' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'next dev', 'db:push': 'prisma db push' },
      dependencies: { next: 'latest', prisma: 'latest', 'next-auth': 'latest' },
    }),
    isOfficial: true,

  },
  {
    name: 'REST API Server',
    description: 'Express.js REST API with authentication, validation, and database integration',
    category: 'backend',
    framework: 'express',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'src/index.ts', content: '// Express server' },
      { path: 'src/routes/api.ts', content: '// API routes' },
      { path: 'src/middleware/auth.ts', content: '// Auth middleware' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'tsx watch src/index.ts' },
      dependencies: { express: 'latest', prisma: 'latest' },
    }),
    isOfficial: true,

  },
  {
    name: 'Portfolio Website',
    description: 'Beautiful portfolio website with animations, dark mode, and responsive design',
    category: 'frontend',
    framework: 'next.js',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'src/app/layout.tsx', content: '// Layout' },
      { path: 'src/app/page.tsx', content: '// Home page' },
      { path: 'src/components/Hero.tsx', content: '// Hero section' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'next dev' },
      dependencies: { next: 'latest', 'framer-motion': 'latest' },
    }),
    isOfficial: true,

  },
  {
    name: 'GraphQL API',
    description: 'GraphQL API with Apollo Server, type-safe resolvers, and database integration',
    category: 'api',
    framework: 'apollo',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'src/schema.ts', content: '// GraphQL schema' },
      { path: 'src/resolvers.ts', content: '// Resolvers' },
      { path: 'src/server.ts', content: '// Apollo Server' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'tsx watch src/server.ts' },
      dependencies: { '@apollo/server': 'latest', graphql: 'latest' },
    }),
    isOfficial: true,

  },
  {
    name: 'React Native App',
    description: 'Cross-platform mobile app with React Native, Expo, and navigation',
    category: 'mobile',
    framework: 'react-native',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'app/_layout.tsx', content: '// Root layout' },
      { path: 'app/index.tsx', content: '// Home screen' },
      { path: 'app/(tabs)/settings.tsx', content: '// Settings screen' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'expo start' },
      dependencies: { expo: 'latest', 'react-native': 'latest' },
    }),
    isOfficial: true,

  },
  {
    name: 'Game Engine Starter',
    description: 'Browser-based game with Three.js, physics, and asset pipeline',
    category: 'game',
    framework: 'three.js',
    language: 'typescript',
    files: JSON.stringify([
      { path: 'package.json', content: '{}' },
      { path: 'src/main.ts', content: '// Game entry' },
      { path: 'src/engine.ts', content: '// Game engine' },
      { path: 'src/scene.ts', content: '// Scene setup' },
    ]),
    config: JSON.stringify({
      scripts: { dev: 'vite' },
      dependencies: { three: 'latest', 'cannon-es': 'latest' },
    }),
    isOfficial: true,

  },
];

// Seed default templates if table is empty
async function seedIfEmpty() {
  const count = await db.projectTemplate.count();
  if (count === 0) {
    for (const template of DEFAULT_TEMPLATES) {
      await db.projectTemplate.create({ data: template });
    }
  }
}

// GET - List project templates with filters
export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const framework = searchParams.get('framework') || undefined;
    const language = searchParams.get('language') || undefined;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Prisma.ProjectTemplateWhereInput = {};

    if (category) where.category = category;
    if (framework) where.framework = framework;
    if (language) where.language = language;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [templates, total] = await Promise.all([
      db.projectTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.projectTemplate.count({ where }),
    ]);

    // Get distinct categories
    const categoriesRaw = await db.projectTemplate.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    const categories = categoriesRaw.map((c) => c.category);

    // Parse JSON fields for response
    const parsedTemplates = templates.map((template) => ({
      ...template,
      files: JSON.parse(template.files),
      config: JSON.parse(template.config),
    }));

    return NextResponse.json({
      templates: parsedTemplates,
      total,
      categories,
    });
  } catch (error) {
    console.error('ProjectTemplates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve project templates' },
      { status: 500 }
    );
  }
}

// POST - Create template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, framework, language, files, config, thumbnail } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'name and category are required' },
        { status: 400 }
      );
    }

    const template = await db.projectTemplate.create({
      data: {
        name,
        description: description || null,
        category,
        framework: framework || null,
        language: language || null,
        files: JSON.stringify(files || []),
        config: JSON.stringify(config || {}),
        thumbnail: thumbnail || null,
      },
    });

    return NextResponse.json({
      template: {
        ...template,
        files: JSON.parse(template.files),
        config: JSON.parse(template.config),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('ProjectTemplates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create project template' },
      { status: 500 }
    );
  }
}
