import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);

  protected get logoSrc(): string {
    return `assets/img/header/logo_${this.themeService.logoVariant()}.png`;
  }
}
