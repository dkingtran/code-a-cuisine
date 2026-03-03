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

  openRecipe(recipe: Recipe): void {
    void this.router.navigate(['/recipe', recipe.id], { state: { recipe } });
  }

  goToGenerate(): void {
    void this.router.navigate(['/generate']);
  }

  // TODO: MOCK DATA – delete once n8n delivers real recipes
  recipes = signal<Recipe[]>([
    {
      id: '1', number: 1, cuisine: 'italian', time: 20,
      title: 'Pasta alla Trapanese (Sicilian Tomato Pesto)',
      description: 'Classic Sicilian pasta with almond tomato pesto.',
      tags: ['Vegetarian', 'Quick'],
      likes: 42,
      nutrition: { calories: 620, protein: 18, fat: 14, carbs: 92 },
      ingredients: ['320g Spaghetti', '400g Cherry tomatoes', '80g Almonds', '2 Garlic cloves', '40g Parmesan', '60ml Olive oil', 'Salt & pepper'],
      extraIngredients: ['Fresh basil', '1 tsp Chilli flakes'],
      directions: [
        { title: 'Toast the almonds', text: 'Toast almonds in a dry pan over medium heat for 3–4 minutes until golden. Let cool.' },
        { title: 'Make the pesto', text: 'Blend tomatoes, almonds, garlic and olive oil into a coarse pesto. Season with salt and pepper.' },
        { title: 'Cook the pasta', text: 'Cook spaghetti in salted boiling water until al dente. Reserve 100ml pasta water before draining.' },
        { title: 'Combine & serve', text: 'Toss pasta with pesto, adding pasta water as needed. Top with parmesan and fresh basil.' },
      ],
    },
    {
      id: '2', number: 2, cuisine: 'german', time: 30,
      title: 'Schnitzel',
      description: 'Classic German breaded and fried pork cutlet.',
      tags: ['Classic', 'Hearty'],
      likes: 78,
      nutrition: { calories: 820, protein: 52, fat: 38, carbs: 58 },
      ingredients: ['2 Pork cutlets (150g each)', '2 Eggs', '80g Breadcrumbs', '40g Flour', '80ml Sunflower oil', 'Salt & pepper', '1 Lemon'],
      extraIngredients: ['Parsley for garnish'],
      directions: [
        { title: 'Pound the meat', text: 'Place each cutlet between cling film and pound to ~5mm thickness. Season with salt and pepper.' },
        { title: 'Bread the schnitzel', text: 'Coat each cutlet in flour, then beaten egg, then breadcrumbs. Press gently so the crumbs stick.' },
        { title: 'Fry until golden', text: 'Heat oil in a large pan over medium-high heat. Fry each schnitzel 3–4 minutes per side until deep golden.' },
        { title: 'Serve', text: 'Drain on paper towel. Serve immediately with a lemon wedge and parsley.' },
      ],
    },
    {
      id: '3', number: 3, cuisine: 'mexican', time: 25,
      title: 'Taco al Pastor',
      description: 'Juicy marinated pork tacos with pineapple and coriander.',
      tags: ['Spicy', 'Street food'],
      likes: 95,
      nutrition: { calories: 540, protein: 34, fat: 20, carbs: 52 },
      ingredients: ['400g Pork shoulder, thinly sliced', '8 Small corn tortillas', '120g Pineapple chunks', '1 White onion', 'Fresh coriander', '2 Limes'],
      extraIngredients: ['2 tbsp Achiote paste', '1 tsp Cumin', '1 tsp Paprika', '2 Garlic cloves', 'Salt'],
      directions: [
        { title: 'Marinate the pork', text: 'Mix achiote paste, cumin, paprika, garlic and lime juice. Coat pork slices and marinate for at least 15 minutes.' },
        { title: 'Cook the pork', text: 'Sear pork in a hot pan with a little oil for 2–3 minutes per side until caramelised. Add pineapple for the last minute.' },
        { title: 'Warm the tortillas', text: 'Heat tortillas directly on a gas flame or dry pan for 30 seconds per side.' },
        { title: 'Assemble & serve', text: 'Fill each tortilla with pork, pineapple, diced onion and coriander. Squeeze lime juice over everything.' },
      ],
    },
  ]);
  // END MOCK DATA
}
