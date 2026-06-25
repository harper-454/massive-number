import { NextRequest, NextResponse } from 'next/server';

// MCP Server Registry - simulated available MCP servers
const MCP_SERVERS = [
  { id: "github", name: "GitHub MCP", description: "Access repos, PRs, issues, and code reviews", category: "version-control", icon: "github", tools: ["create_issue", "list_prs", "merge_pr", "search_code", "create_repo"] },
  { id: "postgres", name: "PostgreSQL MCP", description: "Query and manage PostgreSQL databases", category: "database", icon: "database", tools: ["query", "list_tables", "describe_table", "insert", "update"] },
  { id: "stripe", name: "Stripe MCP", description: "Manage payments, customers, and subscriptions", category: "payments", icon: "credit-card", tools: ["create_customer", "list_charges", "create_invoice"] },
  { id: "sentry", name: "Sentry MCP", description: "Monitor errors and performance issues", category: "monitoring", icon: "alert-triangle", tools: ["list_issues", "get_issue_details", "resolve_issue"] },
  { id: "linear", name: "Linear MCP", description: "Project management and issue tracking", category: "project-management", icon: "list", tools: ["create_issue", "list_issues", "update_status"] },
  { id: "notion", name: "Notion MCP", description: "Access Notion docs, databases, and pages", category: "productivity", icon: "file-text", tools: ["search_pages", "create_page", "update_database"] },
  { id: "docker", name: "Docker MCP", description: "Manage containers, images, and compose", category: "devops", icon: "container", tools: ["list_containers", "run_container", "build_image"] },
  { id: "aws", name: "AWS MCP", description: "Interact with AWS services (S3, Lambda, EC2)", category: "cloud", icon: "cloud", tools: ["list_buckets", "invoke_function", "describe_instances"] },
  { id: "vercel", name: "Vercel MCP", description: "Deploy and manage Vercel projects", category: "deployment", icon: "triangle", tools: ["deploy", "list_deployments", "get_deployment"] },
  { id: "slack", name: "Slack MCP", description: "Send messages and manage channels", category: "communication", icon: "hash", tools: ["send_message", "list_channels", "search_messages"] },
  { id: "filesystem", name: "Filesystem MCP", description: "Read/write files on local system", category: "system", icon: "folder", tools: ["read_file", "write_file", "list_directory", "search_files"] },
  { id: "puppeteer", name: "Puppeteer MCP", description: "Browser automation and web scraping", category: "automation", icon: "globe", tools: ["navigate", "screenshot", "click", "fill", "evaluate"] },
];

// Track connected servers
const connectedServers = new Set<string>(["filesystem"]);

// GET - List available MCP servers with connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    let servers = MCP_SERVERS.map((server) => ({
      ...server,
      status: connectedServers.has(server.id) ? 'connected' as const : 'available' as const,
    }));

    // Filter by category if provided
    if (category) {
      servers = servers.filter((s) => s.category === category);
    }

    // Filter by status if provided
    if (status) {
      servers = servers.filter((s) => s.status === status);
    }

    const categories = [...new Set(MCP_SERVERS.map((s) => s.category))];
    const connectedCount = servers.filter((s) => s.status === 'connected').length;
    const totalTools = servers.reduce((sum, s) => sum + s.tools.length, 0);

    return NextResponse.json({
      servers,
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
    const { serverId, config } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'serverId is required' },
        { status: 400 }
      );
    }

    const server = MCP_SERVERS.find((s) => s.id === serverId);
    if (!server) {
      return NextResponse.json(
        { error: `MCP server "${serverId}" not found in registry` },
        { status: 404 }
      );
    }

    if (connectedServers.has(serverId)) {
      return NextResponse.json(
        { error: `MCP server "${serverId}" is already connected` },
        { status: 409 }
      );
    }

    // Register the server as connected
    connectedServers.add(serverId);

    const connectedServer = {
      ...server,
      status: 'connected' as const,
      connectedAt: new Date().toISOString(),
      config: config || {},
    };

    return NextResponse.json({
      message: `MCP server "${server.name}" connected successfully`,
      server: connectedServer,
      totalConnected: connectedServers.size,
    }, { status: 201 });
  } catch (error) {
    console.error('MCP POST error:', error);
    return NextResponse.json(
      { error: 'Failed to connect MCP server' },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect an MCP server
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

    if (!connectedServers.has(serverId)) {
      return NextResponse.json(
        { error: `MCP server "${serverId}" is not currently connected` },
        { status: 404 }
      );
    }

    const server = MCP_SERVERS.find((s) => s.id === serverId);
    connectedServers.delete(serverId);

    return NextResponse.json({
      message: `MCP server "${server?.name || serverId}" disconnected successfully`,
      serverId,
      totalConnected: connectedServers.size,
    });
  } catch (error) {
    console.error('MCP DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect MCP server' },
      { status: 500 }
    );
  }
}
