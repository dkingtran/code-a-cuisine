import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService } from '../../shared/services/recipe.service';
import { Recipe, RecipeDirection } from '../../shared/models/recipe.model';
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

  /** Groups directions into rows of `persons` columns for the grid layout. */
  readonly directionPairs = computed(() => {
    const dirs = this.recipe()?.directions ?? [];
    const n = this.preferencesService.persons();
    if (n < 2 || dirs.length === 0) return null;
    const pairs: RecipeDirection[][] = [];
    for (let i = 0; i < dirs.length; i += n) {
      pairs.push(dirs.slice(i, i + n));
    }
    return pairs;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // TODO: Load from service
      this.recipe.set({
        id,
        number: 1,
        title: 'Sample Recipe',
        description: 'Description',
        ingredients: ['80g Pasta noodles', '100g Baby spinach', '2 Garlic cloves'],
        extraIngredients: ['40g Parmesan cheese', '30ml Olive oil', '1 tsp Salt'],
        directions: [
          { title: 'Cook the Pasta', text: 'Cook your noodles in boiling, salted water until the pasta is al dente. Drain the pasta and reserve some of the pasta water.' },
          { title: 'Prepare the Sauce', text: 'While the pasta is cooking, heat olive oil in a pan over medium heat. Add the garlic and sauté until golden. Add tomatoes, oregano, salt, and pepper, and cook for 3–4 minutes.' },
          { title: 'Add the Spinach', text: 'Add the baby spinach to the pan and stir until wilted, about 1–2 minutes. Season to taste.' },
          { title: 'Combine & Serve', text: 'Toss the cooked pasta with the sauce. Add a splash of pasta water if needed. Plate and finish with freshly grated parmesan.' },
        ],
        cuisine: 'italian',
        time: 20,
        tags: ['Vegetarian', 'Quick'],
        likes: 42,
        nutrition: { calories: 630, protein: 28, fat: 18, carbs: 74 },
      });
    }
  }
}
