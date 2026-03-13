import { Injectable, signal, effect, computed } from '@angular/core';

/**
 * Service that manages the app-wide visual theme.
 * Controls the background colour of pages and automatically switches
 * the header logo and favicon between green and beige variants.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
    /** Current page background colour. Empty string means default (white). */
    readonly backgroundColor = signal<string>('');

    /** Current logo/favicon colour variant derived from the background. */
    readonly logoVariant = signal<'beige' | 'green'>('green');

    /** True when a custom background colour is active (i.e. a dark/coloured page). */
    readonly isDarkTheme = computed(() => this.backgroundColor() !== '');

    constructor() {
        effect(() => {
            const variant = this.isDarkTheme() ? 'beige' : 'green';
            this.logoVariant.set(variant);
        });

        effect(() => {
            this.updateFavicon(this.logoVariant());
        });
    }

    /** Sets the page background to the given CSS colour value. */
    setBackground(color: string): void {
        this.backgroundColor.set(color);
    }

    /** Resets the page background to the default (white). */
    clearBackground(): void {
        this.backgroundColor.set('');
    }

    /** Manually overrides the logo colour variant. */
    setLogoVariant(variant: 'beige' | 'green'): void {
        this.logoVariant.set(variant);
    }

    /** Updates the browser favicon to match the current logo variant. */
    private updateFavicon(variant: 'beige' | 'green'): void {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
            favicon.href = variant === 'green' ? 'assets/favicon-green.svg' : 'assets/favicon-beige.svg';
        }
    }
}
