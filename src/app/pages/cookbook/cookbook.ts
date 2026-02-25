import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Cuisine } from '../../shared/models/recipe.model';

@Component({
  selector: 'app-cookbook',
  standalone: true,
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookbookComponent {
  private readonly router = inject(Router);

  cuisines = signal<Cuisine[]>([
    { type: 'italian', name: 'Italian Cuisine', imageUrl: 'https://example.com/italian.jpg' },
    { type: 'german', name: 'German Cuisine', imageUrl: 'https://example.com/german.jpg' }
  ]);

  openCuisine(type: string): void {
    void this.router.navigate(['/cuisine', type]);
  }

  goToGenerate(): void {
    void this.router.navigate(['/generate']);
  }
}
