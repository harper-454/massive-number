export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// GET - Web search with structured results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const num = parseInt(searchParams.get('num') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query parameter "q" is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const results = await zai.functions.invoke('web_search', { query, num });

    // Normalize results to structured format
    const searchResults = Array.isArray(results)
      ? results.map((item: Record<string, unknown>, index: number) => ({
          url: (item.url as string) || (item.link as string) || '',
          name: (item.name as string) || (item.title as string) || '',
          snippet: (item.snippet as string) || (item.description as string) || '',
          host_name: (item.host_name as string) || extractHostname((item.url as string) || (item.link as string) || ''),
          rank: index + 1,
          date: (item.date as string) || new Date().toISOString(),
        }))
      : [];

    return NextResponse.json({
      query,
      results: searchResults,
      total: searchResults.length,
    });
  } catch (error) {
    console.error('Search GET error:', error);
    return NextResponse.json(
      { error: 'Failed to perform web search' },
      { status: 500 }
    );
  }
}

// POST - Web search with AI-summarized results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, num = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Perform web search
    const searchResults = await zai.functions.invoke('web_search', { query, num });

    // Normalize search results
    const normalizedResults = Array.isArray(searchResults)
      ? searchResults.map((item: Record<string, unknown>, index: number) => ({
          url: (item.url as string) || (item.link as string) || '',
          name: (item.name as string) || (item.title as string) || '',
          snippet: (item.snippet as string) || (item.description as string) || '',
          host_name: (item.host_name as string) || extractHostname((item.url as string) || (item.link as string) || ''),
          rank: index + 1,
          date: (item.date as string) || new Date().toISOString(),
        }))
      : [];

    // Build context from search results for AI summarization
    const searchContext = normalizedResults
      .map((r: { name: string; snippet: string; url: string }, i: number) => `[${i + 1}] ${r.name}\n${r.snippet}\nURL: ${r.url}`)
      .join('\n\n');

    // Get AI summary of search results
    let summary = '';
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Summarize the following search results into a concise, well-structured answer. Cite sources using [1], [2], etc. format. Be factual and comprehensive.',
          },
          {
            role: 'user',
            content: `Query: ${query}\n\nSearch Results:\n${searchContext}`,
          },
        ],
      });
      summary = completion.choices?.[0]?.message?.content || '';
    } catch (aiError) {
      console.error('AI summary error:', aiError);
      summary = 'Unable to generate AI summary at this time.';
    }

    return NextResponse.json({
      query,
      results: normalizedResults,
      summary,
      total: normalizedResults.length,
    });
  } catch (error) {
    console.error('Search POST error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search with summary' },
      { status: 500 }
    );
  }
}

// Helper: Extract hostname from URL
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
