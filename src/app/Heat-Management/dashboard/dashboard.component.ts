import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { WasteHeatService, Tank, Consumer } from '../services/waste-heat.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  public wasteHeat = inject(WasteHeatService);
  private router = inject(Router);

  // Radial Gauge Dashoffset calculation for Total Storage Level
  get gaugeDashOffset(): number {
    const circumference = 2 * Math.PI * 18; // radius = 18 => ~113.1
    const percentage = this.wasteHeat.systemLevelPercentage();
    return circumference - (percentage / 100) * circumference;
  }

  get activeChargingTank(): Tank | null {
    return this.wasteHeat.activeChargingTank();
  }

  get activeDischargingTanks(): Tank[] {
    return this.wasteHeat.tanks().filter(t => t.status === 'DISCHARGING');
  }

  get activeSupplyingConsumers(): Consumer[] {
    return this.wasteHeat.consumers().filter(c => c.status === 'RECEIVING');
  }

  getConsumersSuppliedByTank(tankId: number): Consumer[] {
    return this.wasteHeat.consumers().filter(c => c.status === 'RECEIVING' && c.activeSourceTankId === tankId);
  }

  isTankSupplyingAnyConsumer(tankId: number): boolean {
    return this.getConsumersSuppliedByTank(tankId).length > 0;
  }

  setHeatPreset(kw: number): void {
    this.wasteHeat.setHeatOutput(kw);
  }

  getTank(id: number | null): Tank | undefined {
    if (!id) return undefined;
    return this.wasteHeat.tanks().find(t => t.id === id);
  }

  getTankName(id: number | null): string {
    if (!id) return 'None';
    const t = this.getTank(id);
    return t ? t.name : `Tank 0${id}`;
  }

  toggleConsumerSupply(consumer: Consumer): void {
    this.wasteHeat.toggleSupply(consumer.id);
  }

  navigate(route: string): void {
    this.router.navigate([`/heatmanagement/${route}`]);
  }
}
