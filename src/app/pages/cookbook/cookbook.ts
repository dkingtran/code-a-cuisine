import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { Cuisine, Recipe } from '../../shared/models/recipe.model';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { RecipeCardComponent } from '../../shared/components/recipe-card/recipe-card';

@Component({
  selector: 'app-cookbook',
  imports: [SvgIconComponent, RecipeCardComponent, NgOptimizedImage],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookbookComponent {
  private readonly router = inject(Router);

  liked = signal(false);
  toggleLike(): void { this.liked.update(v => !v); }

  readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('recipeScroll');

  private isDragging = false;
  private hasDragged = false;
  private dragStartX = 0;
  private scrollStartLeft = 0;
  private readonly DRAG_THRESHOLD = 5;

  onMouseDown(event: MouseEvent): void {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    this.isDragging = true;
    this.hasDragged = false;
    this.dragStartX = event.pageX - el.offsetLeft;
    this.scrollStartLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    const x = event.pageX - el.offsetLeft;
    const delta = x - this.dragStartX;
    if (Math.abs(delta) > this.DRAG_THRESHOLD) {
      this.hasDragged = true;
    }
    el.scrollLeft = this.scrollStartLeft - delta;
  }

  onMouseUp(): void {
    this.isDragging = false;
    const el = this.scrollContainer()?.nativeElement;
    if (el) el.style.cursor = 'pointer';
  }

  onScrollClick(event: MouseEvent): void {
    if (this.hasDragged) {
      event.stopPropagation();
      this.hasDragged = false;
    }
  }

  navigateToRecipe(recipe: Recipe): void {
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }
    void this.router.navigate(['/recipe', recipe.id]);
  }

  cuisines = signal<Cuisine[]>([
    { type: 'italian', name: 'Italian Cuisine', imageUrl: 'assets/img/cookbook/italian.png', emoji: '🍝' },
    { type: 'german', name: 'German Cuisine', imageUrl: 'assets/img/cookbook/german.png', emoji: '🥨' },
    { type: 'japanese', name: 'Japanese Cuisine', imageUrl: 'assets/img/cookbook/japanese.png', emoji: '🍱' },
    { type: 'gourmet', name: 'Gourmet Cuisine', imageUrl: 'assets/img/cookbook/gourmet.png', emoji: '⭐' },
    { type: 'indian', name: 'Indian Cuisine', imageUrl: 'assets/img/cookbook/indian.png', emoji: '🍛' },
    { type: 'fusion', name: 'Fusion Cuisine', imageUrl: 'assets/img/cookbook/fusion.png', emoji: '🌐' },
  ]);

  recipes = signal<Recipe[]>([
    {
      id: '1', number: 1,
      title: 'Pasta alla Trapanese (Sicilian Tomato Pesto)',
      description: 'A classic Sicilian pasta dish.', ingredients: [], directions: [],
      cuisine: 'Italian', time: 25, likes: 142
    },
    {
      id: '2', number: 2,
      title: 'Risotto ai Funghi Porcini',
      description: 'Creamy porcini mushroom risotto.', ingredients: [], directions: [],
      cuisine: 'Italian', time: 40, likes: 98
    },
    {
      id: '3', number: 3,
      title: 'Wiener Schnitzel mit Kartoffelsalat',
      description: 'Traditional Austrian breaded veal cutlet.', ingredients: [], directions: [],
      cuisine: 'German', time: 35, likes: 115
    },
    {
      id: '4', number: 4,
      title: 'Coq au Vin Blanc',
      description: 'French chicken braised in white wine.', ingredients: [], directions: [],
      cuisine: 'French', time: 60, likes: 87
    },
    {
      id: '5', number: 5,
      title: 'Pad Thai mit gerösteten Erdnüssen',
      description: 'Classic Thai stir-fried rice noodles.', ingredients: [], directions: [],
      cuisine: 'Thai', time: 20, likes: 203
    }
  ]);

  openCuisine(type: string): void {
    void this.router.navigate(['/cuisine', type]);
  }

  goToCuisine(type: string): void {
    void this.router.navigate(['/cuisine', type]);
  }

  goToGenerate(): void {
    void this.router.navigate(['/generate']);
  }
}
