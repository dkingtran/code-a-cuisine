import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Recipe, Cuisine } from '../models/recipe.model';
import { LoggerService } from '../../core/services/logger.service';
import { FirebaseService } from './firebase.service';

interface StoredIngredient {
  id: number;
  name: string;
  amount: string;
  unit: 'gram' | 'ml' | 'piece';
}

const INGREDIENTS_KEY = 'cac_ingredients';

/**
 * Service responsible for fetching and generating recipes.
 * Communicates with the n8n webhook for AI generation and persists results in Firestore.
 */
@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private firebase = inject(FirebaseService);

  /** Signal holding the most recently generated recipes. */
  readonly generatedRecipes = signal<Recipe[]>([]);

  /** Signal holding the unique tags from the most recently generated recipes. */
  readonly generatedTags = signal<string[]>([]);

  /** Fetches all recipes from the API. */
  getRecipes(): Observable<Recipe[]> {
    this.logger.log('Fetching recipes');
    return this.http.get<Recipe[]>('/api/recipes');
  }

  /** Fetches a single recipe by its ID. */
  getRecipeById(id: string): Observable<Recipe> {
    this.logger.log(`Fetching recipe with id: ${id}`);
    return this.http.get<Recipe>(`/api/recipes/${id}`);
  }

  /** Fetches all available cuisine categories. */
  getCuisines(): Observable<Cuisine[]> {
    this.logger.log('Fetching cuisines');
    return this.http.get<Cuisine[]>('/api/cuisines');
  }

  /** Fetches all recipes for a given cuisine type. */
  getRecipesByCuisine(type: string): Observable<Recipe[]> {
    this.logger.log(`Fetching recipes for cuisine: ${type}`);
    return this.http.get<Recipe[]>(`/api/cuisines/${type}/recipes`);
  }

  /**
   * Sends user preferences and stored ingredients to the n8n AI workflow
   * to generate 3 recipes. Saves results to Firestore and updates signals.
   * Throws `QUOTA_EXCEEDED:ip` or `QUOTA_EXCEEDED:global` if quota is exceeded.
   */
  generateRecipe(preferences: {
    portions: number;
    persons: number;
    cookingTime: string | null;
    cuisine: string | null;
    diet: string | null;
  }): Observable<Recipe[]> {
    this.logger.log('Generating recipe with preferences');
    const raw = localStorage.getItem(INGREDIENTS_KEY);
    const ingredients: StoredIngredient[] = raw ? JSON.parse(raw) : [];
    const body = { ...preferences, ingredients };
    return this.http.post('/api/generate', body, { responseType: 'text' }).pipe(
      map(response => parseRecipeResponse(response)),
      tap(recipes => {
        this.generatedRecipes.set(recipes);
        const tags = [...new Set(recipes.flatMap(r => r.tags ?? []))];
        this.generatedTags.set(tags);
        localStorage.removeItem(INGREDIENTS_KEY);
        this.firebase.saveRecipes(recipes).catch(err =>
          this.logger.log(`Failed to save recipes to Firestore: ${err}`)
        );
      })
    );
  }
}

function parseRecipeResponse(raw: string): Recipe[] {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse recipe response: ${cleaned.slice(0, 200)}`);
  }

  // Quota exceeded error returned by n8n
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'quotaExceeded' in parsed) {
    const type = (parsed as { type?: string }).type ?? 'global';
    throw new Error(`QUOTA_EXCEEDED:${type}`);
  }

  // Direct array
  if (Array.isArray(parsed)) return parsed as Recipe[];

  // { recipes: [...] }
  if (parsed && typeof parsed === 'object' && 'recipes' in parsed && Array.isArray((parsed as Record<string, unknown>)['recipes'])) {
    return (parsed as { recipes: Recipe[] }).recipes;
  }

  // { output: "[...]" } — n8n AI Agent wraps text in output field
  if (parsed && typeof parsed === 'object' && 'output' in parsed) {
    const inner = (parsed as Record<string, unknown>)['output'];
    if (Array.isArray(inner)) return inner as Recipe[];
    if (typeof inner === 'string') return parseRecipeResponse(inner);
  }

  throw new Error('Unexpected response shape from n8n');
}
