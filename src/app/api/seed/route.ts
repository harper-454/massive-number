export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - One-time seed: populate database with initial data IF tables are empty
export async function POST() {
  try {
    const counts = {
      personas: 0,
      rules: 0,
      project: 0,
      settings: 0,
    };

    // Check and seed personas
    const existingPersonas = await db.persona.count();
    if (existingPersonas === 0) {
      const defaultPersonas = [
        {
          name: 'Planner',
          icon: '📋',
          description: 'Focuses on architecture, requirements, and breaking down tasks into structured plans',
          systemPrompt: 'You are a Planner persona. Focus on understanding requirements, designing architecture, and creating detailed implementation plans. Break complex tasks into clear, actionable steps. Consider edge cases and dependencies.',
          focus: 'Architecture & Planning',
          isPreset: true,
        },
        {
          name: 'Builder',
          icon: '🔨',
          description: 'Focuses on writing clean, efficient code and implementing features',
          systemPrompt: 'You are a Builder persona. Focus on writing clean, efficient, and well-typed code. Implement features following best practices and established patterns. Write production-ready code with proper error handling.',
          focus: 'Implementation & Coding',
          isPreset: true,
        },
        {
          name: 'Reviewer',
          icon: '🔍',
          description: 'Focuses on code review, quality assurance, and finding potential issues',
          systemPrompt: 'You are a Reviewer persona. Focus on code quality, security, performance, and maintainability. Identify potential bugs, security vulnerabilities, and performance bottlenecks. Suggest improvements with clear reasoning.',
          focus: 'Quality & Review',
          isPreset: true,
        },
        {
          name: 'Iterator',
          icon: '🔄',
          description: 'Focuses on refactoring, optimization, and iterative improvement',
          systemPrompt: 'You are an Iterator persona. Focus on refactoring code for clarity and efficiency. Optimize performance, reduce complexity, and improve code organization. Make incremental improvements that compound over time.',
          focus: 'Refactoring & Optimization',
          isPreset: true,
        },
      ];

      for (const p of defaultPersonas) {
        await db.persona.create({ data: p });
      }
      counts.personas = defaultPersonas.length;
    }

    // Check and seed AI rules
    const existingRules = await db.aiRule.count();
    if (existingRules === 0) {
      const defaultRules = [
        {
          name: 'TypeScript Strict Mode',
          content: 'Always use strict TypeScript with proper types. Avoid any, use unknown when type is truly unknown. Define interfaces for all data structures.',
          isPreset: true,
        },
        {
          name: 'Error Handling',
          content: 'All async operations must be wrapped in try/catch. Provide meaningful error messages. Log errors with context. Never silently swallow errors.',
          isPreset: true,
        },
        {
          name: 'Database Operations',
          content: 'Use Prisma ORM for all database operations. Use transactions for multi-step operations. Always handle connection errors gracefully. Close connections properly.',
          isPreset: true,
        },
        {
          name: 'Security First',
          content: 'Never expose API keys or secrets in client-side code. Validate all user inputs. Use parameterized queries. Implement rate limiting on public endpoints.',
          isPreset: true,
        },
        {
          name: 'Code Style',
          content: 'Follow ES6+ import/export syntax. Use const over let. Prefer immutability. Use descriptive variable names. Keep functions small and focused.',
          isPreset: true,
        },
      ];

      for (const r of defaultRules) {
        await db.aiRule.create({ data: r });
      }
      counts.rules = defaultRules.length;
    }

    // Check and seed default project
    const existingProjects = await db.project.count();
    if (existingProjects === 0) {
      // Need a user first — create a default user
      const existingUsers = await db.user.count();
      let userId: string;

      if (existingUsers === 0) {
        const user = await db.user.create({
          data: {
            email: 'developer@massive-number.dev',
            name: 'Developer',
          },
        });
        userId = user.id;

        // Create default user settings
        await db.userSettings.create({
          data: {
            userId,
          },
        });
        counts.settings = 1;
      } else {
        const firstUser = await db.user.findFirst();
        userId = firstUser!.id;
      }

      await db.project.create({
        data: {
          name: 'MASSIVE NUMBER',
          description: 'The unified AI-powered development platform',
          language: 'TypeScript',
          framework: 'Next.js',
          userId,
        },
      });
      counts.project = 1;
    }

    const totalSeeded = counts.personas + counts.rules + counts.project + counts.settings;

    if (totalSeeded === 0) {
      return NextResponse.json({
        seeded: false,
        message: 'Already seeded — all tables have data',
        counts,
      });
    }

    return NextResponse.json({
      seeded: true,
      counts,
      message: `Seeded ${totalSeeded} items successfully`,
    }, { status: 201 });
  } catch (error) {
    console.error('Seed POST error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
