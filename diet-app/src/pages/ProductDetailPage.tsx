import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { NutritionTable } from '@/components/recipe/NutritionTable';
import { ManualEntryForm } from '@/components/scanner/ManualEntryForm';
import { Button, Card, Field, Input, Select, Spinner } from '@/components/ui';
import { t } from '@/i18n/de';
import {
  getProduct,
  ProductNotFoundError,
} from '@/lib/api/openFoodFacts';
import { scaleNutrients } from '@/lib/nutrition';
import { useDiaryStore } from '@/stores/useDiaryStore';
import { useUiStore } from '@/stores/useUiStore';
import type { MealType, Product } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type Status = 'loading' | 'found' | 'manual' | 'noData';

export default function ProductDetailPage() {
  const { barcode = '' } = useParams();
  const navigate = useNavigate();
  const addProduct = useDiaryStore((s) => s.addProduct);
  const selectedDate = useUiStore((s) => s.selectedDate);
  const showToast = useUiStore((s) => s.showToast);

  const [status, setStatus] = useState<Status>('loading');
  const [product, setProduct] = useState<Product | null>(null);
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<MealType>('snack');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    getProduct(barcode)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        setGrams(p.defaultPortionG ?? 100);
        // Produkt gefunden, aber OFF hat keine Nährwerte hinterlegt
        setStatus(p.hasNutrition === false ? 'noData' : 'found');
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ProductNotFoundError) {
          showToast(t.scanner.notFound, 'info');
        }
        setStatus('manual');
      });
    return () => {
      active = false;
    };
  }, [barcode, showToast]);

  async function handleAdd() {
    if (!product) return;
    await addProduct(product, grams, meal, selectedDate);
    showToast(t.product.saved);
    navigate('/');
  }

  return (
    <div>
      <PageHeader title={t.product.title} back subtitle={barcode} />
      <div className="space-y-4 p-4">
        {status === 'loading' && (
          <Card className="flex flex-col items-center gap-3 py-10">
            <Spinner />
            <p className="text-sm text-slate-500">{t.scanner.searching}</p>
          </Card>
        )}

        {status === 'manual' && (
          <Card>
            <p className="mb-4 text-sm text-slate-500">{t.scanner.notFound}</p>
            <ManualEntryForm
              barcode={barcode}
              onSaved={(p) => {
                setProduct(p);
                setGrams(p.defaultPortionG ?? 100);
                setStatus('found');
              }}
            />
          </Card>
        )}

        {status === 'noData' && product && (
          <Card>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt=""
                className="mb-3 h-16 w-16 rounded-xl object-cover"
              />
            )}
            <h2 className="font-bold text-slate-900">{product.name}</h2>
            <p className="mb-4 mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {t.product.noNutrition}
            </p>
            <ManualEntryForm
              barcode={barcode}
              initialName={product.name}
              initialBrand={product.brand}
              onSaved={(p) => {
                setProduct(p);
                setGrams(p.defaultPortionG ?? 100);
                setStatus('found');
              }}
            />
          </Card>
        )}

        {status === 'found' && product && (
          <>
            <Card className="space-y-3">
              <div className="flex items-center gap-3">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-slate-900">
                    {product.name}
                  </h2>
                  {product.brand && (
                    <p className="text-sm text-slate-400">{product.brand}</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <Field label={t.product.portionG}>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                />
              </Field>
              <Field label={t.diary.chooseMeal}>
                <Select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value as MealType)}
                >
                  {MEALS.map((m) => (
                    <option key={m} value={m}>
                      {t.meals[m]}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="rounded-xl bg-slate-50 p-3">
                <NutritionTable
                  nutrients={scaleNutrients(product.per100g, grams)}
                  caption={`${t.common.portion}: ${grams} g`}
                />
              </div>

              <Button className="w-full" onClick={handleAdd}>
                {t.product.addToDiary}
              </Button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
