import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cuisine } from '../../shared/models/recipe.model';

@Component({
  selector: 'app-cookbook',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h2>Cookbook</h2>
    @for (cuisine of cuisines(); track cuisine.type) {
      <div class="cuisine-card">
        <img [src]="cuisine.imageUrl" alt="{{ cuisine.name }}">
        <h3>{{ cuisine.name }}</h3>
        <a [routerLink]="['/cuisine', cuisine.type]" class="btn">View Recipes</a>
      </div>
    }

    <!-- Generate new recipe button unten rechts -->
    <a routerLink="/generate" class="generate-btn">Generate New Recipe</a>
  `,
  styles: [`
    .cuisine-card {
      border: 1px solid #ddd;
      padding: 1rem;
      margin: 1rem 0;
    }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
    }
    .generate-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 1rem 2rem;
      background: #28a745;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookbookComponent {
  cuisines = signal<Cuisine[]>([
    { type: 'italian', name: 'Italian Cuisine', imageUrl: 'https://example.com/italian.jpg' },
    { type: 'german', name: 'German Cuisine', imageUrl: 'https://example.com/german.jpg' }
  ]);
}
