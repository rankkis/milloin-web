import { Component, inject, ViewChild } from '@angular/core';
import { OverviewService, OverviewDto, PricePointDto } from '../overview.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';
import { PriceUtilitiesService } from '../../shared/services/price-utilities.service';
import { PriceCategory } from '../../shared/models/price.model';
import { ChartConfiguration, ChartType, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

interface OverviewState {
  loading: boolean;
  data: OverviewDto | null;
  error: string | null;
}

@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private readonly overviewService = inject(OverviewService);
  private readonly priceUtilities = inject(PriceUtilitiesService);
  private readonly trigger$ = new BehaviorSubject<void>(undefined);

  // Store the first timestamp for reference line calculations
  private firstTimestamp?: Date;

  // Chart.js configuration
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  // Custom plugin for vertical reference lines
  public lineChartPlugins: Plugin[] = [
    {
      id: 'verticalReferenceLines',
      afterDraw: (chart) => {
        if (!this.firstTimestamp) return;

        const ctx = chart.ctx;
        const xAxis = chart.scales['x'];
        const yAxis = chart.scales['y'];

        if (!xAxis || !yAxis) return;

        // Calculate time markers: +2h, +6h, +12h, +24h from first data point
        const markers = [
          { hours: 2, label: '+2h', color: 'rgba(255, 255, 255, 0.5)' },
          { hours: 6, label: '+6h', color: 'rgba(255, 255, 255, 0.6)' },
          { hours: 12, label: '+12h', color: 'rgba(255, 255, 255, 0.7)' },
          { hours: 24, label: '+24h', color: 'rgba(255, 255, 255, 0.8)' }
        ];

        const labels = chart.data.labels as string[];

        markers.forEach(marker => {
          const targetTimeMs = this.firstTimestamp!.getTime() + marker.hours * 60 * 60 * 1000;

          // Find closest label index by checking all labels
          let closestIndex = -1;
          let minDiff = Infinity;

          labels.forEach((label, index) => {
            if (typeof label !== 'string') return;

            // Parse the label time (format: "HH:mm" or "HH.mm" for Finnish locale)
            const parts = label.split(/[:.]/);  // Split by colon or dot
            if (parts.length !== 2) return;

            const [hours, minutes] = parts.map(Number);
            if (isNaN(hours) || isNaN(minutes)) return;

            // Create date from first timestamp and set the time
            const labelDate = new Date(this.firstTimestamp!.getFullYear(),
                                       this.firstTimestamp!.getMonth(),
                                       this.firstTimestamp!.getDate(),
                                       hours, minutes, 0, 0);

            // Handle day rollover - if label time is before first timestamp, it's next day
            if (labelDate.getTime() < this.firstTimestamp!.getTime()) {
              labelDate.setDate(labelDate.getDate() + 1);
            }

            const diff = Math.abs(labelDate.getTime() - targetTimeMs);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = index;
            }
          });

          if (closestIndex === -1 || minDiff > 30 * 60 * 1000) {
            return; // Skip if no match within 30 min
          }

          // Get pixel position for this index
          const x = xAxis.getPixelForValue(closestIndex);

          // Draw vertical line
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = marker.color;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.stroke();
          ctx.restore();

          // Draw label with background for better readability
          ctx.save();

          // Measure text
          ctx.font = 'bold 12px Inter, sans-serif';
          const textWidth = ctx.measureText(marker.label).width;
          const padding = 4;

          // Draw background rectangle
          ctx.fillStyle = 'rgba(18, 18, 18, 0.8)';
          ctx.fillRect(
            x - textWidth / 2 - padding,
            yAxis.top - 20,
            textWidth + padding * 2,
            16
          );

          // Draw text
          ctx.fillStyle = marker.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(marker.label, x, yAxis.top - 12);
          ctx.restore();
        });
      }
    }
  ];

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
    layout: {
      padding: {
        top: 30,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(18, 18, 18, 0.9)',
        titleColor: '#1db954',
        bodyColor: '#ffffff',
        borderColor: '#1db954',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            return `${context.parsed.y.toFixed(2)} c/kWh`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',  // Very subtle grid
          drawTicks: false
        },
        ticks: {
          display: false
        },
        title: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'  // Subtle horizontal grid
        },
        ticks: {
          color: '#b3b3b3',
          font: {
            size: 11
          },
          callback: (value) => {
            return `${value} c/kWh`;
          }
        },
        title: {
          display: false
        }
      }
    }
  };

  public lineChartType: ChartType = 'line';

  overview$: Observable<OverviewState> = this.trigger$.pipe(
    switchMap(() =>
      this.overviewService.getOverview().pipe(
        map((data): OverviewState => {
          // Prepare chart data from future price points
          this.prepareChartData(data.future.pricePoints);
          return { loading: false, data, error: null };
        }),
        catchError((err): Observable<OverviewState> => {
          console.error('[OverviewComponent] Error fetching overview:', err);

          const errorMessage = err.userMessage || 'Yleiskatsauksen lataaminen epäonnistui';

          return of({
            loading: false,
            data: null,
            error: errorMessage
          });
        }),
        startWith({ loading: true, data: null, error: null })
      )
    )
  );

  getOverview(): void {
    this.trigger$.next();
  }

  getPriceCategoryText(category: PriceCategory): string {
    return this.priceUtilities.getPriceCategoryText(category);
  }

  getPriceCssClass(category: PriceCategory): string {
    return this.priceUtilities.getPriceCssClass(category);
  }

  getPriceEmoji(category: PriceCategory): string {
    return this.priceUtilities.getPriceEmoji(category);
  }

  getCurrentPriceDescription(category: PriceCategory): string {
    switch (category) {
      case 'VERY_CHEAP':
        return 'Erinomainen hetki! Sähkö on erittäin halpaa juuri nyt.';
      case 'CHEAP':
        return 'Hyvä hetki! Sähkö on halpaa juuri nyt.';
      case 'NORMAL':
        return 'Sähkö on normaalihintaista juuri nyt.';
      case 'EXPENSIVE':
        return 'Sähkö on kallista juuri nyt. Harkitse odottamista.';
      case 'VERY_EXPENSIVE':
        return 'Sähkö on erittäin kallista juuri nyt. Odota halvempaa aikaa.';
      default:
        return '';
    }
  }

  private prepareChartData(pricePoints: PricePointDto[]): void {
    // Store first timestamp for reference line calculations
    if (pricePoints.length > 0) {
      this.firstTimestamp = new Date(pricePoints[0].startTime);
    }

    const labels = pricePoints.map(point => {
      const date = new Date(point.startTime);
      return date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    });

    const data = pricePoints.map(point => point.price);

    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          label: 'Sähkön hinta',
          borderColor: '#1db954',
          backgroundColor: 'rgba(29, 185, 84, 0.2)',
          pointBackgroundColor: '#1db954',
          pointBorderColor: '#1db954',
          pointHoverBackgroundColor: '#1ed760',
          pointHoverBorderColor: '#1ed760',
          pointRadius: 0,              // Hide points by default
          pointHoverRadius: 6,         // Show point on hover
          pointHitRadius: 10,          // Larger hit area for hover
          fill: true,
          tension: 0.4,                // Smooth curve
          borderWidth: 3               // Thicker line for better visibility
        }
      ]
    };

    // Update chart if it exists
    this.chart?.update();
  }
}
