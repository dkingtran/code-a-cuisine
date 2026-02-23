export interface Recipe {
    id: string;
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    cuisine: string;
    imageUrl?: string;
}

export interface Cuisine {
    type: string;
    name: string;
    imageUrl: string;
}