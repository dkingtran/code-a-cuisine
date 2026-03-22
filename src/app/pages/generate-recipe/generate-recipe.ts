import { Component, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, EMPTY } from 'rxjs';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { RecipeService, StoredIngredient } from '../../shared/services/recipe.service';

interface Ingredient extends StoredIngredient { }

@Component({
  selector: 'app-generate-recipe',
  imports: [SvgIconComponent],
  templateUrl: './generate-recipe.html',
  styleUrl: './generate-recipe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateRecipeComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private nextId = 0;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private suggestSubscription: Subscription | null = null;
  private readonly isMobile = signal(window.innerWidth <= 500);
  private readonly onResize = () => this.isMobile.set(window.innerWidth <= 500);

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
  ];

  readonly units = ['gram', 'ml', 'piece'] as const;
  readonly itemBullet = '•';

  ingredientName = signal('');
  servingAmount = signal('');
  selectedUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  dropdownOpen = signal(false);
  readonly ingredients = this.recipeService.ingredients;
  suggestions = signal<string[]>([]);
  suggestionsOpen = signal(false);
  editingIngredient = signal<number | null>(null);
  editingDropdownOpen = signal<number | null>(null);

  readonly duplicateIngredients = computed(() => {
    const names = this.ingredients().map(i => i.name.trim().toLowerCase());
    return [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
  });

  readonly containerPaddingBottom = computed(() => {
    const base = 'clamp(16px, 2.5vw, 25px)';
    const dropdownExtra = this.dropdownOpen() ? 108 : 0;
    const suggestionsExtra = !this.isMobile() && this.suggestionsOpen() ? this.suggestions().length * 36 : 0;
    const extra = Math.max(dropdownExtra, suggestionsExtra);
    return extra > 0 ? `calc(${base} + ${extra}px)` : null;
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

  /** Closes the unit selection dropdown without changing the selected unit. */
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

  /** Removes the last duplicate ingredient with the given name from the list. */
  removeDuplicate(name: string): void {
    const list = this.ingredients();
    const lastIndex = [...list].reverse().findIndex(i => i.name.trim().toLowerCase() === name);
    const id = list[list.length - 1 - lastIndex].id;
    this.removeIngredient(id);
  }

  /** Removes the last occurrence of each duplicate ingredient from the list. */
  removeAllDuplicates(): void {
    for (const name of this.duplicateIngredients()) {
      this.removeDuplicate(name);
    }
  }

  /** Removes an ingredient from the list by its ID. */
  removeIngredient(id: number): void {
    this.ingredients.update(list => list.filter(i => i.id !== id));
  }

  /** Clears all ingredients from the list and localStorage. */
  clearIngredients(): void {
    this.ingredients.set([]);
  }

  /** Enters edit mode for the given ingredient, or saves and exits if already editing. */
  editIngredient(ingredient: Ingredient): void {
    if (this.editingIngredient() === ingredient.id) {
      this.saveEditedIngredient();
    } else {
      this.editingIngredient.set(ingredient.id);
    }
  }

  /** Exits inline edit mode — changes are already live via signal updates. */
  private saveEditedIngredient(): void {
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
    const capitalized = filtered.charAt(0).toUpperCase() + filtered.slice(1);
    input.value = capitalized;
    this.ingredientName.set(capitalized);
    return capitalized;
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

  /** Cancels any in-flight request, then fetches EN-only suggestions with local fallback. */
  private fetchSuggestions(term: string): void {
    this.suggestSubscription?.unsubscribe();
    const params = { term, tagtype: 'ingredients' };
    const lower = term.toLowerCase();
    let gotResults = false;
    const fallback = () => this.showFallbackSuggestions(lower);
    this.suggestSubscription = this.buildSuggestRequest('https://world.openfoodfacts.org/cgi/suggest.pl', params).pipe(
      finalize(() => { if (!gotResults) fallback(); }),
    ).subscribe({
      next: (results: string[]) => {
        const cleaned = results
          .map(r => r.replace(/^[a-z]{2}:/i, '').trim())
          .filter(r => r.toLowerCase().includes(lower))
          .slice(0, 5);
        if (cleaned.length > 0) {
          gotResults = true;
          this.suggestions.set(cleaned);
          this.suggestionsOpen.set(true);
          this.cdr.markForCheck();
        }
      },
      error: () => fallback(),
    });
  }

  /** Fills the ingredient name input with the selected suggestion. */
  selectSuggestion(name: string): void {
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    this.ingredientName.set(capitalized);
    this.suggestions.set([]);
    this.suggestionsOpen.set(false);
  }

  /** Hides the autocomplete suggestions dropdown. */
  closeSuggestions(): void {
    this.suggestionsOpen.set(false);
  }

  /** Restricts serving-amount input to digits only (max 4 characters). */
  onServingAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    input.value = filtered;
    this.servingAmount.set(filtered);
  }

  /** Restricts the inline amount field to digits only and updates the ingredient signal. */
  onEditingAmountInput(event: Event, item: Ingredient): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    input.value = filtered;
    this.ingredients.update(list =>
      list.map(i => i.id === item.id ? { ...i, amount: filtered } : i)
    );
  }

  /** Toggles the inline unit dropdown for the given ingredient row. */
  toggleEditingDropdown(item: Ingredient): void {
    this.editingDropdownOpen.set(this.editingDropdownOpen() === item.id ? null : item.id);
  }

  /** Closes the inline unit dropdown without changing the selected unit. */
  closeEditingDropdown(): void {
    this.editingDropdownOpen.set(null);
  }

  /** Updates the unit for an ingredient row and closes its dropdown. */
  selectEditingUnit(item: Ingredient, unit: 'gram' | 'ml' | 'piece'): void {
    this.ingredients.update(list =>
      list.map(i => i.id === item.id ? { ...i, unit } : i)
    );
    this.editingDropdownOpen.set(null);
  }

  ngOnInit(): void {
    window.addEventListener('resize', this.onResize);
  }

  /** Cancels any running suggestion subscription and clears the debounce timer on destroy. */
  ngOnDestroy(): void {
    this.suggestSubscription?.unsubscribe();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    window.removeEventListener('resize', this.onResize);
  }

  /** Navigates to the preferences page to continue recipe generation. */
  goToPreferences(): void {
    void this.router.navigate(['/preferences']);
  }
}
