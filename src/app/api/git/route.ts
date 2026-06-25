import { NextRequest, NextResponse } from 'next/server';

// Simulated git state
const gitState = {
  branch: "main",
  remote: "origin/git@github.com:user/massive-number.git",
  status: [
    { file: "src/app/page.tsx", status: "modified", additions: 24, deletions: 8 },
    { file: "src/components/nexus/chat-panel.tsx", status: "modified", additions: 156, deletions: 23 },
    { file: "src/stores/chat-store.ts", status: "added", additions: 89, deletions: 0 },
    { file: "prisma/schema.prisma", status: "modified", additions: 45, deletions: 12 },
  ],
  recentCommits: [
    { hash: "a3f2c1d", message: "feat: add MCP integration hub", author: "developer", date: "2026-06-26", additions: 342, deletions: 23 },
    { hash: "b7e4f2a", message: "fix: chat streaming with REST API fallback", author: "developer", date: "2026-06-25", additions: 89, deletions: 45 },
    { hash: "c1d9e3b", message: "feat: multi-model selector with 7 providers", author: "developer", date: "2026-06-24", additions: 567, deletions: 12 },
    { hash: "d5a2c4e", message: "feat: agent mode with 6-step pipeline", author: "developer", date: "2026-06-24", additions: 445, deletions: 0 },
    { hash: "e8b3d5f", message: "initial: MASSIVE NUMBER platform foundation", author: "developer", date: "2026-06-24", additions: 2890, deletions: 0 },
  ],
  branches: ["main", "develop", "feature/mcp-hub", "feature/voice-code", "fix/streaming"],
};

// Commit history for log command
let commitHistory = [...gitState.recentCommits];

// Generate a short hash
function generateHash(): string {
  return Math.random().toString(36).substring(2, 9);
}

