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
  totalPages = signal(12);

  visiblePages = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  });

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

  goToPage(page: number | string) {
    this.currentPage.set(+page);
    // TODO: Load recipes for the page
  }
}
