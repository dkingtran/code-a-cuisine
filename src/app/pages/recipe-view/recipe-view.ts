import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipeService } from '../../shared/services/recipe.service';
import { FirebaseService } from '../../shared/services/firebase.service';
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
export class RecipeViewComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private firebaseService = inject(FirebaseService);
  private cdr = inject(ChangeDetectorRef);
  readonly preferencesService = inject(PreferencesService);

  readonly chefConfig = CHEF_CONFIG;
  readonly allChefs = ALL_CHEFS;

  private isLiking = false;
  private unsubscribeLikes: (() => void) | null = null;

  recipe = signal<Recipe | null>(null);
  likes = signal<number>(0);
  ingredientsCollapsed = signal(false);
  directionsCollapsed = signal(false);
  liked = signal(false);

  /** Reverts an optimistic like toggle on error. */
  private revertLike(newLiked: boolean, delta: number): void {
    this.liked.set(!newLiked);
    this.likes.update(v => v - delta);
    this.cdr.markForCheck();
  }

  /**
   * Toggles the like state for the current recipe.
   * Performs an optimistic UI update, persists the change to Firestore
   * via an anonymous voter UUID, and reverts on failure.
   */
  toggleLike(): void {
    if (this.isLiking) return;
    const r = this.recipe();
    if (!r?.id) return;
    this.isLiking = true;
    const newLiked = !this.liked();
    const delta = newLiked ? 1 : -1;
    this.liked.set(newLiked);
    this.likes.update(v => v + delta);
    this.firebaseService.toggleLike(r.id)
      .catch(() => this.revertLike(newLiked, delta))
      .finally(() => { this.isLiking = false; });
  }

  private readonly onResize = () => {
    if (window.innerWidth > 600) {
      this.ingredientsCollapsed.set(false);
      this.directionsCollapsed.set(false);
    }
  };

  /** Collapses or expands the ingredients section. */
  toggleIngredients(): void { this.ingredientsCollapsed.update(v => !v); }
  /** Collapses or expands the directions section. */
  toggleDirections(): void { this.directionsCollapsed.update(v => !v); }
  /** Navigates back to the ingredient input page. */
  goToGenerate(): void { void this.router.navigate(['/generate']); }

  /** Groups directions into rows of `persons` columns for the grid layout. */
  readonly directionPairs = computed(() => {
    const dirs = this.recipe()?.directions ?? [];
    const n = this.preferencesService.generationPersons();
    if (n < 2 || dirs.length === 0) return null;
    const pairs: RecipeDirection[][] = [];
    for (let i = 0; i < dirs.length; i += n) {
      pairs.push(dirs.slice(i, i + n));
    }
    return pairs;
  });

  /**
   * Loads the recipe from router state or falls back to mock data when
   * navigated to directly via URL. Starts the real-time likes listener.
   */
  ngOnInit() {
    window.addEventListener('resize', this.onResize);
    const state = history.state as { recipe?: Recipe };
    if (state?.recipe) {
      this.recipe.set(state.recipe);
      this.initLikes(state.recipe);
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadMockRecipe(id);
  }

  /**
   * Loads a recipe from Firestore by ID when navigated to directly via URL.
   * Redirects to the cookbook if the recipe is not found.
   */
  private loadMockRecipe(id: string): void {
    this.firebaseService.getRecipeById(id).then(recipe => {
      if (recipe) {
        this.recipe.set(recipe);
        this.initLikes(recipe);
      } else {
        void this.router.navigate(['/cookbook']);
      }
      this.cdr.markForCheck();
    }).catch(() => void this.router.navigate(['/cookbook']));
  }

  /**
   * Initialises the likes signal from the recipe data and attaches
   * a real-time Firestore listener so the count updates across devices.
   * Restores the liked state from the Firestore votes collection.
   */
  private initLikes(recipe: Recipe): void {
    this.likes.set(recipe.likes ?? 0);
    this.firebaseService.hasLiked(recipe.id).then(liked => {
      this.liked.set(liked);
      this.cdr.markForCheck();
    });
    this.unsubscribeLikes = this.firebaseService.listenToLikes(recipe.id, count => {
      this.likes.set(count);
      this.cdr.markForCheck();
    });
  }

  /** Cleans up the resize listener and the Firestore likes subscription. */
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.unsubscribeLikes?.();
  }
}