// GET - Get git status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail'); // 'status', 'log', 'branches', 'diff'

    if (detail === 'log') {
      return NextResponse.json({
        branch: gitState.branch,
        commits: commitHistory,
        total: commitHistory.length,
      });
    }

    if (detail === 'branches') {
      return NextResponse.json({
        current: gitState.branch,
        branches: gitState.branches.map((b) => ({
          name: b,
          current: b === gitState.branch,
          lastCommit: commitHistory.find((_) => true)?.hash || 'unknown',
        })),
      });
    }

    if (detail === 'diff') {
      const file = searchParams.get('file');
      if (file) {
        const fileStatus = gitState.status.find((s) => s.file === file);
        if (!fileStatus) {
          return NextResponse.json(
            { error: `No changes found for file: ${file}` },
            { status: 404 }
          );
        }
        return NextResponse.json({
          file: fileStatus.file,
          status: fileStatus.status,
          diff: generateDiff(fileStatus),
        });
      }
      // Return all diffs
      return NextResponse.json({
        branch: gitState.branch,
        diffs: gitState.status.map((s) => ({
          file: s.file,
          status: s.status,
          diff: generateDiff(s),
        })),
      });
    }

    // Default: return full status
    const totalAdditions = gitState.status.reduce((sum, s) => sum + s.additions, 0);
    const totalDeletions = gitState.status.reduce((sum, s) => sum + s.deletions, 0);

    return NextResponse.json({
      branch: gitState.branch,
      remote: gitState.remote,
      status: gitState.status,
      recentCommits: gitState.recentCommits,
      branches: gitState.branches,
      summary: {
        filesChanged: gitState.status.length,
        totalAdditions,
        totalDeletions,
        ahead: 2,
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

// POST - Execute git commands
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

    switch (command) {
      case 'commit': {
        const message = args?.message || args?.m;
        if (!message) {
          return NextResponse.json(
            { error: 'Commit message is required (use args.message)' },
            { status: 400 }
          );
        }

        const hash = generateHash();
        const totalAdditions = gitState.status.reduce((sum, s) => sum + s.additions, 0);
        const totalDeletions = gitState.status.reduce((sum, s) => sum + s.deletions, 0);

        const newCommit = {
          hash,
          message,
          author: "developer",
          date: new Date().toISOString().split('T')[0],
          additions: totalAdditions,
          deletions: totalDeletions,
        };

        commitHistory.unshift(newCommit);
        // Clear staged changes after commit
        gitState.status = [];

        return NextResponse.json({
          success: true,
          commit: newCommit,
          filesChanged: 4,
          output: `[${gitState.branch} ${hash}] ${message}\n 4 files changed, ${totalAdditions} insertions(+), ${totalDeletions} deletions(-)`,
        });
      }

      case 'push': {
        const remote = args?.remote || 'origin';
        const branch = args?.branch || gitState.branch;

        return NextResponse.json({
          success: true,
          output: `Enumerating objects: 12, done.\nCounting objects: 100% (12/12), done.\nDelta compression using up to 8 threads\nCompressing objects: 100% (7/7), done.\nWriting objects: 100% (7/7), 3.24 KiB | 3.24 MiB/s, done.\nTo ${remote}\n   ${branch}: ${commitHistory[0]?.hash}\n   ${branch}: ${generateHash()}\nDone.`,
          remote,
          branch,
        });
      }

      case 'pull': {
        const remote = args?.remote || 'origin';
        const branch = args?.branch || gitState.branch;

        return NextResponse.json({
          success: true,
          output: `From ${remote}\n * [new ref]         refs/heads/${branch} -> ${branch}\nAlready up to date.`,
          remote,
          branch,
          updated: false,
        });
      }

      case 'checkout': {
        const targetBranch = args?.branch || args?._?.[0];
        if (!targetBranch) {
          return NextResponse.json(
            { error: 'Branch name is required (use args.branch)' },
            { status: 400 }
          );
        }

        if (!gitState.branches.includes(targetBranch)) {
          // Create new branch with -b flag
          if (args?.create || args?.b) {
            gitState.branches.push(targetBranch);
            gitState.branch = targetBranch;
            return NextResponse.json({
              success: true,
              output: `Switched to a new branch '${targetBranch}'`,
              branch: targetBranch,
            });
          }
          return NextResponse.json(
            { error: `Branch '${targetBranch}' not found. Use args.b: true to create it.` },
            { status: 404 }
          );
        }

        gitState.branch = targetBranch;
        return NextResponse.json({
          success: true,
          output: `Switched to branch '${targetBranch}'`,
          branch: targetBranch,
        });
      }

      case 'branch': {
        const action = args?.action;
        if (action === 'create' || args?.create) {
          const name = args?.name;
          if (!name) {
            return NextResponse.json(
              { error: 'Branch name is required (use args.name)' },
              { status: 400 }
            );
          }
          gitState.branches.push(name);
          return NextResponse.json({
            success: true,
            output: `Created branch '${name}'`,
            branch: name,
          });
        }
        if (action === 'delete' || args?.delete) {
          const name = args?.name;
          if (!name) {
            return NextResponse.json(
              { error: 'Branch name is required (use args.name)' },
              { status: 400 }
            );
          }
          if (name === gitState.branch) {
            return NextResponse.json(
              { error: `Cannot delete the current branch '${name}'` },
              { status: 400 }
            );
          }
          const idx = gitState.branches.indexOf(name);
          if (idx === -1) {
            return NextResponse.json(
              { error: `Branch '${name}' not found` },
              { status: 404 }
            );
          }
          gitState.branches.splice(idx, 1);
          return NextResponse.json({
            success: true,
            output: `Deleted branch '${name}'`,
          });
        }

        // List branches
        return NextResponse.json({
          current: gitState.branch,
          branches: gitState.branches.map((b) => ({
            name: b,
            current: b === gitState.branch,
          })),
        });
      }

      case 'stash': {
        const stashAction = args?.action || 'push';
        if (stashAction === 'push') {
          const stashEntry = {
            id: 0,
            message: args?.message || 'WIP on ' + gitState.branch,
            branch: gitState.branch,
            files: gitState.status.map((s) => s.file),
          };
          gitState.status = [];
          return NextResponse.json({
            success: true,
            output: `Saved working directory and index state ${stashEntry.message}`,
            stash: stashEntry,
          });
        }
        if (stashAction === 'pop') {
          return NextResponse.json({
            success: true,
            output: 'On branch ' + gitState.branch + '\nChanges restored from stash',
          });
        }
        return NextResponse.json({
          success: true,
          output: 'stash list: No stash entries found.',
        });
      }

      case 'fetch': {
        return NextResponse.json({
          success: true,
          output: `From git@github.com:user/massive-number.git\n * [new branch]      develop       -> origin/develop\n * [new branch]      feature/mcp-hub -> origin/feature/mcp-hub\nAlready up to date.`,
        });
      }

      case 'log': {
        const count = args?.count || args?.n || 10;
        return NextResponse.json({
          commits: commitHistory.slice(0, count),
          total: commitHistory.length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported git command: ${command}. Supported: commit, push, pull, checkout, branch, stash, fetch, log` },
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

// Generate simulated diff output
function generateDiff(fileStatus: { file: string; status: string; additions: number; deletions: number }): string {
  const lines: string[] = [];
  lines.push(`diff --git a/${fileStatus.file} b/${fileStatus.file}`);

  if (fileStatus.status === 'added') {
    lines.push(`new file mode 100644`);
  } else if (fileStatus.status === 'deleted') {
    lines.push(`deleted file mode 100644`);
  }

  lines.push(`index a1b2c3d..e4f5g6h 100644`);
  lines.push(`--- a/${fileStatus.file}`);
  lines.push(`+++ b/${fileStatus.file}`);

  // Generate simulated diff lines
  for (let i = 0; i < Math.min(fileStatus.additions, 5); i++) {
    lines.push(`+// AI-generated implementation line ${i + 1}`);
  }
  for (let i = 0; i < Math.min(fileStatus.deletions, 3); i++) {
    lines.push(`-// Old implementation line ${i + 1}`);
  }
  lines.push(` // Context line`);

  return lines.join('\n');
}
