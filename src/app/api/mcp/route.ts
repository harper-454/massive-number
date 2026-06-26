import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List MCP servers from DATABASE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status === 'connected') where.connected = true;
    if (status === 'available') where.connected = false;

    const servers = await db.mcpServer.findMany({ where });

    const categories = [...new Set(servers.map((s) => s.category))];
    const connectedCount = servers.filter((s) => s.connected).length;
    const totalTools = servers.reduce((sum, s) => {
      try {
        return sum + JSON.parse(s.tools).length;
      } catch {
        return sum;
      }
    }, 0);

    return NextResponse.json({
      servers: servers.map((s) => ({
        id: s.serverId,
        name: s.name,
        description: s.description,
        category: s.category,
        icon: s.icon,
        tools: JSON.parse(s.tools),
        config: JSON.parse(s.config),
        connected: s.connected,
        health: s.health,
        lastConnectedAt: s.lastConnectedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      meta: {
        total: servers.length,
        connected: connectedCount,
        available: servers.length - connectedCount,
        totalTools,
        categories,
      },
    });
  } catch (error) {
    console.error('MCP GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list MCP servers' },
      { status: 500 }
    );
  }
}

// POST - Connect/register an MCP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, name, description, category, icon, tools, config } = body;

    if (!serverId || !name || !category) {
      return NextResponse.json(
        { error: 'serverId, name, and category are required' },
        { status: 400 }
      );
    }

    const server = await db.mcpServer.upsert({
      where: { serverId },
      update: {
        name,
        description: description || null,
        category,
        icon: icon || null,
        tools: JSON.stringify(tools || []),
        config: JSON.stringify(config || {}),
        connected: true,
        health: 'healthy',
        lastConnectedAt: new Date(),
      },
      create: {
        serverId,
        name,
        description: description || null,
        category,
        icon: icon || null,
        tools: JSON.stringify(tools || []),
        config: JSON.stringify(config || {}),
        connected: true,
        health: 'healthy',
        lastConnectedAt: new Date(),
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'mcp_connect',
        entity: 'McpServer',
        entityId: server.id,
        description: `Connected MCP server: ${name}`,
        metadata: JSON.stringify({ serverId, category }),
      },
    });

    return NextResponse.json({
      message: `MCP server "${name}" connected successfully`,
      server: {
        id: server.serverId,
        name: server.name,
        description: server.description,
        category: server.category,
        icon: server.icon,
        tools: JSON.parse(server.tools),
        config: JSON.parse(server.config),
        connected: server.connected,
        health: server.health,
        lastConnectedAt: server.lastConnectedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('MCP POST error:', error);
    return NextResponse.json(
      { error: 'Failed to connect MCP server' },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect/remove an MCP server
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'serverId is required' },
        { status: 400 }
      );
    }

    const server = await db.mcpServer.findUnique({
      where: { serverId },
    });

    if (!server) {
      return NextResponse.json(
        { error: `MCP server "${serverId}" not found` },
        { status: 404 }
      );
    }

    await db.mcpServer.delete({
      where: { serverId },
    });

    // Log activity
    await db.activity.create({
      data: {
        action: 'mcp_disconnect',
        entity: 'McpServer',
        entityId: server.id,
        description: `Disconnected MCP server: ${server.name}`,
        metadata: JSON.stringify({ serverId }),
      },
    });

    return NextResponse.json({
      message: `MCP server "${server.name}" disconnected successfully`,
      serverId,
    });
  } catch (error) {
    console.error('MCP DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect MCP server' },
      { status: 500 }
    );
  }
}
