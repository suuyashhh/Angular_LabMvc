import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WasteHeatService } from '../services/waste-heat.service';

@Component({
  selector: 'app-data-server',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './data-server.component.html',
  styleUrl: './data-server.component.css'
})
export class DataServerComponent {
  public wasteHeat = inject(WasteHeatService);
  private router = inject(Router);

  powerPresets = [
    { label: '0 kW (Idle)', value: 0 },
    { label: '1 kW (Default)', value: 1.0 },
    { label: '2.5 kW', value: 2.5 },
    { label: '4 kW', value: 4.0 },
    { label: '5 kW', value: 5.0 }
  ];

  get heatRatio(): number {
    return Math.min(1, Math.max(0, this.wasteHeat.heatOutputKw() / 5.0));
  }

  get fanSpeedSeconds(): number {
    const ratio = this.heatRatio;
    if (ratio <= 0) return 0;
    return parseFloat((1.8 - ratio * 1.35).toFixed(2));
  }

  get particleSpeedSeconds(): number {
    const ratio = this.heatRatio;
    if (ratio <= 0) return 0;
    return parseFloat((2.8 - ratio * 1.9).toFixed(2));
  }

  setHeatOutput(val: number): void {
    this.wasteHeat.setHeatOutput(val);
  }

  setDuration(sec: number): void {
    this.wasteHeat.setDuration(sec);
  }

  get energyPercent(): number {
    const maxKJ = 5.0 * 300;
    return Math.min(
      100,
      Math.max(5, (this.wasteHeat.energyStoredKJ() / maxKJ) * 100)
    );
  }

  navigateToStorage(): void {
    this.router.navigate(['/heatmanagement/thermal-storage']);
  }
}
