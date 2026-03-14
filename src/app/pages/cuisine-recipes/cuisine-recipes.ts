import { Component, ChangeDetectionStrategy, signal, inject, computed, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { FirebaseService } from '../../shared/services/firebase.service';
import { Recipe } from '../../shared/models/recipe.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';

const PAGE_SIZE = 20;
const DIET_TAGS = new Set(['Vegetarian', 'Vegan', 'Keto']);
const TIME_TAGS = new Set(['Quick', 'Medium', 'Complex']);

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
  private firebaseService = inject(FirebaseService);
  private cdr = inject(ChangeDetectorRef);

  cuisineType = signal<string>('');
  allRecipes = signal<Recipe[]>([]);
  isLoading = signal(true);
  currentPage = signal(1);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.allRecipes().length / PAGE_SIZE)));

  readonly pagedRecipes = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.allRecipes().slice(start, start + PAGE_SIZE);
  });

  readonly visiblePages = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, '...', total];
    if (current >= total - 2) return [1, '...', total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  cuisineName = computed(() => {
    const type = this.cuisineType();
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Cuisine';
  });

  desktopBannerUrl = computed(() => `/assets/img/recipes/banner-${this.cuisineType()}.png`);
  mobileBannerUrl = computed(() => `/assets/img/recipes/mobile/mobile-${this.cuisineType()}.png`);

  async ngOnInit() {
    const type = this.route.snapshot.paramMap.get('type');
    if (type) {
      this.cuisineType.set(type);
      this.isLoading.set(true);
      try {
        const recipes = await this.firebaseService.getRecipesByCuisine(type);
        this.allRecipes.set(recipes);
      } catch (err) {
        console.error('Failed to load cuisine recipes:', err);
      } finally {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    }
  }

  sortedTagsFor(recipe: Recipe): string[] {
    const tags = recipe.tags ?? [];
    const diet = tags.filter(t => DIET_TAGS.has(t));
    const time = tags.filter(t => TIME_TAGS.has(t));
    const rest = tags.filter(t => !DIET_TAGS.has(t) && !TIME_TAGS.has(t));
    return [...diet, ...time, ...rest];
  }

  navigateToRecipe(recipe: Recipe) {
    this.router.navigate(['/recipe', recipe.id], { state: { recipe } });
  }

  goToGenerate() {
    this.router.navigate(['/generate']);
  }

  goToPage(page: number | string) {
    const p = +page;
    if (p < 1 || p > this.totalPages()) return;
    this.currentPage.set(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
