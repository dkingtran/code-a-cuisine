import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Recipe } from '../../models/recipe.model';
import { SvgIconComponent } from '../svg-icon/svg-icon';

@Component({
    selector: 'app-recipe-card',
    imports: [SvgIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './recipe-card.html',
    styleUrl: './recipe-card.scss',
})
export class RecipeCardComponent {
    recipe = input.required<Recipe>();
}
