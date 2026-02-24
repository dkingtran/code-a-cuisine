import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

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
  readonly units = ['gram', 'ml', 'piece'] as const;

  ingredientName = signal('');
  servingAmount = signal('');
  selectedUnit = signal<'gram' | 'ml' | 'piece'>('gram');
  dropdownOpen = signal(false);
  ingredients = signal<Ingredient[]>([]);
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
}
