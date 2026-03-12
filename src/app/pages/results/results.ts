import { Component, ChangeDetectionStrategy, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Recipe } from '../../shared/models/recipe.model';
import { ThemeService } from '../../core/services/theme.service';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { RecipeService } from '../../shared/services/recipe.service';

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
  private readonly recipeService = inject(RecipeService);

  readonly recipes = this.recipeService.generatedRecipes;
  readonly tags = this.recipeService.generatedTags;

  ngOnInit(): void {
    this.themeService.setBackground('#396039');
  }

  ngOnDestroy(): void {
    this.themeService.clearBackground();
  }

  openRecipe(recipe: Recipe): void {
    void this.router.navigate(['/recipe', recipe.id], { state: { recipe } });
  }

  goToGenerate(): void {
    void this.router.navigate(['/generate']);
  }
}
