import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
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

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly backConfig = computed((): BackConfig | null => {
    const url = this.currentUrl();
    if (url.startsWith('/recipe/')) {
      return { route: '/results', label: 'Recipe results' };
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
