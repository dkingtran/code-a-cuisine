import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { SvgIconComponent } from '../svg-icon/svg-icon';

interface BackConfig {
  route: string;
  label: string;
}

const BACK_CONFIG: Record<string, BackConfig> = {
  '/preferences': { route: '/generate', label: 'Ingredients' },
};

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SvgIconComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  private readonly previousUrl = signal<string>('');
  private readonly currentUrl = signal<string>(this.router.url);

  constructor() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.previousUrl.set(this.currentUrl());
        this.currentUrl.set(e.urlAfterRedirects);
      }
    });
  }

  protected readonly backConfig = computed((): BackConfig | null => {
    const url = this.currentUrl();
    const prev = this.previousUrl();

    if (url.startsWith('/recipe/')) {
      if (prev.startsWith('/cookbook')) {
        return { route: '/cookbook', label: 'Back to the cookbook' };
      }
      if (prev.startsWith('/cuisine/')) {
        const type = prev.split('/')[2] ?? '';
        const name = type.charAt(0).toUpperCase() + type.slice(1);
        return { route: prev, label: `Back to ${name} Cuisine` };
      }
      return { route: '/results', label: 'Back to recipe results' };
    }

    if (url === '/cookbook') {
      if (prev.startsWith('/recipe/')) {
        return { route: prev, label: 'Back to recipe' };
      }
      return { route: '/', label: 'Back' };
    }

    if (url.startsWith('/cuisine/')) {
      return { route: '/cookbook', label: 'Cookbook' };
    }

    return BACK_CONFIG[url] ?? null;
  });

  protected get logoSrc(): string {
    return `assets/img/header/logo_${this.themeService.logoVariant()}.png`;
  }
}
