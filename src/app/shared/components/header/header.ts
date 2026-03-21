import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { SvgIconComponent } from '../svg-icon/svg-icon';

interface BackConfig {
  label: string;
}

const FALLBACK_ROUTES: Record<string, string> = {
  '/preferences': '/generate',
  '/cookbook': '/',
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

  private readonly navStack = signal<string[]>([this.router.url]);

  constructor() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const url = e.urlAfterRedirects;
        this.navStack.update(stack =>
          stack.length >= 2 && stack[stack.length - 2] === url
            ? stack.slice(0, -1)
            : [...stack, url]
        );
      }
    });
  }

  protected readonly backConfig = computed((): BackConfig | null => {
    const stack = this.navStack();
    const url = stack[stack.length - 1] ?? '';
    const prev = stack.length >= 2 ? stack[stack.length - 2] : '';

    if (url.startsWith('/recipe/')) {
      if (prev.startsWith('/cookbook')) return { label: 'Back to the cookbook' };
      if (prev.startsWith('/cuisine/')) {
        const type = prev.split('/')[2] ?? '';
        const name = type.charAt(0).toUpperCase() + type.slice(1);
        return { label: `Back to ${name} Cuisine` };
      }
      return { label: 'Back to recipe results' };
    }

    if (url === '/cookbook') {
      return prev.startsWith('/recipe/') ? { label: 'Back to recipe' } : { label: 'Back' };
    }

    if (url.startsWith('/cuisine/')) return { label: 'Cookbook' };

    const config: Record<string, BackConfig> = { '/preferences': { label: 'Ingredients' } };
    return config[url] ?? null;
  });

  private getFallbackRoute(): string {
    const url = this.navStack()[this.navStack().length - 1] ?? '/';
    if (url.startsWith('/recipe/')) return '/results';
    if (url.startsWith('/cuisine/')) return '/cookbook';
    return FALLBACK_ROUTES[url] ?? '/';
  }

  protected goBack(): void {
    const stack = this.navStack();
    const target = stack.length >= 2 ? stack[stack.length - 2] : this.getFallbackRoute();
    void this.router.navigateByUrl(target);
  }

  protected get logoSrc(): string {
    return `assets/img/header/logo_${this.themeService.logoVariant()}.png`;
  }
}
