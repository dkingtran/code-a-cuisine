import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CookbookFilterService {
    readonly selectedCuisineFilter = signal<string | null>(null);
    readonly selectedDietFilter = signal<string | null>(null);
    readonly selectedTimeFilter = signal<'quick' | 'medium' | 'complex' | null>(null);
    readonly sortByLikes = signal(false);

    setCuisineFilter(value: string): void {
        this.selectedCuisineFilter.set(this.selectedCuisineFilter() === value ? null : value);
    }

    setDietFilter(value: string): void {
        this.selectedDietFilter.set(this.selectedDietFilter() === value ? null : value);
    }

    setTimeFilter(value: 'quick' | 'medium' | 'complex'): void {
        this.selectedTimeFilter.set(this.selectedTimeFilter() === value ? null : value);
    }

    toggleSortByLikes(): void {
        this.sortByLikes.update(v => !v);
    }
}
