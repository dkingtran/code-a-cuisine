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

  private readonly LIKED_KEY = 'cac_liked_recipes';
  private unsubscribeLikes: (() => void) | null = null;

  recipe = signal<Recipe | null>(null);
  likes = signal<number>(0);
  ingredientsCollapsed = signal(false);
  directionsCollapsed = signal(false);
  liked = signal(false);

  /**
   * Toggles the like state for the current recipe.
   * Performs an optimistic UI update and persists the change to Firestore.
   * Reverts on failure.
   */
  toggleLike(): void {
    const r = this.recipe();
    if (!r?.id) return;
    const newLiked = !this.liked();
    this.liked.set(newLiked);
    const delta = newLiked ? 1 : -1;
    // Optimistic update
    this.likes.update(v => v + delta);
    // Persist liked state in localStorage
    const stored = this.getLikedSet();
    newLiked ? stored.add(r.id) : stored.delete(r.id);
    localStorage.setItem(this.LIKED_KEY, JSON.stringify([...stored]));
    // Write to Firestore
    this.firebaseService.incrementLike(r.id, delta).catch(() => {
      // Revert optimistic update on failure
      this.liked.set(!newLiked);
      this.likes.update(v => v - delta);
      this.cdr.markForCheck();
    });
  }

  /** Returns the set of recipe IDs the user has liked, read from localStorage. */
  private getLikedSet(): Set<string> {
    try {
      const raw = localStorage.getItem(this.LIKED_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
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
    const n = this.preferencesService.persons();
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
   * Loads a mock recipe for direct URL access (fallback until real API is available).
   * TODO: Replace with recipeService.getRecipeById(id) once n8n delivers persisted recipes.
   */
  private loadMockRecipe(id: string): void {
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
    this.initLikes(this.recipe()!);
  }

  /**
   * Initialises the likes signal from the recipe data and attaches
   * a real-time Firestore listener so the count updates across devices.
   */
  private initLikes(recipe: Recipe): void {
    this.likes.set(recipe.likes ?? 0);
    this.liked.set(this.getLikedSet().has(recipe.id));
    // Real-time listener – updates whenever anyone likes from any device
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
