import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService } from '../../shared/services/recipe.service';
import { Recipe } from '../../shared/models/recipe.model';

@Component({
  selector: 'app-cuisine-recipes',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h2>{{ cuisineType() }} Recipes</h2>
    @for (recipe of recipes(); track recipe.id) {
      <div class="recipe-card">
        <h3>{{ recipe.title }}</h3>
        <p>{{ recipe.description }}</p>
        <a [routerLink]="['/recipe', recipe.id]" class="btn">View</a>
      </div>
    }

    <!-- Paginierungsleiste, sticky am Boden -->
    <div class="pagination">
      <button [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">&lt;</button>
      @for (page of pages(); track page) {
        <button [class.active]="page === currentPage()" (click)="goToPage(page)">{{ page }}</button>
      }
      <button [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">&gt;</button>
    </div>
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
    .pagination {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 1rem;
      border-top: 1px solid #ddd;
      display: flex;
      gap: 0.5rem;
    }
    .pagination button {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
    }
    .pagination button.active {
      background: #007bff;
      color: white;
    }
    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CuisineRecipesComponent {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  cuisineType = signal<string>('');
  recipes = signal<Recipe[]>([]);
  currentPage = signal(1);
  totalPages = signal(8); // Beispiel: 8 Seiten
  pages = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  ngOnInit() {
    const type = this.route.snapshot.paramMap.get('type');
    if (type) {
      this.cuisineType.set(type);
      // TODO: Load from service with pagination
      this.recipes.set([
        { id: '1', number: 1, title: 'Recipe 1', description: 'Desc', ingredients: [], directions: [], cuisine: type, time: 15 },
        { id: '2', number: 2, title: 'Recipe 2', description: 'Desc', ingredients: [], directions: [], cuisine: type, time: 25 }
      ]);
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    // TODO: Load recipes for the page
  }
}
