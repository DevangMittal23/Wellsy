"use client";

import { useState, useEffect } from "react";
import { Search, Image, Film, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/use-debounce";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<{ id: string; title: string; url: string; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!isOpen) return;

    const fetchGifs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gif/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setGifs(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGifs();
  }, [debouncedQuery, isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-accent transition-colors cursor-pointer focus:outline-none"
          title="Send GIF"
        >
          <Film className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px] bg-surface border border-border shadow-xl p-3 space-y-3 rounded-xl z-50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search Tenor GIFs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface-secondary border border-border/80 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none focus:border-accent"
          />
        </div>

        <div className="h-48 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : gifs.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSelect(gif.url);
                    setIsOpen(false);
                  }}
                  className="relative rounded overflow-hidden aspect-video bg-black/10 hover:opacity-85 transition-opacity cursor-pointer group"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-text-muted">
              <Image className="h-6 w-6 mb-1" />
              <span className="text-[10px]">No GIFs found</span>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
