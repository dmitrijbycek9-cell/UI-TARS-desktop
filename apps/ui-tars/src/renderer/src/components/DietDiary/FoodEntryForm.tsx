import { useEffect } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@renderer/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';
import { Badge } from '@renderer/components/ui/badge';
import type { ProductInfo } from '@renderer/services/openFoodFacts';
import type { FoodEntry, MealType } from '@renderer/store/dietDiary';

const formSchema = z.object({
  quantity: z.coerce
    .number()
    .min(1, 'Mindestens 1g')
    .max(5000, 'Maximal 5000g'),
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
};

interface FoodEntryFormProps {
  product: ProductInfo | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<FoodEntry, 'id' | 'addedAt'>) => void;
  date: string;
}

export function FoodEntryForm({
  product,
  open,
  onClose,
  onSubmit,
  date,
}: FoodEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { quantity: 100, meal: 'lunch' },
  });

  const quantity = form.watch('quantity') || 0;
  const totalKcal = product ? (product.caloriesPer100g * quantity) / 100 : 0;

  useEffect(() => {
    if (open) form.reset({ quantity: 100, meal: 'lunch' });
  }, [open]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!product) return;
    onSubmit({
      date,
      meal: values.meal as MealType,
      productName: product.name,
      barcode: product.barcode || undefined,
      quantity: values.quantity,
      calories: product.caloriesPer100g,
      protein: product.proteinPer100g,
      carbs: product.carbsPer100g,
      fat: product.fatPer100g,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eintrag hinzufügen</DialogTitle>
        </DialogHeader>

        {product && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="font-medium text-sm">{product.name}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs">
                {Math.round(product.caloriesPer100g)} kcal/100g
              </Badge>
              {product.proteinPer100g != null && (
                <Badge variant="outline" className="text-xs">
                  Protein: {Math.round(product.proteinPer100g)}g
                </Badge>
              )}
              {product.carbsPer100g != null && (
                <Badge variant="outline" className="text-xs">
                  Kohlenhydrate: {Math.round(product.carbsPer100g)}g
                </Badge>
              )}
              {product.fatPer100g != null && (
                <Badge variant="outline" className="text-xs">
                  Fett: {Math.round(product.fatPer100g)}g
                </Badge>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menge (g)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mahlzeit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {MEAL_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {product && (
              <div className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-center">
                Gesamt: {Math.round(totalKcal)} kcal
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={!product}>
                Hinzufügen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
