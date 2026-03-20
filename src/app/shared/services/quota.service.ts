import { Injectable, inject, signal, computed } from '@angular/core';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class QuotaService {
    private readonly firebase = inject(FirebaseService);

    /** Maximum recipe generations allowed system-wide per day. */
    readonly GLOBAL_LIMIT = 12;

    /** Maximum recipe generations allowed per IP per day. */
    readonly IP_LIMIT = 3;

    readonly globalUsed = signal(0);
    readonly isLoading = signal(true);

    /** How many global generations are still available today. */
    readonly globalRemaining = computed(() => Math.max(0, this.GLOBAL_LIMIT - this.globalUsed()));

    /** True when the system-wide daily quota is exhausted. */
    readonly isGlobalExhausted = computed(() => this.globalRemaining() <= 0);

    /**
     * Loads today's recipe count from Firestore and updates the quota signals.
     * Should be called once when the preferences page initializes.
     */
    async loadTodayCount(): Promise<void> {
        this.isLoading.set(true);
        try {
            // TESTING: bypass daily limit — remove before production
            this.globalUsed.set(0);
            // const count = await this.firebase.getTodayRecipeCount();
            // this.globalUsed.set(count);
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Increments the local used counter by 3 (one generation = 3 recipes).
     * Called optimistically after a successful generation to keep UI in sync.
     */
    incrementUsed(): void {
        this.globalUsed.update(v => v + 3);
    }
}
