import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    Firestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    onSnapshot,
    increment,
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
     * Skips recipes whose title already exists to prevent duplicates.
     */
    async saveRecipes(recipes: Recipe[]): Promise<void> {
        const col = collection(this.db, 'recipes');
        const saves = recipes.map(recipe => this.saveIfNotDuplicate(col, recipe));
        await Promise.all(saves);
    }

    private async saveIfNotDuplicate(col: ReturnType<typeof collection>, recipe: Recipe): Promise<void> {
        const q = query(col, where('title', '==', recipe.title));
        const existing = await getDocs(q);
        if (existing.empty) {
            await addDoc(col, { ...recipe, createdAt: Timestamp.now() });
        }
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
     * Atomically increments (or decrements) the likes counter for a recipe.
     * Uses Firestore increment to prevent race conditions with concurrent likes.
     */
    async incrementLike(recipeId: string, delta: 1 | -1): Promise<void> {
        const ref = doc(this.db, 'recipes', recipeId);
        await updateDoc(ref, { likes: increment(delta) });
    }

    /**
     * Subscribes to real-time likes updates for a single recipe.
     * Calls `callback` immediately with the current value and on every change.
     * Returns an unsubscribe function — call it in ngOnDestroy.
     */
    listenToLikes(recipeId: string, callback: (likes: number) => void): () => void {
        const ref = doc(this.db, 'recipes', recipeId);
        return onSnapshot(ref, snapshot => {
            const data = snapshot.data();
            if (data && typeof data['likes'] === 'number') {
                callback(data['likes'] as number);
            }
        });
    }

    /**
     * Fetches all recipes for a specific cuisine type, sorted by likes descending.
     * Sorting is done client-side to avoid requiring a Firestore composite index.
     */
    async getRecipesByCuisine(cuisine: string): Promise<Recipe[]> {
        const col = collection(this.db, 'recipes');
        const q = query(col, where('cuisine', '==', cuisine));
        const snapshot = await getDocs(q);
        const recipes = snapshot.docs.map(docSnap => {
            const data = docSnap.data() as RecipeDocument;
            const { createdAt: _, ...recipe } = data;
            return { ...recipe, id: docSnap.id } as Recipe;
        });
        return recipes.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
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
