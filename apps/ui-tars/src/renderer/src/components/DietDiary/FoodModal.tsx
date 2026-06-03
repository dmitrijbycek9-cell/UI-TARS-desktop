import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { searchFoods, type LocalFood } from '@renderer/data/foodDatabase';
import type { MealType, FoodEntry } from '@renderer/db/dietDiary';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const ACCENT = '#22c55e';

interface FoodModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: Omit<FoodEntry, 'id'>, meal: MealType) => void;
  defaultMeal?: MealType;
  prefill?: {
    name: string;
    cal: number;
    p: number;
    k: number;
    f: number;
  } | null;
}

type Tab = 'search' | 'manual';

export function FoodModal({
  open,
  onClose,
  onAdd,
  defaultMeal = 'breakfast',
  prefill,
}: FoodModalProps) {
  const [tab, setTab] = useState<Tab>(prefill ? 'manual' : 'search');
  const [meal, setMeal] = useState<MealType>(defaultMeal);

  // Search tab state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalFood[]>([]);
  const [selected, setSelected] = useState<LocalFood | null>(null);
  const [amount, setAmount] = useState('100');

  // Manual tab state
  const [manName, setManName] = useState('');
  const [manCal, setManCal] = useState('');
  const [manP, setManP] = useState('');
  const [manK, setManK] = useState('');
  const [manF, setManF] = useState('');
  const [manAmount, setManAmount] = useState('100');

  useEffect(() => {
    if (!open) return;
    setMeal(defaultMeal);
    setQuery('');
    setResults([]);
    setSelected(null);
    setAmount('100');
    if (prefill) {
      setTab('manual');
      setManName(prefill.name);
      setManCal(String(prefill.cal));
      setManP(String(prefill.p));
      setManK(String(prefill.k));
      setManF(String(prefill.f));
      setManAmount('100');
    } else {
      setTab('search');
      setManName('');
      setManCal('');
      setManP('');
      setManK('');
      setManF('');
      setManAmount('100');
    }
  }, [open, defaultMeal, prefill]);

  useEffect(() => {
    setResults(searchFoods(query));
    setSelected(null);
  }, [query]);

  const searchKcal = selected
    ? Math.round((selected.cal * Number(amount || 0)) / 100)
    : 0;
  const searchP = selected
    ? Math.round((selected.p * Number(amount || 0)) / 100)
    : 0;
  const searchK = selected
    ? Math.round((selected.k * Number(amount || 0)) / 100)
    : 0;
  const searchF = selected
    ? Math.round((selected.f * Number(amount || 0)) / 100)
    : 0;

  const manKcal = Math.round(
    (Number(manCal || 0) * Number(manAmount || 0)) / 100,
  );
  const manPg = Math.round((Number(manP || 0) * Number(manAmount || 0)) / 100);
  const manKg = Math.round((Number(manK || 0) * Number(manAmount || 0)) / 100);
  const manFg = Math.round((Number(manF || 0) * Number(manAmount || 0)) / 100);

  const handleAddSearch = () => {
    if (!selected) return;
    const amt = Number(amount) || 0;
    if (amt <= 0) return;
    onAdd(
      {
        name: selected.name,
        amount: amt,
        cal: Math.round((selected.cal * amt) / 100),
        p: Math.round((selected.p * amt) / 100),
        k: Math.round((selected.k * amt) / 100),
        f: Math.round((selected.f * amt) / 100),
      },
      meal,
    );
    onClose();
  };

  const handleAddManual = () => {
    if (!manName.trim()) return;
    const amt = Number(manAmount) || 0;
    if (amt <= 0) return;
    onAdd(
      {
        name: manName.trim(),
        amount: amt,
        cal: manKcal,
        p: manPg,
        k: manKg,
        f: manFg,
      },
      meal,
    );
    onClose();
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '7px 0',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    background: active ? ACCENT : 'transparent',
    color: active ? '#fff' : 'var(--muted-foreground, #888)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const selectStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: 8,
    border: `2px solid ${active ? ACCENT : 'transparent'}`,
    background: active ? `${ACCENT}22` : 'var(--muted, #f3f4f6)',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'border-color 0.15s',
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontSize: 16 }}>
            Lebensmittel hinzufügen
          </DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'var(--muted, #f3f4f6)',
            borderRadius: 10,
            padding: 4,
          }}
        >
          <button
            style={tabStyle(tab === 'search')}
            onClick={() => setTab('search')}
          >
            Suchen
          </button>
          <button
            style={tabStyle(tab === 'manual')}
            onClick={() => setTab('manual')}
          >
            Eigene Eingabe
          </button>
        </div>

        {/* Meal selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {MEAL_ORDER.map((m) => (
            <button
              key={m}
              onClick={() => setMeal(m)}
              style={{
                flex: 1,
                fontSize: 11,
                padding: '5px 4px',
                borderRadius: 6,
                border: `2px solid ${meal === m ? ACCENT : 'transparent'}`,
                background:
                  meal === m ? `${ACCENT}22` : 'var(--muted, #f3f4f6)',
                color: meal === m ? ACCENT : 'var(--muted-foreground)',
                cursor: 'pointer',
                fontWeight: meal === m ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>

        {tab === 'search' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input
              placeholder="Lebensmittel suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />

            {/* Results list */}
            {results.length > 0 && !selected && (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {results.map((food) => (
                  <button
                    key={food.id}
                    style={selectStyle(false)}
                    onClick={() => setSelected(food)}
                  >
                    <span>{food.name}</span>
                    <span
                      style={{ color: 'var(--muted-foreground)', fontSize: 12 }}
                    >
                      {food.cal} kcal/100g
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    background: `${ACCENT}18`,
                    borderRadius: 8,
                    border: `1px solid ${ACCENT}55`,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                    {selected.name}
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--muted-foreground)',
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input
                    type="number"
                    min="1"
                    max="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: 90 }}
                  />
                  <span
                    style={{ fontSize: 13, color: 'var(--muted-foreground)' }}
                  >
                    g
                  </span>
                </div>

                {/* Live preview */}
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: ACCENT,
                      lineHeight: 1,
                    }}
                  >
                    {searchKcal}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted-foreground)',
                      marginTop: 2,
                    }}
                  >
                    kcal
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--muted-foreground)',
                      marginTop: 4,
                    }}
                  >
                    P: {searchP}g &nbsp;·&nbsp; K: {searchK}g &nbsp;·&nbsp; F:{' '}
                    {searchF}g
                  </div>
                </div>

                <Button
                  style={{ background: ACCENT, color: '#fff' }}
                  onClick={handleAddSearch}
                  disabled={Number(amount) <= 0}
                >
                  Hinzufügen
                </Button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              placeholder="Name des Lebensmittels"
              value={manName}
              onChange={(e) => setManName(e.target.value)}
              autoFocus={!prefill}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--muted-foreground)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  kcal / 100g
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manCal}
                  onChange={(e) => setManCal(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--muted-foreground)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  Menge (g)
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={manAmount}
                  onChange={(e) => setManAmount(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--muted-foreground)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  Protein / 100g
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manP}
                  onChange={(e) => setManP(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--muted-foreground)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  Kohlenhydrate / 100g
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manK}
                  onChange={(e) => setManK(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: 'var(--muted-foreground)',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  Fett / 100g
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manF}
                  onChange={(e) => setManF(e.target.value)}
                />
              </div>
            </div>

            {/* Live preview */}
            {manName && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: ACCENT,
                    lineHeight: 1,
                  }}
                >
                  {manKcal}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted-foreground)',
                    marginTop: 2,
                  }}
                >
                  kcal
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--muted-foreground)',
                    marginTop: 4,
                  }}
                >
                  P: {manPg}g &nbsp;·&nbsp; K: {manKg}g &nbsp;·&nbsp; F: {manFg}
                  g
                </div>
              </div>
            )}

            <Button
              style={{ background: ACCENT, color: '#fff' }}
              onClick={handleAddManual}
              disabled={!manName.trim() || Number(manAmount) <= 0}
            >
              Hinzufügen
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
