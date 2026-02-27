import { Component, ChangeDetectionStrategy, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { LoadingOverlayComponent } from './shared/components/loading-overlay/loading-overlay';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, LoadingOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly title = signal('code-a-cuisine');

  constructor() {
    effect(() => {
      document.body.style.backgroundColor = this.themeService.backgroundColor() || '';
    });
  }
}
