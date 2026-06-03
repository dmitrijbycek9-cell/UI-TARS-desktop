import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ScanBarcode,
  UtensilsCrossed,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent } from '@renderer/components/ui/card';
import { BarcodeScanner } from '@renderer/components/DietDiary/BarcodeScanner';
import { FoodModal } from '@renderer/components/DietDiary/FoodModal';
import { MealSection } from '@renderer/components/DietDiary/MealSection';
import { MacroBar } from '@renderer/components/DietDiary/MacroBar';
import { WaterTracker } from '@renderer/components/DietDiary/WaterTracker';
import { useDietDiary } from '@renderer/hooks/useDietDiary';
import { fetchProductByBarcode } from '@renderer/services/openFoodFacts';
import type { FoodEntry, MealType } from '@renderer/db/dietDiary';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const ACCENT = '#22c55e';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDate(str: string, n: number): string {
  const d = new Date(str + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(str: string): string {
  const today = todayStr();
  if (str === today) return 'Heute';
  if (str === shiftDate(today, -1)) return 'Gestern';
  const d = new Date(str + 'T00:00:00');
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = [
    'Jan',
    'Feb',
    'Mär',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dez',
  ];
  return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]}`;
}

export default function DietDiaryPage() {
  const {
    selectedDate,
    byMeal,
    loading,
    totals,
    macroTargets,
    water,
    setSelectedDate,
    addEntry,
    removeEntry,
    setWater,
  } = useDietDiary();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultMeal, setDefaultMeal] = useState<MealType>('breakfast');
  const [scanning, setScanning] = useState(false);
  const [prefill, setPrefill] = useState<{
    name: string;
    cal: number;
    p: number;
    k: number;
    f: number;
  } | null>(null);

  const TODAY = todayStr();
  const isToday = selectedDate === TODAY;

  const goToPrev = () => setSelectedDate(shiftDate(selectedDate, -1));
  const goToNext = () => {
    const next = shiftDate(selectedDate, 1);
    if (next <= TODAY) setSelectedDate(next);
  };

  const openModal = (meal: MealType) => {
    setDefaultMeal(meal);
    setPrefill(null);
    setModalOpen(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setScannerOpen(false);
    setScanning(true);
    try {
      const product = await fetchProductByBarcode(barcode);
      if (product) {
        setPrefill({
          name: product.name,
          cal: product.caloriesPer100g ?? 0,
          p: product.proteinPer100g ?? 0,
          k: product.carbsPer100g ?? 0,
          f: product.fatPer100g ?? 0,
        });
        setDefaultMeal('breakfast');
        setModalOpen(true);
      } else {
        toast.error(`Produkt für Barcode „${barcode}" nicht gefunden`);
      }
    } catch {
      toast.error('Fehler beim Abrufen der Produktdaten');
    } finally {
      setScanning(false);
    }
  };

  const handleAdd = (entry: Omit<FoodEntry, 'id'>, meal: MealType) => {
    addEntry(meal, entry);
    toast.success(`„${entry.name}" hinzugefügt`);
  };

  const totalEntries = MEAL_ORDER.reduce((n, m) => n + byMeal[m].length, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Diät-Tagebuch
          </h1>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScannerOpen(true)}
            disabled={scanning}
            title="Barcode scannen"
          >
            <ScanBarcode className="h-4 w-4" />
          </Button>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm font-medium">{formatDate(selectedDate)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToNext}
            disabled={isToday}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setSelectedDate(TODAY)}
            >
              <CalendarDays className="h-3 w-3" />
              Heute
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary card */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <p className="text-4xl font-bold" style={{ color: ACCENT }}>
                {Math.round(totals.cal)}
              </p>
              <p className="text-sm text-muted-foreground">kcal</p>
            </div>
            <MacroBar
              label="Protein"
              value={totals.p}
              target={macroTargets.p}
              color="#3b82f6"
            />
            <MacroBar
              label="Kohlenhydrate"
              value={totals.k}
              target={macroTargets.k}
              color="#f97316"
            />
            <MacroBar
              label="Fett"
              value={totals.f}
              target={macroTargets.f}
              color="#eab308"
            />
          </CardContent>
        </Card>

        {/* Water tracker */}
        <WaterTracker count={water} onSet={setWater} accent={ACCENT} />

        {/* Meal sections */}
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Laden…
          </div>
        ) : totalEntries === 0 ? (
          <div className="space-y-3">
            {MEAL_ORDER.map((meal) => (
              <MealSection
                key={meal}
                meal={meal}
                entries={[]}
                onDelete={removeEntry}
                onAdd={openModal}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {MEAL_ORDER.map((meal) => (
              <MealSection
                key={meal}
                meal={meal}
                entries={byMeal[meal]}
                onDelete={removeEntry}
                onAdd={openModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BarcodeScanner
        open={scannerOpen}
        onScan={handleBarcodeScanned}
        onClose={() => setScannerOpen(false)}
      />

      <FoodModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPrefill(null);
        }}
        onAdd={handleAdd}
        defaultMeal={defaultMeal}
        prefill={prefill}
      />
    </div>
  );
}
