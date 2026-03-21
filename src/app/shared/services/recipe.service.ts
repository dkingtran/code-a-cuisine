import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, switchMap } from 'rxjs';
import { Recipe, Cuisine } from '../models/recipe.model';
import { LoggerService } from '../../core/services/logger.service';
import { FirebaseService } from './firebase.service';
import { environment } from '../../../environments/environment';

export interface StoredIngredient {
  id: number;
  name: string;
  amount: string;
  unit: 'gram' | 'ml' | 'piece';
}

const SESSION_RECIPES_KEY = 'cac_session_recipes';
const SESSION_PREF_TAGS_KEY = 'cac_session_pref_tags';

/** Reads a typed value from sessionStorage, returns null on any error. */
function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

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

  /** Signal holding the ingredients entered by the user on the generate page. */
  readonly ingredients = signal<StoredIngredient[]>([]);

  /** Signal holding the most recently generated recipes. Restored from sessionStorage on reload. */
  readonly generatedRecipes = signal<Recipe[]>(readSession<Recipe[]>(SESSION_RECIPES_KEY) ?? []);

  /** Signal holding the unique tags from the most recently generated recipes. */
  readonly generatedTags = signal<string[]>([]);

  /** Signal holding the user's selected preference tags. Restored from sessionStorage on reload. */
  readonly generatedPreferenceTags = signal<string[]>(readSession<string[]>(SESSION_PREF_TAGS_KEY) ?? []);

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
    const ingredientsList = formatIngredients(this.ingredients());
    const body = { ...preferences, ingredients: ingredientsList };
    return this.http.post(environment.n8nWebhookUrl, body, { responseType: 'text' }).pipe(
      map(response => parseRecipeResponse(response)),
      switchMap(recipes => {
        const tags = [...new Set(recipes.flatMap(r => r.tags ?? []))];
        this.generatedTags.set(tags);
        const prefTags = [preferences.cookingTime, preferences.cuisine, preferences.diet]
          .filter((v): v is string => !!v);
        this.generatedPreferenceTags.set(prefTags);
        sessionStorage.setItem(SESSION_PREF_TAGS_KEY, JSON.stringify(prefTags));
        this.ingredients.set([]);
        const recipesWithPersons = recipes.map(r => ({ ...r, persons: preferences.persons }));
        const save$ = this.firebase.saveRecipes(recipesWithPersons).catch(err => {
          this.logger.log(`Failed to save recipes to Firestore: ${err}`);
          return recipes;
        });
        return from(save$);
      }),
      map(savedRecipes => {
        this.generatedRecipes.set(savedRecipes);
        sessionStorage.setItem(SESSION_RECIPES_KEY, JSON.stringify(savedRecipes));
        return savedRecipes;
      })
    );
  }
}


/** Formats stored ingredients into a human-readable string for the AI prompt. */
function formatIngredients(ingredients: StoredIngredient[]): string {
  return ingredients.map(i => {
    const unit = i.unit === 'gram' ? 'g' : i.unit === 'piece' ? 'pc' : 'ml';
    return `${i.amount}${unit} ${i.name}`;
  }).join(', ');
}

/** Strips markdown code fences from a raw string. */
function stripMarkdownFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

/** Extracts a Recipe array from a parsed JSON object of unknown shape. */
function extractRecipesFromObject(parsed: unknown): Recipe[] {
  if (Array.isArray(parsed)) return parsed as Recipe[];
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'quotaExceeded' in parsed) {
    const type = (parsed as { type?: string }).type ?? 'global';
    throw new Error(`QUOTA_EXCEEDED:${type}`);
  }
  if (parsed && typeof parsed === 'object' && 'recipes' in parsed && Array.isArray((parsed as Record<string, unknown>)['recipes'])) {
    return (parsed as { recipes: Recipe[] }).recipes;
  }
  if (parsed && typeof parsed === 'object' && 'output' in parsed) {
    const inner = (parsed as Record<string, unknown>)['output'];
    if (Array.isArray(inner)) return inner as Recipe[];
    if (typeof inner === 'string') return parseRecipeResponse(inner);
  }
  throw new Error('Unexpected response shape from n8n');
}

function parseRecipeResponse(raw: string): Recipe[] {
  const cleaned = stripMarkdownFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse recipe response: ${cleaned.slice(0, 200)}`);
  }
  return extractRecipesFromObject(parsed);
}
