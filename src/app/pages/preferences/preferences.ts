import { Component, ChangeDetectionStrategy, computed, inject, signal, ElementRef, viewChild, Injector, afterNextRender, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { RecipeService, StoredIngredient } from '../../shared/services/recipe.service';
import { LoadingService } from '../../core/services/loading.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { QuotaService } from '../../shared/services/quota.service';

const KETO_INCOMPATIBLE = [
  'rice', 'pasta', 'noodle', 'bread', 'flour', 'sugar', 'potato', 'oats',
  'beans', 'lentils', 'chickpeas', 'corn', 'wheat', 'barley', 'banana',
  'apple', 'orange', 'grape', 'mango', 'cereal', 'cracker', 'tortilla',
];
const VEGETARIAN_INCOMPATIBLE = [
  'chicken', 'beef', 'pork', 'lamb', 'salmon', 'tuna', 'shrimp', 'fish',
  'turkey', 'duck', 'bacon', 'ham', 'sausage', 'prawn', 'crab', 'lobster',
  'anchovy', 'sardine', 'trout', 'cod', 'tilapia', 'veal', 'venison',
];
const VEGAN_INCOMPATIBLE = [
  ...VEGETARIAN_INCOMPATIBLE,
  'butter', 'milk', 'cream', 'cheese', 'egg', 'yogurt', 'honey',
  'mayonnaise', 'ghee', 'lard', 'gelatin', 'whey',
];

function getIncompatibleIngredients(ingredients: StoredIngredient[], diet: string | null): string[] {
  const kw = diet === 'Keto' ? KETO_INCOMPATIBLE
    : diet === 'Vegetarian' ? VEGETARIAN_INCOMPATIBLE
      : diet === 'Vegan' ? VEGAN_INCOMPATIBLE
        : null;
  if (!kw) return [];
  return ingredients
    .filter(i => kw.some(k => i.name.toLowerCase().includes(k)))
    .map(i => i.name);
}

@Component({
  selector: 'app-preferences',
  imports: [SvgIconComponent],
  templateUrl: './preferences.html',
  styleUrl: './preferences.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferencesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly recipeService = inject(RecipeService);
  private readonly loadingService = inject(LoadingService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly injector = inject(Injector);
  private readonly quotaService = inject(QuotaService);

  readonly modalBoxRef = viewChild<ElementRef<HTMLElement>>('modalBox');
  readonly quotaBoxRef = viewChild<ElementRef<HTMLElement>>('quotaBox');
  readonly dietWarnBoxRef = viewChild<ElementRef<HTMLElement>>('dietWarnBox');

  readonly showInsufficientModal = signal(false);
  readonly showQuotaModal = signal<'ip' | 'global' | null>(null);
  readonly showDietWarningModal = signal<string[]>([]);

  readonly globalRemaining = this.quotaService.globalRemaining;
  readonly isQuotaLoading = this.quotaService.isLoading;
  readonly GLOBAL_LIMIT = this.quotaService.GLOBAL_LIMIT;

  readonly portions = this.preferencesService.portions;
  readonly portionsShake = signal(false);
  readonly persons = this.preferencesService.persons;
  readonly personsShake = signal(false);

  readonly selectedCookingTime = this.preferencesService.selectedCookingTime;
  readonly selectedCuisine = this.preferencesService.selectedCuisine;
  readonly selectedDiet = this.preferencesService.selectedDiet;

  readonly canGenerate = computed(() =>
    this.selectedCookingTime() !== null &&
    this.selectedCuisine() !== null &&
    this.selectedDiet() !== null
  );

  /** Loads today's quota count from Firestore on component init. */
  ngOnInit(): void {
    void this.quotaService.loadTodayCount();
  }

  /** Decrements the portions counter, triggering a shake animation at the minimum. */
  decreasePortions() {
    if (this.portions() <= 1) { this.portionsShake.set(true); setTimeout(() => this.portionsShake.set(false), 400); return; }
    this.portions.update(p => p - 1);
  }

  /** Increments the portions counter, triggering a shake animation at the maximum. */
  increasePortions() {
    if (this.portions() >= 12) { this.portionsShake.set(true); setTimeout(() => this.portionsShake.set(false), 400); return; }
    this.portions.update(p => p + 1);
  }

  /** Decrements the persons counter, triggering a shake animation at the minimum. */
  decreasePersons() {
    if (this.persons() <= 1) { this.triggerPersonsShake(); return; }
    this.persons.update(p => p - 1);
  }

  /** Increments the persons counter, triggering a shake animation at the maximum. */
  increasePersons() {
    if (this.persons() >= 4) { this.triggerPersonsShake(); return; }
    this.persons.update(p => p + 1);
  }

  /** Briefly sets the persons shake signal to animate the counter at its limit. */
  private triggerPersonsShake(): void {
    this.personsShake.set(true);
    setTimeout(() => this.personsShake.set(false), 400);
  }

  /** Selects or deselects the cooking time category (toggles if already selected). */
  selectCookingTime(time: 'Quick' | 'Medium' | 'Complex') {
    this.selectedCookingTime.update(v => v === time ? null : time);
  }

  /** Selects or deselects the cuisine style (toggles if already selected). */
  selectCuisine(cuisine: 'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion') {
    this.selectedCuisine.update(v => v === cuisine ? null : cuisine);
  }

  /** Selects or deselects the diet preference (toggles if already selected). */
  selectDiet(diet: 'Vegetarian' | 'Vegan' | 'Keto' | 'No Preferences') {
    this.selectedDiet.update(v => v === diet ? null : diet);
  }

  generateRecipe(): void {
    if (this.quotaService.isGlobalExhausted()) {
      this.openQuotaModal('global');
      return;
    }
    const incompatible = getIncompatibleIngredients(
      this.recipeService.ingredients(),
      this.selectedDiet()
    );
    if (incompatible.length > 0) {
      this.openDietWarningModal(incompatible);
      return;
    }
    this.startGeneration();
  }

  private startGeneration(): void {
    this.loadingService.show();
    this.preferencesService.setPersons(this.persons());
    this.recipeService.generateRecipe(this.buildPreferences()).subscribe({
      next: () => this.handleGenerateSuccess(),
      error: (err: unknown) => this.handleGenerateError(err),
    });
  }

  private openDietWarningModal(ingredients: string[]): void {
    this.showDietWarningModal.set(ingredients);
    document.body.style.overflow = 'hidden';
    afterNextRender(() => this.dietWarnBoxRef()?.nativeElement.focus(), { injector: this.injector });
  }

  closeDietWarning(): void {
    this.showDietWarningModal.set([]);
    document.body.style.overflow = '';
  }

  proceedDespiteWarning(): void {
    this.closeDietWarning();
    this.startGeneration();
  }

  goBackFromDietWarning(): void {
    this.closeDietWarning();
    void this.router.navigate(['/generate']);
  }

  /** Builds the preferences object from the current signal values. */
  private buildPreferences() {
    return {
      portions: this.portions(),
      persons: this.persons(),
      cookingTime: this.selectedCookingTime(),
      cuisine: this.selectedCuisine(),
      diet: this.selectedDiet(),
    };
  }

  /** Opens the quota-exceeded modal and focuses it for accessibility. */
  private openQuotaModal(type: 'ip' | 'global'): void {
    this.showQuotaModal.set(type);
    document.body.style.overflow = 'hidden';
    afterNextRender(() => this.quotaBoxRef()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Opens the insufficient-ingredients modal and focuses it. */
  private openInsufficientModal(): void {
    this.showInsufficientModal.set(true);
    document.body.style.overflow = 'hidden';
    afterNextRender(() => this.modalBoxRef()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Handles a successful recipe generation response. */
  private handleGenerateSuccess(): void {
    this.quotaService.incrementUsed();
    this.loadingService.hide();
    this.preferencesService.reset();
    void this.router.navigate(['/results']);
  }

  /** Handles an error during recipe generation, showing the appropriate modal. */
  private handleGenerateError(err: unknown): void {
    this.loadingService.hide();
    const message = err instanceof Error ? err.message : '';
    if (message.startsWith('QUOTA_EXCEEDED:')) {
      this.openQuotaModal(message.split(':')[1] as 'ip' | 'global');
    } else {
      this.openInsufficientModal();
    }
  }

  /** Closes the insufficient-ingredients modal and restores page scroll. */
  closeModal(): void {
    this.showInsufficientModal.set(false);
    document.body.style.overflow = '';
  }

  /** Closes the quota-exceeded modal and restores page scroll. */
  closeQuotaModal(): void {
    this.showQuotaModal.set(null);
    document.body.style.overflow = '';
  }

  /** Closes the modal and navigates back to the ingredient input page. */
  goBackToIngredients(): void {
    this.closeModal();
    void this.router.navigate(['/generate']);
  }
}
