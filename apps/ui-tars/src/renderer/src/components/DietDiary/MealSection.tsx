import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Separator } from '@renderer/components/ui/separator';
import type { FoodEntry, MealType } from '@renderer/store/dietDiary';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};

interface MealSectionProps {
  meal: MealType;
  entries: FoodEntry[];
  onDelete: (id: string) => void;
}

export function MealSection({ meal, entries, onDelete }: MealSectionProps) {
  const subtotal = entries.reduce(
    (sum, e) => sum + (e.calories * e.quantity) / 100,
    0,
  );

  if (entries.length === 0) return null;

  const handleDelete = (entry: FoodEntry) => {
    onDelete(entry.id);
    toast.success(`„${entry.productName}" entfernt`);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {MEAL_LABELS[meal]}
        </h3>
        <span className="text-sm font-medium">{Math.round(subtotal)} kcal</span>
      </div>
      <Separator className="mb-3" />
      <ScrollArea>
        <div className="space-y-2">
          {entries.map((entry) => {
            const entryKcal = (entry.calories * entry.quantity) / 100;
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 py-1"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.productName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {entry.quantity} g
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-medium">
                      {Math.round(entryKcal)} kcal
                    </span>
                    {entry.protein != null && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        P: {Math.round((entry.protein * entry.quantity) / 100)}g
                      </Badge>
                    )}
                    {entry.carbs != null && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        K: {Math.round((entry.carbs * entry.quantity) / 100)}g
                      </Badge>
                    )}
                    {entry.fat != null && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        F: {Math.round((entry.fat * entry.quantity) / 100)}g
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(entry)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
