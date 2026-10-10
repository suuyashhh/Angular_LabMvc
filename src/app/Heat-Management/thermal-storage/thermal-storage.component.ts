import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WasteHeatService, Tank, AllocationMode } from '../services/waste-heat.service';

@Component({
  selector: 'app-thermal-storage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './thermal-storage.component.html',
  styleUrl: './thermal-storage.component.css'
})
export class ThermalStorageComponent {
  public wasteHeat = inject(WasteHeatService);
  private router = inject(Router);

  // Modal states
  showCapacityModal = false;
  showResetModal = false;

  // Form models for capacity modal
  tankCapacities: { [key: number]: number } = {
    1: 10,
    2: 20,
    3: 15,
    4: 25
  };
  capacityError = '';

  setAllocationMode(mode: AllocationMode): void {
    this.wasteHeat.setAllocationMode(mode);
  }

  selectManualTank(tankId: number): void {
    this.wasteHeat.selectManualTank(tankId);
  }

  selectTankToStore(tankId: number): void {
    this.wasteHeat.selectManualTank(tankId);
  }

  setSpeed(speed: number): void {
    this.wasteHeat.setSimulationSpeed(speed);
  }

  setDuration(sec: number): void {
    this.wasteHeat.setDuration(sec);
  }

  // Priority order manipulation
  movePriorityLeft(index: number): void {
    if (index <= 0) return;
    const current = [...this.wasteHeat.priorityOrder()];
    const temp = current[index];
    current[index] = current[index - 1];
    current[index - 1] = temp;
    this.wasteHeat.setPriorityOrder(current);
  }

  movePriorityRight(index: number): void {
    const current = [...this.wasteHeat.priorityOrder()];
    if (index >= current.length - 1) return;
    const temp = current[index];
    current[index] = current[index + 1];
    current[index + 1] = temp;
    this.wasteHeat.setPriorityOrder(current);
  }

  getTank(id: number): Tank | undefined {
    return this.wasteHeat.tanks().find(t => t.id === id);
  }

  // Capacity Modal Management
  openCapacityModal(): void {
    this.capacityError = '';
    const tanks = this.wasteHeat.tanks();
    tanks.forEach(t => {
      this.tankCapacities[t.id] = t.capacityKwh;
    });
    this.showCapacityModal = true;
  }

  saveCapacities(): void {
    for (let i = 1; i <= 4; i++) {
      const val = Number(this.tankCapacities[i]);
      if (isNaN(val) || val < 1 || val > 200) {
        this.capacityError = `Tank 0${i} capacity must be between 1 and 200 kWh`;
        return;
      }
    }
    this.capacityError = '';
    this.wasteHeat.updateTankCapacities(this.tankCapacities);
    this.showCapacityModal = false;
  }

  closeCapacityModal(): void {
    this.showCapacityModal = false;
  }

  // Reset Modal Management
  openResetModal(): void {
    this.showResetModal = true;
  }

  confirmReset(): void {
    this.wasteHeat.resetStorage();
    this.showResetModal = false;
  }

  closeResetModal(): void {
    this.showResetModal = false;
  }

  navigate(route: string): void {
    this.router.navigate([`/heatmanagement/${route}`]);
  }
}