import { Component, inject } from '@angular/core';
import { WashingMachineService, WashingForecastDto } from './washing-machine.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';

interface ForecastState {
  loading: boolean;
  data: WashingForecastDto | null;
  error: string | null;
  technicalDetails?: any;
}

@Component({
  selector: 'app-washing-machine',
  standalone: false,
  templateUrl: './washing-machine.component.html',
  styleUrl: './washing-machine.component.scss'
})
export class WashingMachineComponent {
  private readonly washingMachineService = inject(WashingMachineService);
  private readonly trigger$ = new BehaviorSubject<void>(undefined);

  showDebugInfo = false;

  forecast$: Observable<ForecastState> = this.trigger$.pipe(
    switchMap(() =>
      this.washingMachineService.getForecast().pipe(
        map((data): ForecastState => ({ loading: false, data, error: null })),
        catchError((err): Observable<ForecastState> => {
          console.error('[WashingMachineComponent] Error fetching forecast:', err);

          const errorMessage = err.userMessage || 'Ennusteen lataaminen epäonnistui';
          const technicalDetails = err.technicalDetails || err;

          return of({
            loading: false,
            data: null,
            error: errorMessage,
            technicalDetails
          });
        }),
        startWith({ loading: true, data: null, error: null })
      )
    )
  );

  getForecast(): void {
    console.log('[WashingMachineComponent] Requesting new forecast');
    this.trigger$.next();
  }

  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo;
  }

  copyDebugInfo(technicalDetails: any): void {
    if (technicalDetails) {
      const debugText = JSON.stringify(technicalDetails, null, 2);
      navigator.clipboard?.writeText(debugText).then(() => {
        console.log('Debug info copied to clipboard');
      }).catch(() => {
        console.log('Failed to copy to clipboard');
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = debugText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      });
    }
  }
}