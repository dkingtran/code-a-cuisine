import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService } from '../../shared/services/recipe.service';
import { Recipe } from '../../shared/models/recipe.model';

@Component({
  selector: 'app-recipe-view',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (recipe()) {
      <h2>{{ recipe()!.title }}</h2>
      <p>{{ recipe()!.description }}</p>
      <h3>Ingredients</h3>
      <ul>
        @for (ing of recipe()!.ingredients; track $index) {
          <li>{{ ing }}</li>
        }
      </ul>
      <h3>Instructions</h3>
      <ol>
        @for (inst of recipe()!.instructions; track $index) {
          <li>{{ inst }}</li>
        }
      </ol>
    }

    <!-- Generate new recipe button unten rechts -->
    <a routerLink="/generate" class="generate-btn">Generate New Recipe</a>
  `,
  styles: [`
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
export class RecipeViewComponent {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  recipe = signal<Recipe | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // TODO: Load from service
      this.recipe.set({ id, number: 1, title: 'Sample Recipe', description: 'Description', ingredients: ['Ing1', 'Ing2'], instructions: ['Step1', 'Step2'], cuisine: 'italian', time: 20 });
    }
  }
}
