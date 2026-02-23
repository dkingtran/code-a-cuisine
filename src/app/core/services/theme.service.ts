import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly backgroundColor = signal<string>('');
    readonly logoVariant = signal<'beige' | 'green'>('green');

    setBackground(color: string): void {
        this.backgroundColor.set(color);
    }

    clearBackground(): void {
        this.backgroundColor.set('');
    }

    setLogoVariant(variant: 'beige' | 'green'): void {
        this.logoVariant.set(variant);
    }
}
