import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    Firestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    Timestamp
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { Recipe } from '../models/recipe.model';

/** Firestore document shape for a stored recipe. */
export interface RecipeDocument extends Recipe {
    createdAt: Timestamp;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {
    private readonly app: FirebaseApp;
    private readonly db: Firestore;

    constructor() {
        this.app = getApps().length ? getApps()[0] : initializeApp(environment.firebase);
        this.db = getFirestore(this.app);
    }

    /**
     * Saves an array of generated recipes to the Firestore "recipes" collection.
     * Each recipe is stored as a separate document with a server timestamp.
     */
    async saveRecipes(recipes: Recipe[]): Promise<void> {
        const col = collection(this.db, 'recipes');
        const saves = recipes.map(recipe =>
            addDoc(col, { ...recipe, createdAt: Timestamp.now() })
        );
        await Promise.all(saves);
    }

    /**
     * Returns the total number of recipes generated today (since midnight local time).
     * Used to enforce and display the global daily quota of 12 recipes.
     */
    async getTodayRecipeCount(): Promise<number> {
        const col = collection(this.db, 'recipes');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const q = query(col, where('createdAt', '>=', Timestamp.fromDate(todayStart)));
        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    /**
     * Fetches the most recent recipes from Firestore, ordered by creation date descending.
     * @param count Maximum number of recipes to fetch (default: 50)
     */
    async getRecipes(count = 50): Promise<Recipe[]> {
        const col = collection(this.db, 'recipes');
        const q = query(col, orderBy('createdAt', 'desc'), limit(count));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data() as RecipeDocument;
            const { createdAt: _, ...recipe } = data;
            return { ...recipe, id: doc.id } as Recipe;
        });
    }
}
