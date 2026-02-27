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
    // Duration matches the loading GIF animation length (~13.16s)
    setTimeout(() => {
      this.router.navigate(['/results']);
    }, 13160);
  }

  ngOnDestroy(): void {
    this.themeService.clearBackground();
  }
}
