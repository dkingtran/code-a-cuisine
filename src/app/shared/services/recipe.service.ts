import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe, Cuisine } from '../models/recipe.model';
import { LoggerService } from '../../core/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);

  // Mock data for now, replace with actual n8n API calls
  getRecipes(): Observable<Recipe[]> {
    this.logger.log('Fetching recipes');
    // TODO: Integrate with n8n API
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

  generateRecipe(preferences: any): Observable<Recipe[]> {
    this.logger.log('Generating recipe with preferences');
    // Call n8n API to generate recipes based on preferences
    return this.http.post<Recipe[]>('/api/generate', preferences);
  }
}
