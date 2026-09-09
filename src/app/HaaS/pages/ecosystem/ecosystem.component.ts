import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaaSService } from '../../services/haas.service';
import { EcosystemDemand, HeatAllocation, OptimizationRequest, SEASONS, ECOSYSTEMS } from '../../models/interfaces';

@Component({
  selector: 'app-haas-ecosystem',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ecosystem.component.html'
})
export class HaaSEcosystemComponent implements OnInit {
  demands: EcosystemDemand[] = [];
  allocation: HeatAllocation | null = null;

  selectedSeason = 1;
  outsideTemp = 15;
  powerOverride = 0;
  forceDischarge = false;

  isLoading = false;
  isOptimizing = false;
  saveSuccess: { [key: number]: boolean } = {};
  errorMsg = '';

  seasons = SEASONS;
  ecosystems = ECOSYSTEMS;

  constructor(private haas: HaaSService) {}

  ngOnInit(): void {
    this.loadDemands();
  }

  loadDemands(): void {
    this.isLoading = true;
    this.haas.getDemandsBySeason(this.selectedSeason).subscribe({
      next: (d) => { this.demands = d; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  onSeasonChange(): void {
    this.loadDemands();
    this.allocation = null;
  }

  getEcoMeta(ecosystemType: number) {
    return ECOSYSTEMS.find(e => e.type === ecosystemType) ?? ECOSYSTEMS[0];
  }

  saveDemand(demand: EcosystemDemand): void {
    this.haas.upsertDemand(demand).subscribe({
      next: () => {
        this.saveSuccess[demand.demand_ID] = true;
        setTimeout(() => { this.saveSuccess[demand.demand_ID] = false; }, 2000);
      },
      error: () => { this.errorMsg = 'Failed to save. Check backend.'; }
    });
  }

  runOptimization(): void {
    this.isOptimizing = true;
    const req: OptimizationRequest = {
      overridePowerKW: this.powerOverride,
      seasonType: this.selectedSeason,
      outsideTemperatureCelsius: this.outsideTemp,
      forceStorageDischarge: this.forceDischarge
    };
    this.haas.runOptimization(req).subscribe({
      next: (r) => { this.allocation = r; this.isOptimizing = false; },
      error: () => { this.errorMsg = 'Optimization failed.'; this.isOptimizing = false; }
    });
  }

  getAllocatedKW(ecosystemName: string): number {
    if (!this.allocation) return 0;
    const n = ecosystemName.toLowerCase();
    if (n.includes('district'))  return this.allocation.district_HEATING_ALLOCATED_KW;
    if (n.includes('agric'))     return this.allocation.agriculture_ALLOCATED_KW;
    if (n.includes('storage'))   return this.allocation.thermal_STORAGE_ALLOCATED_KW;
    if (n.includes('indust'))    return this.allocation.industry_ALLOCATED_KW;
    return 0;
  }

  getFillPercent(allocated: number, demand: number): number {
    if (!demand) return 0;
    return Math.min((allocated / demand) * 100, 100);
  }

  seedDefaults(): void {
    this.haas.seedDefaultDemands().subscribe({
      next: () => this.loadDemands(),
      error: () => {}
    });
  }
}
