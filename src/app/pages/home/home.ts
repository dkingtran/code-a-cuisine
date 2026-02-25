import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SvgIconComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);

  protected readonly heroImages = signal([
    { src: 'assets/img/hero/ellipse-3.png', zIndex: 3 },
    { src: 'assets/img/hero/ellipse-2.png', zIndex: 2 },
    { src: 'assets/img/hero/ellipse-1.png', zIndex: 1 }
  ]);

  ngOnInit(): void {
    this.themeService.setBackground('#396039');
    this.themeService.setLogoVariant('beige');
  }

  ngOnDestroy(): void {
    this.themeService.clearBackground();
    this.themeService.setLogoVariant('green');
  }
}
