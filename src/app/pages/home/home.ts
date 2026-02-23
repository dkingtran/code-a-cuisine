import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.setBackground('#396039');
  }

  ngOnDestroy(): void {
    this.themeService.clearBackground();
  }
}
