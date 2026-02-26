import { Injectable, signal, effect, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly backgroundColor = signal<string>('');
    readonly logoVariant = signal<'beige' | 'green'>('green');

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

    setBackground(color: string): void {
        this.backgroundColor.set(color);
    }

    clearBackground(): void {
        this.backgroundColor.set('');
    }

    setLogoVariant(variant: 'beige' | 'green'): void {
        this.logoVariant.set(variant);
    }

    private updateFavicon(variant: 'beige' | 'green'): void {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
            favicon.href = variant === 'green' ? 'assets/favicon-green.svg' : 'assets/favicon-beige.svg';
        }
    }
}
