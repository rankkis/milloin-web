import { Component, inject } from '@angular/core';
import { WashingMachineService, WashingForecastDto } from './washing-machine.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';

interface ForecastState {
  loading: boolean;
  data: WashingForecastDto | null;
  error: string | null;
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

  forecast$: Observable<ForecastState> = this.trigger$.pipe(
    switchMap(() =>
      this.washingMachineService.getForecast().pipe(
        map((data): ForecastState => ({ loading: false, data, error: null })),
        catchError((err): Observable<ForecastState> => {
          console.error('Error fetching forecast:', err);
          return of({ loading: false, data: null, error: 'Ennusteen lataaminen epäonnistui' });
        }),
        startWith({ loading: true, data: null, error: null })
      )
    )
  );

  getForecast(): void {
    this.trigger$.next();
  }
}