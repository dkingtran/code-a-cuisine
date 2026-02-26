import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Recipe } from '../../shared/models/recipe.model';
import { ThemeService } from '../../core/services/theme.service';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [SvgIconComponent],
  templateUrl: './results.html',
  styleUrl: './results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.themeService.setBackground('#396039');
  }

  ngOnDestroy(): void {
    this.themeService.clearBackground();
  }

  openRecipe(id: string): void {
    void this.router.navigate(['/recipe', id]);
  }

  goToGenerate(): void {
    void this.router.navigate(['/generate']);
  }

  recipes = signal<Recipe[]>([
    { id: '1', title: 'Spaghetti Carbonara', description: 'Classic Italian pasta', ingredients: [], instructions: [], cuisine: 'italian' },
    { id: '2', title: 'Schnitzel', description: 'German breaded cutlet', ingredients: [], instructions: [], cuisine: 'german' }
  ]);
}
