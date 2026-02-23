import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../shared/models/recipe.model';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h2>Results</h2>
    @for (recipe of recipes(); track recipe.id) {
      <div class="recipe-card">
        <h3>{{ recipe.title }}</h3>
        <p>{{ recipe.description }}</p>
        <a [routerLink]="['/recipe', recipe.id]" class="btn">View</a>
      </div>
    }

    <!-- Generate new recipe button unten rechts -->
    <a routerLink="/generate" class="generate-btn">Generate New Recipe</a>
  `,
  styles: [`
    .recipe-card {
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
export class ResultsComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.setBackground('#396039');
    this.themeService.setLogoVariant('beige');
  }

  ngOnDestroy(): void {
    this.themeService.clearBackground();
    this.themeService.setLogoVariant('green');
  }

  recipes = signal<Recipe[]>([
    { id: '1', title: 'Spaghetti Carbonara', description: 'Classic Italian pasta', ingredients: [], instructions: [], cuisine: 'italian' },
    { id: '2', title: 'Schnitzel', description: 'German breaded cutlet', ingredients: [], instructions: [], cuisine: 'german' }
  ]);
}
