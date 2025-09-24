import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OptimalTimeDto {
  startTime: string;
  endTime: string;
  price: number;
  rank: number;
  savings: number;
  savingsPercentage: number;
  period: 'day' | 'night';
}

export interface WashingForecastDto {
  today?: OptimalTimeDto;
  tonight?: OptimalTimeDto;
  tomorrow?: OptimalTimeDto;
}

@Injectable({
  providedIn: 'root'
})
export class WashingMachineService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/washing-machine`;

  getForecast(): Observable<WashingForecastDto> {
    return this.http.get<WashingForecastDto>(`${this.apiUrl}/forecast?hours=36`);
  }
}