import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaaSService } from '../../services/haas.service';
import { EcosystemDemand, DataCenterMetrics, SEASONS, ECOSYSTEMS } from '../../models/interfaces';

interface HourlyPoint {
  hour: number;
  label: string;
  districtKW: number;
  agricultureKW: number;
  industryKW: number;
  storageKW: number;
  supplyKW: number;
}

@Component({
  selector: 'app-haas-forecasting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forecasting.component.html'
})
export class HaaSForecastingComponent implements OnInit {
  hourlyData: HourlyPoint[] = [];
  metricsHistory: DataCenterMetrics[] = [];
  allDemandsWinter: EcosystemDemand[] = [];
  allDemandsSummer: EcosystemDemand[] = [];

  compareSeason1 = 1; // Winter
  compareSeason2 = 3; // Summer
  selectedView: 'hourly' | 'compare' | 'history' = 'hourly';

  seasons = SEASONS;
  ecosystems = ECOSYSTEMS;
  isLoading = false;

  constructor(private haas: HaaSService) {}

  ngOnInit(): void {
    this.generateHourlyForecast();
    this.loadSeasonComparison();
    this.loadHistory();
  }

  /** Generate synthetic hourly demand patterns for a 24h day */
  generateHourlyForecast(): void {
    this.hourlyData = [];
    for (let h = 0; h < 24; h++) {
      // District heating peaks at 7am and 6pm (morning warm-up & evening)
      const districtFactor = 0.3 + 0.5 * (Math.exp(-0.5 * Math.pow((h - 7) / 2, 2)) +
                                            Math.exp(-0.5 * Math.pow((h - 18) / 2, 2)));
      // Agriculture constant 60–80% with slight midday dip
      const agricultureFactor = 0.6 + 0.2 * Math.exp(-0.5 * Math.pow((h - 12) / 3, 2));
      // Industry constant 90% with 2am maintenance dip
      const industryFactor = 0.9 - 0.2 * Math.exp(-0.5 * Math.pow((h - 2) / 1.5, 2));
      // Supply peaks at 10am–4pm (peak server load)
      const supplyFactor = 0.7 + 0.3 * Math.exp(-0.5 * Math.pow((h - 13) / 3, 2));

      this.hourlyData.push({
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        districtKW:    Math.round(450 * districtFactor),
        agricultureKW: Math.round(180 * agricultureFactor),
        industryKW:    Math.round(250 * industryFactor),
        storageKW:     Math.round(100 + 200 * (1 - supplyFactor)),
        supplyKW:      Math.round(800 * supplyFactor)
      });
    }
  }

  loadSeasonComparison(): void {
    this.haas.getDemandsBySeason(1).subscribe({ next: d => this.allDemandsWinter = d });
    this.haas.getDemandsBySeason(3).subscribe({ next: d => this.allDemandsSummer = d });
  }

  loadHistory(): void {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000); // last 24h
    this.haas.getMetricsHistory(from.toISOString(), to.toISOString()).subscribe({
      next: (h) => this.metricsHistory = h.slice(0, 20),
      error: () => {}
    });
  }

  getEcoColor(type: number): string {
    return ECOSYSTEMS.find(e => e.type === type)?.color ?? '#64748b';
  }

  getWinterDemand(ecoType: number): number {
    return this.allDemandsWinter.find(d => d.ecosystem_TYPE === ecoType)?.demand_VALUE_KW ?? 0;
  }

  getSummerDemand(ecoType: number): number {
    return this.allDemandsSummer.find(d => d.ecosystem_TYPE === ecoType)?.demand_VALUE_KW ?? 0;
  }

  getMaxHourly(): number {
    return Math.max(...this.hourlyData.map(h => h.supplyKW), 1);
  }

  getBarPercent(val: number): number {
    return Math.min((val / this.getMaxHourly()) * 100, 100);
  }

  getEcoBarHeight(val: number): number {
    const maxDemand = 500;
    return Math.min((val / maxDemand) * 100, 100);
  }

  getMaxHistory(): number {
    return Math.max(...this.metricsHistory.map(m => m.waste_HEAT_GENERATED_KW), 1);
  }
}
