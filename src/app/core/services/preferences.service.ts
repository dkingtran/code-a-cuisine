import { Injectable, signal } from '@angular/core';
import { SvgIconName } from '../../shared/components/svg-icon/svg-icon';

export type ChefId = Extract<SvgIconName, 'chef-1' | 'chef-2' | 'chef-3' | 'chef-4'>;

export interface ChefConfig {
    label: string;
    bgColor: string;
}

export const CHEF_CONFIG: Record<ChefId, ChefConfig> = {
    'chef-1': { label: 'Chef 1', bgColor: '#D7DFD7' },
    'chef-2': { label: 'Chef 2', bgColor: '#FFD9B3' },
    'chef-3': { label: 'Chef 3', bgColor: '#CFD7004D' },
    'chef-4': { label: 'Chef 4', bgColor: '#00800066' },
};

export const ALL_CHEFS: ChefId[] = ['chef-1', 'chef-2', 'chef-3', 'chef-4'];

@Injectable({ providedIn: 'root' })
export class PreferencesService {
    readonly persons = signal(1);

    setPersons(count: number): void {
        this.persons.set(count);
    }
}
