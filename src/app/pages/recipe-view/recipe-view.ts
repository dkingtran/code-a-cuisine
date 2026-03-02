import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService } from '../../shared/services/recipe.service';
import { Recipe } from '../../shared/models/recipe.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { PreferencesService, CHEF_CONFIG, ALL_CHEFS } from '../../core/services/preferences.service';

@Component({
  selector: 'app-recipe-view',
  imports: [RouterLink, SvgIconComponent],
  templateUrl: './recipe-view.html',
  styleUrl: './recipe-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecipeViewComponent {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  readonly preferencesService = inject(PreferencesService);

  readonly chefConfig = CHEF_CONFIG;
  readonly allChefs = ALL_CHEFS;

  recipe = signal<Recipe | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // TODO: Load from service
      this.recipe.set({
        id,
        number: 1,
        title: 'Sample Recipe',
        description: 'Description',
        ingredients: ['Ing1', 'Ing2'],
        instructions: ['Step1', 'Step2'],
        cuisine: 'italian',
        time: 20,
        tags: ['Vegetarian', 'Quick'],
        likes: 42,
        nutrition: { calories: 630, protein: 28, fat: 18, carbs: 74 },
      });
    }
  }
}
