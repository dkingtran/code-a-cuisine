import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.html',
  styleUrl: './loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.setBackground('#396039');
    this.themeService.setLogoVariant('beige');
    // Simulate API call duration
    setTimeout(() => {
      this.router.navigate(['/results']);
    }, 3000); // 3 seconds
  }

  ngOnDestroy(): void {
    this.themeService.clearBackground();
    this.themeService.setLogoVariant('green');
  }
}
