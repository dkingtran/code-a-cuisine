import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { RecipeService } from '../../shared/services/recipe.service';
import { LoadingService } from '../../core/services/loading.service';
import { PreferencesService } from '../../core/services/preferences.service';

@Component({
  selector: 'app-preferences',
  imports: [SvgIconComponent],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferencesComponent {
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly loadingService = inject(LoadingService);
  private readonly preferencesService = inject(PreferencesService);

  readonly portions = signal(4);
  readonly portionsShake = signal(false);
  readonly persons = signal(1);
  readonly personsShake = signal(false);

  readonly selectedCookingTime = signal<'Quick' | 'Medium' | 'Complex' | null>(null);
  readonly selectedCuisine = signal<'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion' | null>(null);
  readonly selectedDiet = signal<'Vegetarian' | 'Vegan' | 'Keto' | 'No Preferences' | null>(null);

  decreasePortions() {
    if (this.portions() <= 1) { this.portionsShake.set(true); setTimeout(() => this.portionsShake.set(false), 400); return; }
    this.portions.update(p => p - 1);
  }

  increasePortions() {
    if (this.portions() >= 99) { this.portionsShake.set(true); setTimeout(() => this.portionsShake.set(false), 400); return; }
    this.portions.update(p => p + 1);
  }

  decreasePersons() {
    if (this.persons() <= 1) { this.triggerPersonsShake(); return; }
    this.persons.update(p => p - 1);
  }

  increasePersons() {
    if (this.persons() >= 4) { this.triggerPersonsShake(); return; }
    this.persons.update(p => p + 1);
  }

  private triggerPersonsShake(): void {
    this.personsShake.set(true);
    setTimeout(() => this.personsShake.set(false), 400);
  }

  selectCookingTime(time: 'Quick' | 'Medium' | 'Complex') {
    this.selectedCookingTime.set(time);
  }

  selectCuisine(cuisine: 'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion') {
    this.selectedCuisine.set(cuisine);
  }

  selectDiet(diet: 'Vegetarian' | 'Vegan' | 'Keto' | 'No Preferences') {
    this.selectedDiet.set(diet);
  }

  generateRecipe(): void {
    this.loadingService.show();
    this.preferencesService.setPersons(this.persons());
    const preferences = {
      portions: this.portions(),
      persons: this.persons(),
      cookingTime: this.selectedCookingTime(),
      cuisine: this.selectedCuisine(),
      diet: this.selectedDiet(),
    };
    this.recipeService.generateRecipe(preferences).subscribe({
      next: () => {
        this.loadingService.hide();
        void this.router.navigate(['/results']);
      },
      error: () => {
        this.loadingService.hide();
      },
    });
  }
}
