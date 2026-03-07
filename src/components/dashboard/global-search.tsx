"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface SearchAccount {
  id: string;
  name: string;
  domain?: string;
  segment: string;
  mrr: number;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<SearchAccount[]>([]);
  const [filtered, setFiltered] = useState<SearchAccount[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all accounts on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/accounts?limit=500")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setAccounts(data.accounts ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      return;
    }
    const q = query.toLowerCase();
    const results = accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.domain && a.domain.toLowerCase().includes(q))
    );
    setFiltered(results.slice(0, 8));
    setSelectedIndex(0);
  }, [query, accounts]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (accountId: string) => {
      setIsOpen(false);
      setQuery("");
      router.push(`/dashboard/accounts/${accountId}`);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].id);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const segmentColor: Record<string, string> = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search accounts..."
        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query.trim() && setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
      )}

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No accounts found
            </div>
          ) : (
            <ul>
              {filtered.map((account, idx) => (
                <li key={account.id}>
                  <button
                    type="button"
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left text-sm transition-colors ${
                      idx === selectedIndex
                        ? "bg-slate-100"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => handleSelect(account.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        segmentColor[account.segment] ?? "bg-slate-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {account.name}
                      </div>
                      {account.domain && (
                        <div className="text-xs text-muted-foreground truncate">
                          {account.domain}
                        </div>
                      )}
                    </div>
                    {account.mrr > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                        ${account.mrr.toLocaleString()}/mo
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
