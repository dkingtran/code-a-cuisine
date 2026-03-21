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
    deleteField,
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
    async saveRecipes(recipes: Recipe[]): Promise<Recipe[]> {
        const col = collection(this.db, 'recipes');
        return Promise.all(recipes.map(recipe => this.saveIfNotDuplicate(col, recipe)));
    }

    private async saveIfNotDuplicate(col: ReturnType<typeof collection>, recipe: Recipe): Promise<Recipe> {
        const q = query(col, where('title', '==', recipe.title));
        const existing = await getDocs(q);
        if (!existing.empty) {
            return { ...recipe, id: existing.docs[0].id };
        }
        const docRef = await addDoc(col, { ...recipe, createdAt: Timestamp.now() });
        return { ...recipe, id: docRef.id };
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
     * Returns the anonymous user ID stored in localStorage,
     * creating and persisting a new UUID if none exists yet.
     */
    private getUserId(): string {
        const key = 'cac_user_id';
        let id = localStorage.getItem(key);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(key, id);
        }
        return id;
    }

    /**
     * Toggles the like state for a recipe for the current anonymous user.
     * Stores the vote as a field in the recipe document itself (`voters.{userId}`)
     * to avoid needing a separate Firestore collection with its own security rules.
     * Returns the new liked state (true = liked, false = unliked).
     */
    async toggleLike(recipeId: string): Promise<boolean> {
        const userId = this.getUserId();
        const recipeRef = doc(this.db, 'recipes', recipeId);
        const snap = await getDoc(recipeRef);
        const voters = (snap.data()?.['voters'] as Record<string, boolean>) ?? {};
        const hasVoted = voters[userId] === true;
        if (hasVoted) {
            await updateDoc(recipeRef, { [`voters.${userId}`]: deleteField(), likes: increment(-1) });
            return false;
        }
        await updateDoc(recipeRef, { [`voters.${userId}`]: true, likes: increment(1) });
        return true;
    }

    /**
     * Returns true if the current anonymous user has already liked the given recipe.
     * Reads the `voters` map from the recipe document in Firestore.
     */
    async hasLiked(recipeId: string): Promise<boolean> {
        const userId = this.getUserId();
        const recipeRef = doc(this.db, 'recipes', recipeId);
        const snap = await getDoc(recipeRef);
        const voters = (snap.data()?.['voters'] as Record<string, boolean>) ?? {};
        return voters[userId] === true;
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
     * Fetches a single recipe by its Firestore document ID.
     * Returns null if no document with that ID exists.
     */
    async getRecipeById(id: string): Promise<Recipe | null> {
        const ref = doc(this.db, 'recipes', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        const data = snap.data() as RecipeDocument;
        const { createdAt: _, ...recipe } = data;
        return { ...recipe, id: snap.id } as Recipe;
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
