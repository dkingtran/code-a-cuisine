import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent)
    },
    {
        path: 'generate',
        loadComponent: () => import('./pages/generate-recipe/generate-recipe').then(m => m.GenerateRecipeComponent)
    },
    {
        path: 'preferences',
        loadComponent: () => import('./pages/preferences/preferences').then(m => m.PreferencesComponent)
    },
    {
        path: 'loading',
        loadComponent: () => import('./pages/loading/loading').then(m => m.LoadingComponent)
    },
    {
        path: 'results',
        loadComponent: () => import('./pages/results/results').then(m => m.ResultsComponent)
    },
    {
        path: 'recipe/:id',
        loadComponent: () => import('./pages/recipe-view/recipe-view').then(m => m.RecipeViewComponent)
    },
    {
        path: 'cookbook',
        loadComponent: () => import('./pages/cookbook/cookbook').then(m => m.CookbookComponent)
    },
    {
        path: 'cuisine/:type',
        loadComponent: () => import('./pages/cuisine-recipes/cuisine-recipes').then(m => m.CuisineRecipesComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
