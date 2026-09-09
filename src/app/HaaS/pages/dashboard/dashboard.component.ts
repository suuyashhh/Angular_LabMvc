import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaaSService } from '../../services/haas.service';
import {
  DataCenterMetrics,
  EcosystemDemand,
  HeatAllocation,
  ThermalStorageStatus,
  SEASONS,
  ECOSYSTEMS,
  OptimizationRequest
} from '../../models/interfaces';

@Component({
  selector: 'app-haas-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class HaaSDashboardComponent implements OnInit, OnDestroy {
  metrics: DataCenterMetrics | null = null;
  allocation: HeatAllocation | null = null;
  storage: ThermalStorageStatus | null = null;
  demands: EcosystemDemand[] = [];

  selectedSeason = 1;
  outsideTemp = 15;
  isLoading = false;
  isOptimizing = false;
  errorMsg = '';

  seasons = SEASONS;
  ecosystems = ECOSYSTEMS;

  private autoRefreshInterval: any;

  constructor(private haas: HaaSService) {}

  ngOnInit(): void {
    this.loadDashboard();
    // Auto-refresh every 30s
    this.autoRefreshInterval = setInterval(() => this.loadDashboard(), 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.autoRefreshInterval);
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMsg = '';

    this.haas.getLatestMetrics().subscribe({
      next: (m) => { this.metrics = m; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });

    this.haas.getStorageStatus().subscribe({
      next: (s) => this.storage = s,
      error: () => {}
    });

    this.haas.getDemandsBySeason(this.selectedSeason).subscribe({
      next: (d) => this.demands = d,
      error: () => {}
    });
  }

  runOptimization(): void {
    this.isOptimizing = true;
    const req: OptimizationRequest = {
      overridePowerKW: 0,
      seasonType: this.selectedSeason,
      outsideTemperatureCelsius: this.outsideTemp,
      forceStorageDischarge: false
    };

    this.haas.runOptimization(req).subscribe({
      next: (result) => {
        this.allocation = result;
        this.isOptimizing = false;
        // Refresh metrics and storage after optimization
        this.loadDashboard();
      },
      error: (err) => {
        this.errorMsg = 'Optimization failed. Check backend connection.';
        this.isOptimizing = false;
      }
    });
  }

  onSeasonChange(): void {
    this.haas.getDemandsBySeason(this.selectedSeason).subscribe({
      next: (d) => this.demands = d,
      error: () => {}
    });
  }

  getSeasonLabel(val: number): string {
    return this.seasons.find(s => s.value === val)?.label ?? '';
  }

  getSeasonIcon(val: number): string {
    return this.seasons.find(s => s.value === val)?.icon ?? '';
  }

  getEcosystemColor(name: string): string {
    return ECOSYSTEMS.find(e =>
      e.name.replace(' ', '').toLowerCase() === name.replace(' ', '').toLowerCase()
    )?.color ?? '#64748b';
  }

  getAllocatedForEco(name: string): number {
    if (!this.allocation) return 0;
    const n = name.toLowerCase().replace(' ', '');
    if (n.includes('district'))  return this.allocation.district_HEATING_ALLOCATED_KW;
    if (n.includes('agric'))     return this.allocation.agriculture_ALLOCATED_KW;
    if (n.includes('storage'))   return this.allocation.thermal_STORAGE_ALLOCATED_KW;
    if (n.includes('indust'))    return this.allocation.industry_ALLOCATED_KW;
    return 0;
  }

  getDemandForEco(name: string): number {
    const d = this.demands.find(d =>
      d.ecosystem_NAME.toLowerCase().includes(name.toLowerCase().substring(0, 5))
    );
    return d?.demand_VALUE_KW ?? 0;
  }

  getStorageStateClass(): string {
    if (!this.storage) return 'state-idle';
    const s = this.storage.state;
    if (s === 1) return 'state-charging';
    if (s === 2) return 'state-discharging';
    return 'state-idle';
  }

  getStorageStateLabel(): string {
    return this.storage?.state_NAME ?? 'N/A';
  }
}
