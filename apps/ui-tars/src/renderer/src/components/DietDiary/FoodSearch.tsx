import { useState, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
  searchProducts,
  type ProductInfo,
} from '@renderer/services/openFoodFacts';

interface FoodSearchProps {
  onSelect: (product: ProductInfo) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchProducts(value.trim());
        setResults(found);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (product: ProductInfo) => {
    onSelect(product);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative flex-1">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          className="pl-9"
          placeholder="Lebensmittel suchen..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-md border bg-popover shadow-md">
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {results.map((product, i) => (
                <button
                  key={i}
                  className="w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground flex justify-between items-center gap-2"
                  onMouseDown={() => handleSelect(product)}
                >
                  <span className="truncate">{product.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {Math.round(product.caloriesPer100g)} kcal/100g
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-md border bg-popover shadow-md p-3 text-sm text-muted-foreground">
          Keine Ergebnisse für „{query}"
        </div>
      )}
    </div>
  );
}
