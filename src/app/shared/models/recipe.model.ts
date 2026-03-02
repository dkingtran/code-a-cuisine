export interface RecipeNutrition {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export interface Recipe {
    id: string;
    number: number;
    title: string;
    description: string;
    ingredients: string[];
    extraIngredients?: string[];
    instructions: string[];
    cuisine: string;
    time: number;
    imageUrl?: string;
    tags?: string[];
    likes?: number;
    nutrition?: RecipeNutrition;
}

export interface Cuisine {
    type: string;
    name: string;
    imageUrl: string;
}