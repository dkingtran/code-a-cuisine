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
  '/cookbook': { route: '/', label: 'Back' },
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
    if (url.startsWith('/recipe/')) {
      const fromCookbook = this.previousUrl().startsWith('/cookbook');
      return fromCookbook
        ? { route: '/cookbook', label: 'Back to the cookbook' }
        : { route: '/results', label: 'Back to recipe results' };
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
