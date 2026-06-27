export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Return git status from database (stored File changes, AgentRuns as commits)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail'); // 'status', 'log', 'branches', 'diff'
    const projectId = searchParams.get('projectId');

    // Find first project if none specified
    let project = projectId
      ? await db.project.findUnique({ where: { id: projectId } })
      : await db.project.findFirst();

    if (!project) {
      // No projects in database — return empty git state
      return NextResponse.json({
        branch: 'main',
        remote: null,
        status: [],
        recentCommits: [],
        branches: ['main'],
        summary: {
          filesChanged: 0,
          totalAdditions: 0,
          totalDeletions: 0,
          ahead: 0,
          behind: 0,
        },
      });
    }

    if (detail === 'log') {
      const commits = await db.agentRun.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({
        branch: 'main',
        commits: commits.map((c) => ({
          hash: c.id.slice(0, 7),
          message: c.name + (c.description ? `: ${c.description}` : ''),
          author: 'developer',
          date: c.createdAt.toISOString().split('T')[0],
          additions: c.tokens,
          deletions: 0,
          status: c.status,
        })),
        total: commits.length,
      });
    }

    if (detail === 'branches') {
      return NextResponse.json({
        current: 'main',
        branches: [{ name: 'main', current: true, lastCommit: 'latest' }],
      });
    }

    if (detail === 'diff') {
      const file = searchParams.get('file');
      if (file) {
        const fileRecord = await db.file.findFirst({
          where: { projectId: project.id, path: file },
        });
        if (!fileRecord) {
          return NextResponse.json(
            { error: `No changes found for file: ${file}` },
            { status: 404 }
          );
        }
        return NextResponse.json({
          file: fileRecord.path,
          status: 'modified',
          content: fileRecord.content,
          language: fileRecord.language,
        });
      }

      // Return all changed files
      const files = await db.file.findMany({
        where: { projectId: project.id },
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json({
        branch: 'main',
        diffs: files.map((f) => ({
          file: f.path,
          status: 'modified',
          language: f.language,
          lastModified: f.updatedAt,
        })),
      });
    }

    // Default: return full status
    const changedFiles = await db.file.findMany({
      where: { projectId: project.id },
      orderBy: { updatedAt: 'desc' },
    });

    const recentCommits = await db.agentRun.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      branch: 'main',
      remote: project.path || null,
      status: changedFiles.map((f) => ({
        file: f.path,
        status: 'modified',
        language: f.language,
        lastModified: f.updatedAt,
      })),
      recentCommits: recentCommits.map((c) => ({
        hash: c.id.slice(0, 7),
        message: c.name + (c.description ? `: ${c.description}` : ''),
        author: 'developer',
        date: c.createdAt.toISOString().split('T')[0],
        additions: c.tokens,
        deletions: 0,
        status: c.status,
      })),
      branches: ['main'],
      summary: {
        filesChanged: changedFiles.length,
        totalAdditions: changedFiles.reduce((sum, f) => sum + f.content.split('\n').length, 0),
        totalDeletions: 0,
        ahead: recentCommits.length,
        behind: 0,
      },
    });
  } catch (error) {
    console.error('Git GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get git status' },
      { status: 500 }
    );
  }
}

// POST - Execute git commands and log to Activity table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command, args } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Git command is required' },
        { status: 400 }
      );
    }

    const projectId = args?.projectId;
    let project = projectId
      ? await db.project.findUnique({ where: { id: projectId } })
      : await db.project.findFirst();

    switch (command) {
      case 'commit': {
        const message = args?.message || args?.m;
        if (!message) {
          return NextResponse.json(
            { error: 'Commit message is required (use args.message)' },
            { status: 400 }
          );
        }

        if (!project) {
          return NextResponse.json(
            { error: 'No project found. Create a project first.' },
            { status: 404 }
          );
        }

        // Log the commit as an AgentRun
        const changedFiles = await db.file.findMany({
          where: { projectId: project.id },
        });

        const totalAdditions = changedFiles.reduce(
          (sum, f) => sum + f.content.split('\n').length,
          0
        );

        const agentRun = await db.agentRun.create({
          data: {
            projectId: project.id,
            name: `commit: ${message}`,
            description: message,
            status: 'completed',
            tokens: totalAdditions,
            cost: 0,
            duration: 0,
          },
        });

        // Log activity
        await db.activity.create({
          data: {
            action: 'git_commit',
            entity: 'AgentRun',
            entityId: agentRun.id,
            description: `Committed: ${message}`,
            metadata: JSON.stringify({
              filesChanged: changedFiles.length,
              additions: totalAdditions,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          commit: {
            hash: agentRun.id.slice(0, 7),
            message,
            author: 'developer',
            date: agentRun.createdAt.toISOString().split('T')[0],
            additions: totalAdditions,
            deletions: 0,
          },
          filesChanged: changedFiles.length,
          output: `[main ${agentRun.id.slice(0, 7)}] ${message}\n ${changedFiles.length} files changed, ${totalAdditions} insertions(+)`,
        });
      }

      case 'push': {
        const remote = args?.remote || 'origin';
        const branch = args?.branch || 'main';

        await db.activity.create({
          data: {
            action: 'git_push',
            entity: 'Project',
            entityId: project?.id || '',
            description: `Pushed to ${remote}/${branch}`,
            metadata: JSON.stringify({ remote, branch }),
          },
        });

        return NextResponse.json({
          success: true,
          output: `Pushing to ${remote}/${branch}...`,
          remote,
          branch,
        });
      }

      case 'pull': {
        const remote = args?.remote || 'origin';
        const branch = args?.branch || 'main';

        await db.activity.create({
          data: {
            action: 'git_pull',
            entity: 'Project',
            entityId: project?.id || '',
            description: `Pulled from ${remote}/${branch}`,
            metadata: JSON.stringify({ remote, branch }),
          },
        });

        return NextResponse.json({
          success: true,
          output: `Already up to date.`,
          remote,
          branch,
          updated: false,
        });
      }

      case 'log': {
        const count = args?.count || args?.n || 10;

        if (!project) {
          return NextResponse.json({ commits: [], total: 0 });
        }

        const commits = await db.agentRun.findMany({
          where: { projectId: project.id },
          orderBy: { createdAt: 'desc' },
          take: count,
        });

        return NextResponse.json({
          commits: commits.map((c) => ({
            hash: c.id.slice(0, 7),
            message: c.name + (c.description ? `: ${c.description}` : ''),
            author: 'developer',
            date: c.createdAt.toISOString().split('T')[0],
            additions: c.tokens,
            deletions: 0,
            status: c.status,
          })),
          total: commits.length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported git command: ${command}. Supported: commit, push, pull, log` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Git POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute git command' },
      { status: 500 }
    );
  }
}
