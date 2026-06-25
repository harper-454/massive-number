import { NextRequest, NextResponse } from 'next/server';

// Marketplace integration items
interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  downloads: number;
  author: string;
  price: string;
  verified: boolean;
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: "gh-copilot", name: "GitHub Copilot Bridge", description: "Use Copilot suggestions within MASSIVE NUMBER", category: "ai", rating: 4.8, downloads: 12500, author: "community", price: "free", verified: true },
  { id: "jest-runner", name: "Jest Test Runner", description: "Run Jest tests with AI-powered failure analysis", category: "testing", rating: 4.6, downloads: 8900, author: "community", price: "free", verified: true },
  { id: "figma-sync", name: "Figma Design Sync", description: "Import Figma designs as React components", category: "design", rating: 4.3, downloads: 5600, author: "design-tools", price: "free", verified: true },
  { id: "terraform-gen", name: "Terraform Generator", description: "Generate infrastructure-as-code from natural language", category: "devops", rating: 4.5, downloads: 3200, author: "devops-pro", price: "$9/mo", verified: false },
  { id: "api-tester", name: "API Tester Pro", description: "AI-powered API testing and documentation", category: "testing", rating: 4.7, downloads: 7800, author: "api-tools", price: "free", verified: true },
  { id: "db-designer", name: "Database Schema Designer", description: "Visual database schema design with AI migration generation", category: "database", rating: 4.4, downloads: 4100, author: "db-tools", price: "free", verified: true },
  { id: "security-scanner", name: "Security Vulnerability Scanner", description: "Real-time security scanning with AI fix suggestions", category: "security", rating: 4.9, downloads: 15200, author: "security-pro", price: "$19/mo", verified: true },
  { id: "doc-generator", name: "Documentation Generator", description: "Auto-generate API docs, READMEs, and code comments", category: "documentation", rating: 4.2, downloads: 6700, author: "docs-ai", price: "free", verified: false },
  { id: "perf-monitor", name: "Performance Monitor", description: "Real-time performance profiling with AI optimization tips", category: "monitoring", rating: 4.1, downloads: 2900, author: "perf-tools", price: "$5/mo", verified: true },
  { id: "i18n-ai", name: "i18n AI Translator", description: "AI-powered internationalization with context-aware translations", category: "localization", rating: 4.6, downloads: 3800, author: "localize-ai", price: "free", verified: true },
];

// Track installed integrations
const installedIntegrations = new Set<string>(["gh-copilot", "jest-runner"]);

// GET - List marketplace integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort'); // 'rating', 'downloads', 'name'
    const filter = searchParams.get('filter'); // 'installed', 'free', 'paid', 'verified'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let items = MARKETPLACE_ITEMS.map((item) => ({
      ...item,
      installed: installedIntegrations.has(item.id),
    }));

    // Filter by category
    if (category) {
      items = items.filter((i) => i.category === category);
    }

    // Search by name or description
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(searchLower) ||
          i.description.toLowerCase().includes(searchLower) ||
          i.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filter === 'installed') {
      items = items.filter((i) => i.installed);
    } else if (filter === 'free') {
      items = items.filter((i) => i.price === 'free');
    } else if (filter === 'paid') {
      items = items.filter((i) => i.price !== 'free');
    } else if (filter === 'verified') {
      items = items.filter((i) => i.verified);
    }

    // Sort
    if (sortBy === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'downloads') {
      items.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Paginate
    const total = items.length;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    // Compute metadata
    const categories = [...new Set(MARKETPLACE_ITEMS.map((i) => i.category))];
    const totalDownloads = MARKETPLACE_ITEMS.reduce((sum, i) => sum + i.downloads, 0);
    const avgRating = MARKETPLACE_ITEMS.reduce((sum, i) => sum + i.rating, 0) / MARKETPLACE_ITEMS.length;

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        categories,
        totalItems: MARKETPLACE_ITEMS.length,
        totalDownloads,
        avgRating: Math.round(avgRating * 10) / 10,
        installedCount: installedIntegrations.size,
        freeCount: MARKETPLACE_ITEMS.filter((i) => i.price === 'free').length,
        paidCount: MARKETPLACE_ITEMS.filter((i) => i.price !== 'free').length,
      },
    });
  } catch (error) {
    console.error('Marketplace GET error:', error);
    return NextResponse.json(
      { error: 'Failed to list marketplace items' },
      { status: 500 }
    );
  }
}

// POST - Install or uninstall marketplace integrations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    const item = MARKETPLACE_ITEMS.find((i) => i.id === itemId);
    if (!item) {
      return NextResponse.json(
        { error: `Marketplace item '${itemId}' not found` },
        { status: 404 }
      );
    }

    if (action === 'install') {
      if (installedIntegrations.has(itemId)) {
        return NextResponse.json(
          { error: `Item '${item.name}' is already installed` },
          { status: 409 }
        );
      }

      installedIntegrations.add(itemId);

      return NextResponse.json({
        success: true,
        message: `'${item.name}' installed successfully`,
        item: {
          ...item,
          installed: true,
          installedAt: new Date().toISOString(),
        },
        totalInstalled: installedIntegrations.size,
      }, { status: 201 });
    }

    if (action === 'uninstall') {
      if (!installedIntegrations.has(itemId)) {
        return NextResponse.json(
          { error: `Item '${item.name}' is not installed` },
          { status: 404 }
        );
      }

      installedIntegrations.delete(itemId);

      return NextResponse.json({
        success: true,
        message: `'${item.name}' uninstalled successfully`,
        item: {
          ...item,
          installed: false,
          uninstalledAt: new Date().toISOString(),
        },
        totalInstalled: installedIntegrations.size,
      });
    }

    if (action === 'details') {
      // Return detailed info about a specific item
      return NextResponse.json({
        ...item,
        installed: installedIntegrations.has(itemId),
        details: {
          version: '1.0.0',
          lastUpdated: '2026-06-20',
          size: `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}MB`,
          permissions: ['read:files', 'write:code'],
          changelog: [
            { version: '1.0.0', date: '2026-06-20', notes: 'Initial release' },
          ],
          reviews: [
            { user: 'dev42', rating: 5, comment: 'Excellent integration, saves hours!', date: '2026-06-22' },
            { user: 'code_ninja', rating: 4, comment: 'Works well, minor setup complexity', date: '2026-06-21' },
          ],
        },
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Supported: install, uninstall, details` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Marketplace POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process marketplace action' },
      { status: 500 }
    );
  }
}
