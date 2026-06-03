import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Separator } from '@renderer/components/ui/separator';
import type { FoodEntry, MealType } from '@renderer/db/dietDiary';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};

const ACCENT = '#22c55e';

interface MealSectionProps {
  meal: MealType;
  entries: FoodEntry[];
  onDelete: (meal: MealType, id: string) => void;
  onAdd: (meal: MealType) => void;
}

export function MealSection({
  meal,
  entries,
  onDelete,
  onAdd,
}: MealSectionProps) {
  const subtotal = entries.reduce((sum, e) => sum + e.cal, 0);

  const handleDelete = (entry: FoodEntry) => {
    onDelete(meal, entry.id);
    toast.success(`„${entry.name}" entfernt`);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {MEAL_LABELS[meal]}
        </h3>
        <span className="text-sm font-medium">{Math.round(subtotal)} kcal</span>
      </div>

      {entries.length > 0 && (
        <>
          <Separator className="mb-3" />
          <ScrollArea>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 py-1"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {entry.amount} g
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium">
                        {entry.cal} kcal
                      </span>
                      {entry.p > 0 && (
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          P: {entry.p}g
                        </Badge>
                      )}
                      {entry.k > 0 && (
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          K: {entry.k}g
                        </Badge>
                      )}
                      {entry.f > 0 && (
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          F: {entry.f}g
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
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Add button */}
      <button
        onClick={() => onAdd(meal)}
        style={{
          marginTop: entries.length > 0 ? 10 : 0,
          width: '100%',
          padding: '7px 0',
          borderRadius: 8,
          border: `2px dashed ${ACCENT}66`,
          background: 'transparent',
          color: ACCENT,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            `${ACCENT}10`;
          (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            'transparent';
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            `${ACCENT}66`;
        }}
      >
        <Plus size={14} />
        Hinzufügen
      </button>
    </div>
  );
}
