export interface Recipe {
    id: string;
    number: number;
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    cuisine: string;
    time: number;
    imageUrl?: string;
}

export interface Cuisine {
    type: string;
    name: string;
    imageUrl: string;
}