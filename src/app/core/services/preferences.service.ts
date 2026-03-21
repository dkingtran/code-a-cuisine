import { Injectable, signal } from '@angular/core';
import { SvgIconName } from '../../shared/components/svg-icon/svg-icon';

export type ChefId = Extract<SvgIconName, 'chef-1' | 'chef-2' | 'chef-3' | 'chef-4'>;

export interface ChefConfig {
    label: string;
    bgColor: string;
    iconWidth: number;
    iconHeight: number;
}

export const CHEF_CONFIG: Record<ChefId, ChefConfig> = {
    'chef-1': { label: 'Chef 1', bgColor: '#D7DFD7', iconWidth: 27.5, iconHeight: 22 },
    'chef-2': { label: 'Chef 2', bgColor: '#FFD9B3', iconWidth: 25, iconHeight: 22 },
    'chef-3': { label: 'Chef 3', bgColor: '#CFD7004D', iconWidth: 22, iconHeight: 22 },
    'chef-4': { label: 'Chef 4', bgColor: '#00800066', iconWidth: 15, iconHeight: 22 },
};

export const ALL_CHEFS: ChefId[] = ['chef-1', 'chef-2', 'chef-3', 'chef-4'];

const GEN_PERSONS_KEY = 'cac_gen_persons';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
    readonly persons = signal(1);
    /** Persons count frozen at the moment of the last recipe generation. Persisted in sessionStorage. */
    readonly generationPersons = signal(
        (() => { try { return Number(sessionStorage.getItem(GEN_PERSONS_KEY)) || 1; } catch { return 1; } })()
    );
    readonly portions = signal(2);
    readonly selectedCookingTime = signal<'Quick' | 'Medium' | 'Complex' | null>(null);
    readonly selectedCuisine = signal<'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion' | null>(null);
    readonly selectedDiet = signal<'Vegetarian' | 'Vegan' | 'Keto' | 'No Preferences' | null>(null);

    setPersons(count: number): void {
        this.persons.set(count);
        this.setGenerationPersons(count);
    }

    setGenerationPersons(count: number): void {
        this.generationPersons.set(count);
        try { sessionStorage.setItem(GEN_PERSONS_KEY, String(count)); } catch { }
    }

    reset(): void {
        this.persons.set(1);
        this.portions.set(2);
        this.selectedCookingTime.set(null);
        this.selectedCuisine.set(null);
        this.selectedDiet.set(null);
    }
}
