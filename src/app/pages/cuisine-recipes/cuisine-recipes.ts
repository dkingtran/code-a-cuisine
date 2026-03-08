import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { RecipeService } from '../../shared/services/recipe.service';
import { Recipe } from '../../shared/models/recipe.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';

@Component({
  selector: 'app-cuisine-recipes',
  imports: [SvgIconComponent],
  templateUrl: 'cuisine-recipes.html',
  styleUrl: 'cuisine-recipes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CuisineRecipesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);

  cuisineType = signal<string>('');
  recipes = signal<Recipe[]>([]);
  currentPage = signal(1);
  totalPages = signal(8);
  pages = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  cuisineName = computed(() => {
    const type = this.cuisineType();
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Cuisine';
  });

  desktopBannerUrl = computed(() => `/assets/img/recipes/banner-${this.cuisineType()}.png`);
  mobileBannerUrl = computed(() => `/assets/img/recipes/mobile/mobile-${this.cuisineType()}.png`);

  ngOnInit() {
    const type = this.route.snapshot.paramMap.get('type');
    if (type) {
      this.cuisineType.set(type);
      // TODO: Load from service with pagination
      this.recipes.set([
        { id: '1', number: 1, title: 'Recipe 1', description: 'Desc', ingredients: [], directions: [], cuisine: type, time: 15, tags: ['Vegetarian', 'Quick'], likes: 42 },
        { id: '2', number: 2, title: 'Recipe 2', description: 'Desc', ingredients: [], directions: [], cuisine: type, time: 25, tags: ['Spicy'], likes: 17 }
      ]);
    }
  }

  navigateToRecipe(id: string) {
    this.router.navigate(['/recipe', id]);
  }

  goToGenerate() {
    this.router.navigate(['/generate']);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    // TODO: Load recipes for the page
  }
}
