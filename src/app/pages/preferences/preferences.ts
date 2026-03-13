import { Component, ChangeDetectionStrategy, inject, signal, ElementRef, viewChild, Injector, afterNextRender, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SvgIconComponent } from '../../shared/components/svg-icon/svg-icon';
import { RecipeService } from '../../shared/services/recipe.service';
import { LoadingService } from '../../core/services/loading.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { QuotaService } from '../../shared/services/quota.service';

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

  readonly showInsufficientModal = signal(false);
  readonly showQuotaModal = signal<'ip' | 'global' | null>(null);

  readonly globalRemaining = this.quotaService.globalRemaining;
  readonly isQuotaLoading = this.quotaService.isLoading;
  readonly GLOBAL_LIMIT = this.quotaService.GLOBAL_LIMIT;
  readonly IP_LIMIT = this.quotaService.IP_LIMIT;

  readonly portions = signal(2);
  readonly portionsShake = signal(false);
  readonly persons = signal(1);
  readonly personsShake = signal(false);

  readonly selectedCookingTime = signal<'Quick' | 'Medium' | 'Complex' | null>(null);
  readonly selectedCuisine = signal<'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion' | null>(null);
  readonly selectedDiet = signal<'Vegetarian' | 'Vegan' | 'Keto' | 'No Preferences' | null>(null);

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

  decreasePersons() {
    if (this.persons() <= 1) { this.triggerPersonsShake(); return; }
    this.persons.update(p => p - 1);
  }

  increasePersons() {
    if (this.persons() >= 4) { this.triggerPersonsShake(); return; }
    this.persons.update(p => p + 1);
  }

  private triggerPersonsShake(): void {
    this.personsShake.set(true);
    setTimeout(() => this.personsShake.set(false), 400);
  }

  selectCookingTime(time: 'Quick' | 'Medium' | 'Complex') {
    this.selectedCookingTime.set(time);
  }

  selectCuisine(cuisine: 'German' | 'Italian' | 'Indian' | 'Japanese' | 'Gourmet' | 'Fusion') {
    this.selectedCuisine.set(cuisine);
  }

  selectDiet(diet: 'Vegetarian' | 'Vegan' | 'Keto' | 'No Preferences') {
    this.selectedDiet.set(diet);
  }

  /**
   * Triggers recipe generation via the n8n AI workflow.
   * Checks quota before sending, shows appropriate modal on error.
   */
  generateRecipe(): void {
    if (this.quotaService.isGlobalExhausted()) {
      this.showQuotaModal.set('global');
      document.body.style.overflow = 'hidden';
      afterNextRender(() => {
        this.quotaBoxRef()?.nativeElement.focus();
      }, { injector: this.injector });
      return;
    }
    this.loadingService.show();
    this.preferencesService.setPersons(this.persons());
    const preferences = {
      portions: this.portions(),
      persons: this.persons(),
      cookingTime: this.selectedCookingTime(),
      cuisine: this.selectedCuisine(),
      diet: this.selectedDiet(),
    };
    this.recipeService.generateRecipe(preferences).subscribe({
      next: () => {
        this.quotaService.incrementUsed();
        this.loadingService.hide();
        void this.router.navigate(['/results']);
      },
      error: (err: unknown) => {
        this.loadingService.hide();
        const message = err instanceof Error ? err.message : '';
        if (message.startsWith('QUOTA_EXCEEDED:')) {
          const type = message.split(':')[1] as 'ip' | 'global';
          this.showQuotaModal.set(type);
          document.body.style.overflow = 'hidden';
          afterNextRender(() => {
            this.quotaBoxRef()?.nativeElement.focus();
          }, { injector: this.injector });
        } else {
          this.showInsufficientModal.set(true);
          document.body.style.overflow = 'hidden';
          afterNextRender(() => {
            this.modalBoxRef()?.nativeElement.focus();
          }, { injector: this.injector });
        }
      },
    });
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
    void this.router.navigate(['/generate-recipe']);
  }
}
