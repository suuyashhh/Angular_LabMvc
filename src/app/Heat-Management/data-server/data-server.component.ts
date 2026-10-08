import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-server',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './data-server.component.html',
  styleUrl: './data-server.component.css'
})
export class DataServerComponent {
  // Heat Output Power in kW (0 to 5 kW)
  heatOutput = 1.0;

  // Duration in seconds: 5 or 300 (5 mins)
  durationSeconds = 300;

  // Preset power options
  powerPresets = [
    { label: '0 kW (Idle)', value: 0 },
    { label: '1kW (Default)', value: 1.0 },
    { label: '2.5 kW', value: 2.5 },
    { label: '4 kW', value: 4.0 },
    { label: '5 kW', value: 5.0 }
  ];

  setPreset(val: number): void {
    this.heatOutput = val;
  }

  setDuration(sec: number): void {
    this.durationSeconds = sec;
  }

  // Calculated values
  get temperature(): number {
    if (this.heatOutput === 0) return 38;
    return Math.round(40 + (this.heatOutput / 5.0) * 55); // 40°C to 95°C
  }

  get energyKJ(): number {
    // Energy (kJ) = Power (kW) * Time (s)
    return parseFloat((this.heatOutput * this.durationSeconds).toFixed(1));
  }

  get energyKWh(): string {
    // 1 kWh = 3600 kJ
    const kwh = this.energyKJ / 3600;
    return kwh.toFixed(5);
  }

  get statusText(): string {
    return this.heatOutput > 0 ? 'Active' : 'Idle';
  }

  get energyPercent(): number {
    // Max capacity in 5 mins at 5kW is 1500 kJ
    const maxKJ = 5.0 * 300;
    return Math.min(100, Math.max(5, (this.energyKJ / maxKJ) * 100));
  }
}
