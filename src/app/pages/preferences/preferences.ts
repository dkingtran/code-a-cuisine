import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [RouterLink, SvgIconComponent],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferencesComponent {
  readonly portions = signal(4);
  readonly persons = signal(1);

  readonly selectedCookingTime = signal<'Quick' | 'Medium' | 'Complex' | null>(null);
  readonly selectedCuisine = signal<'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion' | null>(null);
  readonly selectedDiet = signal<'Vegetarian' | 'Vegan' | 'Keto' | 'No Preferences' | null>(null);

  decreasePortions() {
    this.portions.update(p => Math.max(1, p - 1));
  }

  increasePortions() {
    this.portions.update(p => p + 1);
  }

  decreasePersons() {
    this.persons.update(p => Math.max(1, p - 1));
  }

  increasePersons() {
    this.persons.update(p => p + 1);
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
}
