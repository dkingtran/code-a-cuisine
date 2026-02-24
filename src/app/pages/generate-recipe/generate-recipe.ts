import { Component, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Ingredient {
  id: number;
  name: string;
  amount: string;
  unit: 'gram' | 'ml' | 'piece';
}

@Component({
  selector: 'app-generate-recipe',
  imports: [],
  templateUrl: './generate-recipe.html',
  styleUrl: './generate-recipe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateRecipeComponent {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly units = ['gram', 'ml', 'piece'] as const;

  ingredientName = signal('');
  servingAmount = signal('');
  selectedUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  dropdownOpen = signal(false);
  ingredients = signal<Ingredient[]>([]);
  suggestions = signal<string[]>([]);
  suggestionsOpen = signal(false);
  hasIngredientName = computed(() => this.ingredientName().trim().length > 0);

  private nextId = 0;

  unitLabel(unit: 'gram' | 'ml' | 'piece'): string {
    if (unit === 'gram') return 'g';
    if (unit === 'piece') return 'pc';
    return 'ml';
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  selectUnit(unit: 'gram' | 'ml' | 'piece'): void {
    this.selectedUnit.set(unit);
    this.dropdownOpen.set(false);
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

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

  removeIngredient(id: number): void {
    this.ingredients.update(list => list.filter(i => i.id !== id));
  }

  editIngredient(ingredient: Ingredient): void {
    this.ingredientName.set(ingredient.name);
    this.servingAmount.set(ingredient.amount);
    this.selectedUnit.set(ingredient.unit);
    this.removeIngredient(ingredient.id);
  }

  onIngredientNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/[^a-zA-ZäöüÄÖÜß\s]/g, '');
    input.value = filtered;
    this.ingredientName.set(filtered);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    const term = filtered.trim();
    if (term.length < 2) {
      this.suggestions.set([]);
      this.suggestionsOpen.set(false);
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.http
        .get<string[]>(`https://world.openfoodfacts.org/cgi/suggest.pl`, {
          params: { term, tagtype: 'ingredients' },
        })
        .subscribe({
          next: (results) => {
            this.suggestions.set(results.slice(0, 3));
            this.suggestionsOpen.set(results.length > 0);
            this.cdr.markForCheck();
          },
          error: () => {
            this.suggestions.set([]);
            this.suggestionsOpen.set(false);
          },
        });
    }, 300);
  }

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
}
