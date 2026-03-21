import { Component, ChangeDetectionStrategy, inject, signal, computed, ElementRef, viewChild, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { Cuisine, Recipe } from '../../shared/models/recipe.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { RecipeCardComponent } from '../../shared/components/recipe-card/recipe-card';
import { FirebaseService } from '../../shared/services/firebase.service';

@Component({
  selector: 'app-cookbook',
  imports: [SvgIconComponent, RecipeCardComponent, NgOptimizedImage],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookbookComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);

  readonly allRecipesCollapsed = signal(false);
  toggleAllRecipes(): void { this.allRecipesCollapsed.update(v => !v); }

  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('recipeScroll');
  readonly allRecipesGrid = viewChild<ElementRef<HTMLDivElement>>('allRecipesGrid');

  private activeScroll: HTMLDivElement | null = null;
  private isDragging = false;
  private hasDragged = false;
  private dragStartX = 0;
  private scrollStartLeft = 0;
  private readonly DRAG_THRESHOLD = 5;

  /**
   * Initiates a drag-scroll session on the recipe carousel.
   * @param event The mousedown event.
   * @param container Optional explicit container element to scroll.
   */
  onMouseDown(event: MouseEvent, container?: ElementRef<HTMLDivElement> | HTMLDivElement): void {
    const el = container instanceof HTMLDivElement
      ? container
      : container?.nativeElement ?? this.scrollContainer()?.nativeElement;
    if (!el) return;
    this.activeScroll = el;
    this.isDragging = true;
    this.hasDragged = false;
    this.dragStartX = event.pageX - el.offsetLeft;
    this.scrollStartLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
  }

  /**
   * Handles drag-scroll movement while the mouse button is held.
   * @param event The mousemove event.
   */
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.activeScroll) return;
    const el = this.activeScroll;
    const x = event.pageX - el.offsetLeft;
    const delta = x - this.dragStartX;
    if (Math.abs(delta) > this.DRAG_THRESHOLD) {
      this.hasDragged = true;
    }
    el.scrollLeft = this.scrollStartLeft - delta;
  }

  /** Ends the drag-scroll session and resets cursor. */
  onMouseUp(): void {
    this.isDragging = false;
    if (this.activeScroll) {
      this.activeScroll.style.cursor = 'pointer';
      this.activeScroll = null;
    }
  }

  /**
   * Prevents a click event from firing after a drag gesture.
   * @param event The click event to suppress if drag occurred.
   */
  onScrollClick(event: MouseEvent): void {
    if (this.hasDragged) {
      event.stopPropagation();
      this.hasDragged = false;
    }
  }

  /**
   * Navigates to the recipe detail view. Ignores the click if it was
   * the end of a drag gesture.
   * @param recipe The recipe to open.
   */
  navigateToRecipe(recipe: Recipe): void {
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }
    void this.router.navigate(['/recipe', recipe.id], { state: { recipe } });
  }

  /** Loads all recipes from Firestore on component initialisation. */
  ngOnInit(): void {
    this.firebaseService.getRecipes().then(recipes => {
      this.recipes.set(recipes);
      this.loading.set(false);
    }).catch(() => {
      this.loadError.set(true);
      this.loading.set(false);
    });
  }

  cuisines = signal<Cuisine[]>([
    { type: 'italian', name: 'Italian Cuisine', imageUrl: 'assets/img/cookbook/italian.png', iconUrl: 'assets/img/cookbook/icon/italian.png' },
    { type: 'german', name: 'German Cuisine', imageUrl: 'assets/img/cookbook/german.png', iconUrl: 'assets/img/cookbook/icon/german.png' },
    { type: 'japanese', name: 'Japanese Cuisine', imageUrl: 'assets/img/cookbook/japanese.png', iconUrl: 'assets/img/cookbook/icon/japanese.png' },
    { type: 'gourmet', name: 'Gourmet Cuisine', imageUrl: 'assets/img/cookbook/gourmet.png', iconUrl: 'assets/img/cookbook/icon/gourmet.png' },
    { type: 'indian', name: 'Indian Cuisine', imageUrl: 'assets/img/cookbook/indian.png', iconUrl: 'assets/img/cookbook/icon/indian.png' },
    { type: 'fusion', name: 'Fusion Cuisine', imageUrl: 'assets/img/cookbook/fusion.png', iconUrl: 'assets/img/cookbook/icon/fusion.png' },
  ]);

  recipes = signal<Recipe[]>([]);

  /** Active cuisine filter value, or null for no filter. */
  readonly selectedCuisineFilter = signal<string | null>(null);

  /** Active diet filter value, or null for no filter. */
  readonly selectedDietFilter = signal<string | null>(null);

  /** Active time filter value, or null for no filter. */
  readonly selectedTimeFilter = signal<'quick' | 'medium' | 'complex' | null>(null);

  /** Whether the filtered recipes are sorted by likes descending. */
  readonly sortByLikes = signal(false);

  /** Recipes filtered by the currently active cuisine, diet and time filters. */
  readonly filteredRecipes = computed(() => {
    let result = this.recipes();
    const cuisine = this.selectedCuisineFilter();
    if (cuisine) result = result.filter(r => r.cuisine?.toLowerCase() === cuisine);
    const diet = this.selectedDietFilter();
    if (diet) result = result.filter(r => r.tags?.some(t => t.toLowerCase() === diet.toLowerCase()));
    const time = this.selectedTimeFilter();
    if (time === 'quick') result = result.filter(r => r.time <= 20);
    else if (time === 'medium') result = result.filter(r => r.time > 20 && r.time <= 45);
    else if (time === 'complex') result = result.filter(r => r.time > 45);
    if (this.sortByLikes()) result = [...result].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    return result;
  });

  /** Toggles the most-liked sort — deselects if already active. */
  toggleSortByLikes(): void {
    this.sortByLikes.update(v => !v);
  }

  /** Toggles the cuisine filter — deselects if already active. */
  setCuisineFilter(value: string): void {
    this.selectedCuisineFilter.set(this.selectedCuisineFilter() === value ? null : value);
  }

  /** Toggles the diet filter — deselects if already active. */
  setDietFilter(value: string): void {
    this.selectedDietFilter.set(this.selectedDietFilter() === value ? null : value);
  }

  /** Toggles the time filter — deselects if already active. */
  setTimeFilter(value: 'quick' | 'medium' | 'complex'): void {
    this.selectedTimeFilter.set(this.selectedTimeFilter() === value ? null : value);
  }

  /**
   * Navigates to the cuisine-specific recipe list.
   * @param type The cuisine type key (e.g. 'italian').
   */
  openCuisine(type: string): void {
    void this.router.navigate(['/cuisine', type]);
  }

  /**
   * Alias for openCuisine — navigates to the cuisine recipe list.
   * @param type The cuisine type key.
   */
  goToCuisine(type: string): void {
    void this.router.navigate(['/cuisine', type]);
  }

  /** Navigates to the ingredient input page to generate a new recipe. */
  goToGenerate(): void {
    void this.router.navigate(['/generate']);
  }
}
