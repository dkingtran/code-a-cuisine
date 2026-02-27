import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
    selector: 'app-loading-overlay',
    imports: [],
    templateUrl: './loading-overlay.html',
    styleUrl: './loading-overlay.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class.visible]': 'loadingService.isLoading()',
        'aria-live': 'polite',
        'aria-label': 'Loading',
    }
})
export class LoadingOverlayComponent {
    protected readonly loadingService = inject(LoadingService);
}
