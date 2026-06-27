export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List files for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const parentId = searchParams.get('parentId');
    const path = searchParams.get('path');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { projectId };
    if (parentId) where.parentId = parentId;
    if (path) where.path = path;

    const files = await db.file.findMany({
      where,
      orderBy: [{ isDir: 'desc' }, { name: 'asc' }],
    });

    // Get file count stats
    const totalFiles = await db.file.count({ where: { projectId, isDir: false } });
    const totalDirs = await db.file.count({ where: { projectId, isDir: true } });

    return NextResponse.json({
      files,
      stats: { totalFiles, totalDirs },
    });
  } catch (error) {
    console.error('Files list error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

// POST - Create or update a file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, path, content, language, isDir, parentId, fileId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!name || !path) {
      return NextResponse.json(
        { error: 'File name and path are required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    let file;

    if (fileId) {
      // Update existing file
      const existing = await db.file.findUnique({ where: { id: fileId } });
      if (!existing) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      file = await db.file.update({
        where: { id: fileId },
        data: {
          name: name || existing.name,
          path: path || existing.path,
          content: content !== undefined ? content : existing.content,
          language: language !== undefined ? language : existing.language,
          isDir: isDir !== undefined ? isDir : existing.isDir,
          parentId: parentId !== undefined ? parentId : existing.parentId,
        },
      });
    } else {
      // Check if file already exists at this path
      const existingFile = await db.file.findFirst({
        where: { projectId, path },
      });

      if (existingFile) {
        // Update existing file at this path
        file = await db.file.update({
          where: { id: existingFile.id },
          data: {
            name,
            content: content !== undefined ? content : existingFile.content,
            language: language !== undefined ? language : existingFile.language,
            isDir: isDir !== undefined ? isDir : existingFile.isDir,
            parentId: parentId !== undefined ? parentId : existingFile.parentId,
          },
        });
      } else {
        // Create new file
        file = await db.file.create({
          data: {
            projectId,
            name,
            path,
            content: content || '',
            language: language || null,
            isDir: isDir || false,
            parentId: parentId || null,
          },
        });
      }
    }

    return NextResponse.json(file, { status: fileId ? 200 : 201 });
  } catch (error) {
    console.error('File create/update error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update file' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const existing = await db.file.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // If it's a directory, delete all children recursively
    if (existing.isDir) {
      await deleteDirectoryContents(id, existing.projectId);
    }

    await db.file.delete({ where: { id } });

    return NextResponse.json({ message: 'File deleted successfully', id });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

// Helper: Recursively delete directory contents
async function deleteDirectoryContents(parentId: string, _projectId: string): Promise<void> {
  const children = await db.file.findMany({
    where: { parentId },
  });

  for (const child of children) {
    if (child.isDir) {
      await deleteDirectoryContents(child.id, _projectId);
    }
    await db.file.delete({ where: { id: child.id } });
  }
}
