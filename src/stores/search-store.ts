import { create } from 'zustand';

export interface SearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
}

interface SearchStore {
  results: SearchResult[];
  summary: string | null;
  isSearching: boolean;
  query: string;
  searchHistory: string[];

  // Actions
  setResults: (results: SearchResult[]) => void;
  setSummary: (summary: string | null) => void;
  setIsSearching: (searching: boolean) => void;
  setQuery: (query: string) => void;
  addSearchHistory: (query: string) => void;
  clearResults: () => void;
  search: (query: string, num?: number) => Promise<void>;
  searchWithSummary: (query: string) => Promise<void>;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  results: [],
  summary: null,
  isSearching: false,
  query: '',
  searchHistory: [],

  setResults: (results) => set({ results }),
  setSummary: (summary) => set({ summary }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setQuery: (query) => set({ query }),
  addSearchHistory: (query) =>
    set((state) => ({
      searchHistory: [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 20),
    })),
  clearResults: () => set({ results: [], summary: null }),

  search: async (query, num = 10) => {
    set({ isSearching: true, query });
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&num=${num}`);
      if (res.ok) {
        const data = await res.json();
        set({ results: data.results || [], isSearching: false });
        get().addSearchHistory(query);
      } else {
        set({ isSearching: false });
      }
    } catch {
      set({ isSearching: false });
    }
  },

  searchWithSummary: async (query) => {
    set({ isSearching: true, query });
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, num: 10 }),
      });
      if (res.ok) {
        const data = await res.json();
        set({
          results: data.results || [],
          summary: data.summary || null,
          isSearching: false,
        });
        get().addSearchHistory(query);
      } else {
        set({ isSearching: false });
      }
    } catch {
      set({ isSearching: false });
    }
  },
}));
