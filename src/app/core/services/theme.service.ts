import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly backgroundColor = signal<string>('');

    setBackground(color: string): void {
        this.backgroundColor.set(color);
    }

    clearBackground(): void {
        this.backgroundColor.set('');
    }
}
