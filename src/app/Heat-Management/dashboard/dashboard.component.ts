import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  currentTime = new Date();

  // Overview stats
  stats = [
    { title: 'Active Furnaces', value: '4 / 5', change: '80% Capacity', icon: 'fa-fire', color: 'orange' },
    { title: 'Avg Core Temp', value: '845 °C', change: '+12 °C vs target', icon: 'fa-temperature-high', color: 'red' },
    { title: 'Power Consumption', value: '1.28 MW', change: 'Optimal load', icon: 'fa-bolt', color: 'amber' },
    { title: 'Batches Processed', value: '24 Today', change: '100% Quality Pass', icon: 'fa-circle-check', color: 'emerald' }
  ];

  // Sample active units
  furnaceUnits = [
    { id: 'FN-01', name: 'Primary Induction Furnace', temp: '920 °C', target: '900 °C', status: 'Active', power: '340 kW', state: 'normal' },
    { id: 'FN-02', name: 'Vacuum Heat Treater A', temp: '815 °C', target: '820 °C', status: 'Active', power: '290 kW', state: 'normal' },
    { id: 'FN-03', name: 'Annealing Chamber B', temp: '680 °C', target: '680 °C', status: 'Stabilized', power: '210 kW', state: 'normal' },
    { id: 'FN-04', name: 'Quench & Temper Unit', temp: '450 °C', target: '450 °C', status: 'Cooling', power: '180 kW', state: 'cooling' },
    { id: 'FN-05', name: 'Secondary Pre-heater', temp: '25 °C', target: '300 °C', status: 'Standby', power: '0 kW', state: 'standby' }
  ];

  constructor(private router: Router) {}

  logout(): void {
    this.router.navigate(['/heatmanagement']);
  }
}
