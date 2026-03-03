import { Component, ChangeDetectionStrategy, signal, computed, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
export class RecipeViewComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  readonly preferencesService = inject(PreferencesService);

  readonly chefConfig = CHEF_CONFIG;
  readonly allChefs = ALL_CHEFS;

  recipe = signal<Recipe | null>(null);
  ingredientsCollapsed = signal(false);
  directionsCollapsed = signal(false);
  liked = signal(false);

  toggleLike(): void { this.liked.update(v => !v); }

  private readonly onResize = () => {
    if (window.innerWidth > 600) {
      this.ingredientsCollapsed.set(false);
      this.directionsCollapsed.set(false);
    }
  };

  toggleIngredients(): void { this.ingredientsCollapsed.update(v => !v); }
  toggleDirections(): void { this.directionsCollapsed.update(v => !v); }
  goToGenerate(): void { void this.router.navigate(['/generate']); }

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
    window.addEventListener('resize', this.onResize);
    const id = this.route.snapshot.paramMap.get('id');
    const state = history.state as { recipe?: Recipe };
    if (state?.recipe) {
      this.recipe.set(state.recipe);
      return;
    }
    if (id) {
      // TODO: MOCK DATA – delete once n8n delivers real recipes (replace with recipeService.getRecipeById(id))
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

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
