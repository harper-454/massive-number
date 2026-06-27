export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Static catalog definition — this is configuration, NOT demo data
// It defines the known integrations available in the marketplace
const MARKETPLACE_CATALOG = [
  { id: "gh-copilot", name: "GitHub Copilot Bridge", description: "Use Copilot suggestions within MASSIVE NUMBER", category: "ai", rating: 4.8, author: "community", price: "free", verified: true },
  { id: "jest-runner", name: "Jest Test Runner", description: "Run Jest tests with AI-powered failure analysis", category: "testing", rating: 4.6, author: "community", price: "free", verified: true },
  { id: "figma-sync", name: "Figma Design Sync", description: "Import Figma designs as React components", category: "design", rating: 4.3, author: "design-tools", price: "free", verified: true },
  { id: "terraform-gen", name: "Terraform Generator", description: "Generate infrastructure-as-code from natural language", category: "devops", rating: 4.5, author: "devops-pro", price: "$9/mo", verified: false },
  { id: "api-tester", name: "API Tester Pro", description: "AI-powered API testing and documentation", category: "testing", rating: 4.7, author: "api-tools", price: "free", verified: true },
  { id: "db-designer", name: "Database Schema Designer", description: "Visual database schema design with AI migration generation", category: "database", rating: 4.4, author: "db-tools", price: "free", verified: true },
  { id: "security-scanner", name: "Security Vulnerability Scanner", description: "Real-time security scanning with AI fix suggestions", category: "security", rating: 4.9, author: "security-pro", price: "$19/mo", verified: true },
  { id: "doc-generator", name: "Documentation Generator", description: "Auto-generate API docs, READMEs, and code comments", category: "documentation", rating: 4.2, author: "docs-ai", price: "free", verified: false },
  { id: "perf-monitor", name: "Performance Monitor", description: "Real-time performance profiling with AI optimization tips", category: "monitoring", rating: 4.1, author: "perf-tools", price: "$5/mo", verified: true },
  { id: "i18n-ai", name: "i18n AI Translator", description: "AI-powered internationalization with context-aware translations", category: "localization", rating: 4.6, author: "localize-ai", price: "free", verified: true },
] as const;

// GET - List installed integrations FROM DATABASE + available catalog
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort'); // 'rating', 'name'
    const filter = searchParams.get('filter'); // 'installed', 'free', 'paid', 'verified'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get installed integrations from database
    const installedItems = await db.installedIntegration.findMany();
    const installedIds = new Set(installedItems.map((i) => i.itemId));

    // Build full catalog with installed status
    let items = MARKETPLACE_CATALOG.map((item) => ({
      ...item,
      installed: installedIds.has(item.id),
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
    } else if (sortBy === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Paginate
    const total = items.length;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    const categories = [...new Set(MARKETPLACE_CATALOG.map((i) => i.category))];

    return NextResponse.json({
      items: paginatedItems,
      installed: installedItems.map((i) => ({
        id: i.itemId,
        name: i.name,
        description: i.description,
        category: i.category,
        author: i.author,
        rating: i.rating,
        price: i.price,
        verified: i.verified,
        installedAt: i.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        categories,
        totalItems: MARKETPLACE_CATALOG.length,
        installedCount: installedItems.length,
        freeCount: MARKETPLACE_CATALOG.filter((i) => i.price === 'free').length,
        paidCount: MARKETPLACE_CATALOG.filter((i) => i.price !== 'free').length,
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
    const { action, itemId, name, description, category, author, rating, price, verified } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    if (action === 'install') {
      // Check if already installed
      const existing = await db.installedIntegration.findUnique({
        where: { itemId },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Item '${existing.name}' is already installed` },
          { status: 409 }
        );
      }

      // Find item in catalog or use provided data
      const catalogItem = MARKETPLACE_CATALOG.find((i) => i.id === itemId);

      const integration = await db.installedIntegration.create({
        data: {
          itemId,
          name: name || catalogItem?.name || itemId,
          description: description || catalogItem?.description || null,
          category: category || catalogItem?.category || null,
          author: author || catalogItem?.author || null,
          rating: rating || catalogItem?.rating || 0,
          price: price || catalogItem?.price || 'free',
          verified: verified !== undefined ? verified : (catalogItem?.verified || false),
        },
      });

      // Log activity
      await db.activity.create({
        data: {
          action: 'marketplace_install',
          entity: 'InstalledIntegration',
          entityId: integration.id,
          description: `Installed integration: ${integration.name}`,
          metadata: JSON.stringify({ itemId, category: integration.category }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `'${integration.name}' installed successfully`,
        item: {
          id: integration.itemId,
          name: integration.name,
          description: integration.description,
          category: integration.category,
          author: integration.author,
          rating: integration.rating,
          price: integration.price,
          verified: integration.verified,
          installed: true,
          installedAt: integration.createdAt,
        },
      }, { status: 201 });
    }

    if (action === 'uninstall') {
      const existing = await db.installedIntegration.findUnique({
        where: { itemId },
      });

      if (!existing) {
        return NextResponse.json(
          { error: `Item '${itemId}' is not installed` },
          { status: 404 }
        );
      }

      await db.installedIntegration.delete({
        where: { itemId },
      });

      // Log activity
      await db.activity.create({
        data: {
          action: 'marketplace_uninstall',
          entity: 'InstalledIntegration',
          entityId: existing.id,
          description: `Uninstalled integration: ${existing.name}`,
          metadata: JSON.stringify({ itemId }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `'${existing.name}' uninstalled successfully`,
        itemId,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Supported: install, uninstall` },
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
