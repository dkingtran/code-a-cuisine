import { Component, signal, computed, effect, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
export class GenerateRecipeComponent {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private nextId = 0;

  private readonly STORAGE_KEY = 'cac_ingredients';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

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
      const params = { term, tagtype: 'ingredients' };
      forkJoin([
        this.http.get<string[]>('https://world.openfoodfacts.org/cgi/suggest.pl', { params }),
        this.http.get<string[]>('https://de.openfoodfacts.org/cgi/suggest.pl', { params }),
      ]).subscribe({
        next: ([en, de]) => {
          const lower = term.toLowerCase();
          const merged = [...new Set([...en, ...de])]
            .filter(r => r.toLowerCase().startsWith(lower));
          this.suggestions.set(merged.slice(0, 5));
          this.suggestionsOpen.set(merged.length > 0);
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

  goToPreferences(): void {
    void this.router.navigate(['/preferences']);
  }
}
