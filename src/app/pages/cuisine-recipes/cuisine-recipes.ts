import { Component, ChangeDetectionStrategy, signal, inject, computed, ChangeDetectorRef, OnDestroy } from '@angular/core';
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
export class CuisineRecipesComponent implements OnDestroy {
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

  // Adjust per-cuisine title vertical position (% from top of banner image).
  // 50 = centered. Lower = higher up, higher = further down.
  private readonly titleOffsets: Record<string, number> = {
    italian: 50,
    german: 45,
    japanese: 45,
    gourmet: 58,
    indian: 50,
    fusion: 46,
  };

  // Separate offsets for mobile banner (<480px).
  private readonly titleOffsetsMobile: Record<string, number> = {
    italian: 50,
    german: 48,
    japanese: 50,
    gourmet: 50,
    indian: 50,
    fusion: 50,
  };

  private readonly isMobile = signal(window.innerWidth < 480);
  private readonly onResize = () => this.isMobile.set(window.innerWidth < 480);

  readonly titleStyle = computed(() => {
    const map = this.isMobile() ? this.titleOffsetsMobile : this.titleOffsets;
    const offset = map[this.cuisineType()] ?? 50;
    return { top: `${offset}%` };
  });

  /**
   * Reads the cuisine type from the URL, then loads all matching recipes
   * from Firestore sorted by likes descending.
   */
  async ngOnInit() {
    window.addEventListener('resize', this.onResize);
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

  /**
   * Returns the recipe's tags sorted: diet tags first, then time tags, then the rest.
   * @param recipe The recipe whose tags should be sorted.
   */
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
  }

  sortedTagsFor(recipe: Recipe): string[] {
    const tags = recipe.tags ?? [];
    const diet = tags.filter(t => DIET_TAGS.has(t));
    const time = tags.filter(t => TIME_TAGS.has(t));
    const rest = tags.filter(t => !DIET_TAGS.has(t) && !TIME_TAGS.has(t));
    return [...diet, ...time, ...rest];
  }

  /**
   * Navigates to the full recipe detail view, passing the recipe via router state.
   * @param recipe The recipe to open.
   */
  navigateToRecipe(recipe: Recipe) {
    this.router.navigate(['/recipe', recipe.id], { state: { recipe } });
  }

  /** Navigates to the ingredient input page to generate a new recipe. */
  goToGenerate() {
    this.router.navigate(['/generate']);
  }

  /**
   * Navigates to the given page number and scrolls back to the top.
   * @param page Target page number (1-based).
   */
  goToPage(page: number | string) {
    const p = +page;
    if (p < 1 || p > this.totalPages()) return;
    this.currentPage.set(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
