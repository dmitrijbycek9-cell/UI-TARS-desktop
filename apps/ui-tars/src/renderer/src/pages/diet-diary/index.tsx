import { useState } from 'react';
import dayjs from 'dayjs';
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
import { Separator } from '@renderer/components/ui/separator';
import { BarcodeScanner } from '@renderer/components/DietDiary/BarcodeScanner';
import { FoodSearch } from '@renderer/components/DietDiary/FoodSearch';
import { FoodEntryForm } from '@renderer/components/DietDiary/FoodEntryForm';
import { MealSection } from '@renderer/components/DietDiary/MealSection';
import { useDietDiary } from '@renderer/hooks/useDietDiary';
import {
  fetchProductByBarcode,
  type ProductInfo,
} from '@renderer/services/openFoodFacts';
import type { FoodEntry, MealType } from '@renderer/store/dietDiary';

const TODAY = dayjs().format('YYYY-MM-DD');

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function DietDiaryPage() {
  const {
    selectedDate,
    byMeal,
    entries,
    loading,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    setSelectedDate,
    addEntry,
    deleteEntry,
  } = useDietDiary();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(
    null,
  );
  const [scanning, setScanning] = useState(false);

  const isToday = selectedDate === TODAY;
  const displayDate = isToday
    ? 'Heute'
    : dayjs(selectedDate).format('DD.MM.YYYY');

  const goToPrev = () =>
    setSelectedDate(
      dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'),
    );
  const goToNext = () => {
    const next = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
    if (next <= TODAY) setSelectedDate(next);
  };
  const goToToday = () => setSelectedDate(TODAY);

  const openEntryForm = (product: ProductInfo) => {
    setSelectedProduct(product);
    setEntryFormOpen(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setScannerOpen(false);
    setScanning(true);
    try {
      const product = await fetchProductByBarcode(barcode);
      if (product) {
        openEntryForm(product);
      } else {
        toast.error(`Produkt für Barcode „${barcode}" nicht gefunden`);
      }
    } catch {
      toast.error('Fehler beim Abrufen der Produktdaten');
    } finally {
      setScanning(false);
    }
  };

  const handleAddEntry = (entry: Omit<FoodEntry, 'id' | 'addedAt'>) => {
    addEntry(entry);
    toast.success(`„${entry.productName}" hinzugefügt`);
  };

  const hasMacros = totalProtein > 0 || totalCarbs > 0 || totalFat > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Diät-Tagebuch
          </h1>
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
            <p className="text-sm font-medium">{displayDate}</p>
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
              onClick={goToToday}
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
            <div className="text-center">
              <p className="text-3xl font-bold">{Math.round(totalCalories)}</p>
              <p className="text-sm text-muted-foreground">kcal heute</p>
            </div>
            {hasMacros && (
              <>
                <Separator className="my-3" />
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="font-semibold">{Math.round(totalProtein)}g</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div>
                    <p className="font-semibold">{Math.round(totalCarbs)}g</p>
                    <p className="text-xs text-muted-foreground">
                      Kohlenhydrate
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">{Math.round(totalFat)}g</p>
                    <p className="text-xs text-muted-foreground">Fett</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add food row */}
        <div className="flex gap-2">
          <FoodSearch onSelect={openEntryForm} />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setScannerOpen(true)}
            disabled={scanning}
            title="Barcode scannen"
          >
            <ScanBarcode className="h-4 w-4" />
          </Button>
        </div>

        {/* Meal sections */}
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Laden...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 space-y-2">
            <UtensilsCrossed className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm">Noch keine Einträge für diesen Tag.</p>
            <p className="text-xs">
              Suche nach Lebensmitteln oder scanne einen Barcode.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {MEAL_ORDER.map((meal) =>
              byMeal[meal].length > 0 ? (
                <MealSection
                  key={meal}
                  meal={meal}
                  entries={byMeal[meal]}
                  onDelete={deleteEntry}
                />
              ) : null,
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BarcodeScanner
        open={scannerOpen}
        onScan={handleBarcodeScanned}
        onClose={() => setScannerOpen(false)}
      />

      <FoodEntryForm
        product={selectedProduct}
        open={entryFormOpen}
        onClose={() => {
          setEntryFormOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleAddEntry}
        date={selectedDate}
      />
    </div>
  );
}
