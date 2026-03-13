import { Injectable, signal } from '@angular/core';

/**
 * Service that controls the global loading overlay visibility.
 * Use `show()` before async operations and `hide()` when they complete.
 */
@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    /** Signal indicating whether the loading overlay should be visible. */
    readonly isLoading = signal(false);

    /** Activates the global loading overlay. */
    show(): void {
        this.isLoading.set(true);
    }

    /** Deactivates the global loading overlay. */
    hide(): void {
        this.isLoading.set(false);
    }
}
