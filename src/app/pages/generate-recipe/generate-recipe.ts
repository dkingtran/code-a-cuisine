import { Component, signal, computed, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { merge, Subscription, EMPTY, of } from 'rxjs';
import { timeout, catchError, scan, finalize } from 'rxjs/operators';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';

interface Ingredient {
  id: number;
  name: string;
  amount: string;
  unit: 'gram' | 'ml' | 'piece';
}

@Component({
  selector: 'app-generate-recipe',
  imports: [SvgIconComponent],
  templateUrl: './generate-recipe.html',
  styleUrl: './generate-recipe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateRecipeComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private nextId = 0;

  private readonly STORAGE_KEY = 'cac_ingredients';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private suggestSubscription: Subscription | null = null;

  private readonly FALLBACK_INGREDIENTS = [
    'Butter', 'Salt', 'Pepper', 'Sugar', 'Flour', 'Egg', 'Milk', 'Cream',
    'Olive oil', 'Sunflower oil', 'Garlic', 'Onion', 'Tomato', 'Carrot',
    'Potato', 'Pasta', 'Rice', 'Bread', 'Cheese', 'Yogurt', 'Chicken',
    'Beef', 'Pork', 'Salmon', 'Tuna', 'Shrimp', 'Lemon', 'Lime', 'Orange',
    'Apple', 'Banana', 'Strawberry', 'Spinach', 'Broccoli', 'Cauliflower',
    'Zucchini', 'Eggplant', 'Bell pepper', 'Mushroom', 'Corn', 'Peas',
    'Beans', 'Lentils', 'Chickpeas', 'Basil', 'Oregano', 'Thyme', 'Rosemary',
    'Cumin', 'Paprika', 'Cinnamon', 'Ginger', 'Turmeric', 'Chili', 'Honey',
    'Soy sauce', 'Vinegar', 'Mustard', 'Ketchup', 'Mayonnaise', 'Cream cheese',
    'Parmesan', 'Mozzarella', 'Cheddar', 'Tofu', 'Coconut milk', 'Oats',
    'Almonds', 'Walnuts', 'Peanuts', 'Sesame', 'Sunflower seeds', 'Pumpkin seeds',
    'Pfeffer', 'Salz', 'Zucker', 'Mehl', 'Ei', 'Milch', 'Sahne', 'Knoblauch',
    'Zwiebel', 'Tomate', 'Kartoffel', 'Karotte', 'Hähnchen', 'Rindfleisch',
    'Lachs', 'Zitrone', 'Apfel', 'Erdbeere', 'Spinat', 'Paprika', 'Pilze',
    'Ingwer', 'Honig', 'Senf', 'Essig', 'Kokosmilch', 'Mandeln', 'Walnüsse',
  ];

  readonly units = ['gram', 'ml', 'piece'] as const;
  readonly itemBullet = '•';

  ingredientName = signal('');
  servingAmount = signal('');
  selectedUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  dropdownOpen = signal(false);
  ingredients = signal<Ingredient[]>(this.loadFromStorage());
  suggestions = signal<string[]>([]);
  suggestionsOpen = signal(false);
  editingIngredient = signal<number | null>(null);
  editingDropdownOpen = signal<number | null>(null);

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.ingredients()));
    });
  }

  private loadFromStorage(): Ingredient[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const list: Ingredient[] = raw ? JSON.parse(raw) : [];
      this.nextId = list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 0;
      return list;
    } catch {
      return [];
    }
  }

  readonly containerPaddingBottom = computed(() => {
    const base = 'clamp(16px, 2.5vw, 25px)';
    if (this.dropdownOpen()) return `calc(${base} + 108px)`;
    if (this.suggestionsOpen()) return `calc(${base} + ${this.suggestions().length * 36}px)`;
    return null;
  });

  /** Returns the short display label for a unit ('g', 'ml', 'pc'). */
  unitLabel(unit: 'gram' | 'ml' | 'piece'): string {
    if (unit === 'gram') return 'g';
    if (unit === 'piece') return 'pc';
    return 'ml';
  }

  /** Toggles the unit selection dropdown open/closed. */
  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  /** Sets the selected unit and closes the dropdown. */
  selectUnit(unit: 'gram' | 'ml' | 'piece'): void {
    this.selectedUnit.set(unit);
    this.dropdownOpen.set(false);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  /**
   * Adds a new ingredient to the list using the current input values.
   * Clears input fields and suggestions after adding.
   */
  addIngredient(): void {
    const name = this.ingredientName().trim();
    const amount = this.servingAmount().trim();
    if (!name || !amount) return;

    this.ingredients.update(list => [
      ...list,
      { id: this.nextId++, name, amount, unit: this.selectedUnit() },
    ]);

    this.ingredientName.set('');
    this.servingAmount.set('');
    this.suggestions.set([]);
    this.suggestionsOpen.set(false);
  }

  /** Removes an ingredient from the list by its ID. */
  removeIngredient(id: number): void {
    this.ingredients.update(list => list.filter(i => i.id !== id));
  }

  /** Clears all ingredients from the list and localStorage. */
  clearIngredients(): void {
    this.ingredients.set([]);
  }

  editIngredient(ingredient: Ingredient): void {
    if (this.editingIngredient() === ingredient.id) {
      // Save changes
      this.saveEditedIngredient();
    } else {
      this.editingIngredient.set(ingredient.id);
    }
  }

  private saveEditedIngredient(): void {
    // Changes are already saved live, just exit edit mode
    this.editingIngredient.set(null);
    this.editingDropdownOpen.set(null);
  }

  /**
   * Debounces the name input and fetches autocomplete suggestions
   * from the Open Food Facts API (EN + DE) for ingredient names.
   */
  onIngredientNameInput(event: Event): void {
    const filtered = this.sanitizeIngredientInput(event);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const term = filtered.trim();
    if (term.length < 2) {
      this.suggestions.set([]);
      this.suggestionsOpen.set(false);
      return;
    }
    this.debounceTimer = setTimeout(() => this.fetchSuggestions(term), 300);
  }

  /** Sanitizes the ingredient name input, allowing only letters and spaces. */
  private sanitizeIngredientInput(event: Event): string {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/[^a-zA-ZäöüÄÖÜß\s]/g, '');
    input.value = filtered;
    this.ingredientName.set(filtered);
    return filtered;
  }

  /** Shows local fallback suggestions filtered by the search term. */
  private showFallbackSuggestions(lower: string): void {
    const local = this.FALLBACK_INGREDIENTS
      .filter(r => r.toLowerCase().includes(lower))
      .slice(0, 5);
    this.suggestions.set(local);
    this.suggestionsOpen.set(local.length > 0);
    this.cdr.markForCheck();
  }

  /** Builds a single Open Food Facts suggestion request with timeout + error handling. */
  private buildSuggestRequest(url: string, params: Record<string, string>) {
    return this.http.get<string[]>(url, { params }).pipe(
      timeout(4000),
      catchError(() => EMPTY),
    );
  }

  /** Cancels any in-flight request, then merges EN+DE API results with local fallback. */
  private fetchSuggestions(term: string): void {
    this.suggestSubscription?.unsubscribe();
    const params = { term, tagtype: 'ingredients' };
    const lower = term.toLowerCase();
    let gotResults = false;
    const fallback = () => this.showFallbackSuggestions(lower);
    this.suggestSubscription = merge(
      this.buildSuggestRequest('https://world.openfoodfacts.org/cgi/suggest.pl', params),
      this.buildSuggestRequest('https://de.openfoodfacts.org/cgi/suggest.pl', params),
    ).pipe(
      scan((acc: string[], results: string[]) => {
        const cleaned = results
          .map(r => r.replace(/^[a-z]{2}:/i, '').trim())
          .filter(r => r.toLowerCase().includes(lower));
        return [...new Set([...acc, ...cleaned])].slice(0, 5);
      }, [] as string[]),
      finalize(() => { if (!gotResults) fallback(); }),
    ).subscribe({
      next: (merged) => {
        if (merged.length > 0) {
          gotResults = true;
          this.suggestions.set(merged);
          this.suggestionsOpen.set(true);
          this.cdr.markForCheck();
        }
      },
      error: () => fallback(),
    });
  }

  /** Fills the ingredient name input with the selected suggestion. */
  selectSuggestion(name: string): void {
    this.ingredientName.set(name);
    this.suggestions.set([]);
    this.suggestionsOpen.set(false);
  }

  closeSuggestions(): void {
    this.suggestionsOpen.set(false);
  }

  onServingAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    input.value = filtered;
    this.servingAmount.set(filtered);
  }

  onEditingAmountInput(event: Event, item: Ingredient): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    input.value = filtered;
    this.ingredients.update(list =>
      list.map(i => i.id === item.id ? { ...i, amount: filtered } : i)
    );
  }

  toggleEditingDropdown(item: Ingredient): void {
    this.editingDropdownOpen.set(this.editingDropdownOpen() === item.id ? null : item.id);
  }

  closeEditingDropdown(): void {
    this.editingDropdownOpen.set(null);
  }

  selectEditingUnit(item: Ingredient, unit: 'gram' | 'ml' | 'piece'): void {
    this.ingredients.update(list =>
      list.map(i => i.id === item.id ? { ...i, unit } : i)
    );
    this.editingDropdownOpen.set(null);
  }

  ngOnDestroy(): void {
    this.suggestSubscription?.unsubscribe();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  /** Navigates to the preferences page to continue recipe generation. */
  goToPreferences(): void {
    void this.router.navigate(['/preferences']);
  }
}
