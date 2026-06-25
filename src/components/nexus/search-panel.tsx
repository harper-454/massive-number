'use client';

import { useState } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  Clock,
  Sparkles,
  Loader2,
  BookOpen,
  RotateCcw,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchStore, type SearchResult } from '@/stores/search-store';
import { motion, AnimatePresence } from 'framer-motion';

function SearchResultItem({ result }: { result: SearchResult }) {
  const domain = result.host_name || new URL(result.url).hostname;

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="block rounded-lg border border-border/50 bg-card p-3 hover:bg-accent/50 hover:border-border transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
          <Globe className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors truncate">
              {result.name}
            </h3>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
            {result.snippet}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">
              {domain}
            </Badge>
            {result.date && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {result.date}
              </span>
            )}
            {result.rank && (
              <span className="text-[10px] text-muted-foreground">
                #{result.rank}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
}

function SearchSkeletons() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/50 bg-card p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchPanel() {
  const {
    results,
    summary,
    isSearching,
    query,
    searchHistory,
    setQuery,
    clearResults,
    search,
    searchWithSummary,
  } = useSearchStore();

  const [localQuery, setLocalQuery] = useState(query);

  const handleSearch = () => {
    const q = localQuery.trim();
    if (!q || isSearching) return;
    setQuery(q);
    search(q);
  };

  const handleSearchWithSummary = () => {
    const q = localQuery.trim();
    if (!q || isSearching) return;
    setQuery(q);
    searchWithSummary(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleHistoryClick = (q: string) => {
    setLocalQuery(q);
    setQuery(q);
    search(q);
  };

  const handleClear = () => {
    setLocalQuery('');
    clearResults();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search header */}
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Web Search</h2>
            <p className="text-xs text-muted-foreground">
              Ground your AI with real-time information
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search the web..."
              className="pl-9 pr-8 h-9 bg-card border-border/50 placeholder:text-muted-foreground/60"
            />
            {localQuery && (
              <button
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button
            onClick={handleSearch}
            disabled={!localQuery.trim() || isSearching}
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isSearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Search
          </Button>
          <Button
            onClick={handleSearchWithSummary}
            disabled={!localQuery.trim() || isSearching}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-border/50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Search + Summarize
          </Button>
          {results.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 ml-auto"
              onClick={handleClear}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Summary */}
          <AnimatePresence>
            {summary && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium">AI Summary</span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1 ml-auto"
                      >
                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                        AI-generated
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {summary}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search results */}
          {isSearching ? (
            <SearchSkeletons />
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {results.length} results for &quot;{query}&quot;
                </span>
              </div>
              {results.map((result, i) => (
                <SearchResultItem key={`${result.url}-${i}`} result={result} />
              ))}
            </div>
          ) : !isSearching && query ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No results found</p>
            </div>
          ) : null}

          {/* Search history */}
          {searchHistory.length > 0 && results.length === 0 && !isSearching && (
            <div className="pt-4 border-t border-border/30">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Recent Searches
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {searchHistory.slice(0, 10).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleHistoryClick(q)}
                    className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Clock className="h-3 w-3" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {results.length === 0 && !isSearching && !query && searchHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                <Globe className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Search the web for current information
              </p>
              <p className="text-xs text-muted-foreground/60">
                Ground your AI responses with real-time data
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
