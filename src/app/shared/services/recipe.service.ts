import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Recipe, Cuisine } from '../models/recipe.model';
import { LoggerService } from '../../core/services/logger.service';

interface StoredIngredient {
  id: number;
  name: string;
  amount: string;
  unit: 'gram' | 'ml' | 'piece';
}

const INGREDIENTS_KEY = 'cac_ingredients';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  readonly generatedRecipes = signal<Recipe[]>([]);
  readonly generatedTags = signal<string[]>([]);

  getRecipes(): Observable<Recipe[]> {
    this.logger.log('Fetching recipes');
    return this.http.get<Recipe[]>('/api/recipes');
  }

  getRecipeById(id: string): Observable<Recipe> {
    this.logger.log(`Fetching recipe with id: ${id}`);
    return this.http.get<Recipe>(`/api/recipes/${id}`);
  }

  getCuisines(): Observable<Cuisine[]> {
    this.logger.log('Fetching cuisines');
    return this.http.get<Cuisine[]>('/api/cuisines');
  }

  getRecipesByCuisine(type: string): Observable<Recipe[]> {
    this.logger.log(`Fetching recipes for cuisine: ${type}`);
    return this.http.get<Recipe[]>(`/api/cuisines/${type}/recipes`);
  }

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
    return this.http.post<Recipe[]>('/api/generate', body).pipe(
      tap(recipes => {
        this.generatedRecipes.set(recipes);
        const tags = [...new Set(recipes.flatMap(r => r.tags ?? []))];
        this.generatedTags.set(tags);
      })
    );
  }
}
