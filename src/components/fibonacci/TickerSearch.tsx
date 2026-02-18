"use client";

import { useState, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";

interface TickerSearchProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

export function TickerSearch({ onSearch, isLoading }: TickerSearchProps) {
  const [input, setInput] = useState("");

  const submit = useCallback(() => {
    const ticker = input.trim().toUpperCase();
    if (ticker) onSearch(ticker);
  }, [input, onSearch]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Enter ticker (e.g. AAPL)"
          className="h-10 w-56 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30"
          disabled={isLoading}
        />
      </div>
      <button
        onClick={submit}
        disabled={isLoading || !input.trim()}
        className="flex h-10 items-center gap-2 rounded-lg bg-emerald-400/15 px-4 text-sm font-medium text-emerald-400 transition hover:bg-emerald-400/25 disabled:opacity-40"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Analyze"
        )}
      </button>
    </div>
  );
}
