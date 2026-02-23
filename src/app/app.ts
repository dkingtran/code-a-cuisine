import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
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
