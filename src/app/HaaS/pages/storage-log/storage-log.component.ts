import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaaSService } from '../../services/haas.service';
import { ThermalStorageStatus, OptimizationLog } from '../../models/interfaces';

@Component({
  selector: 'app-haas-storage-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './storage-log.component.html'
})
export class HaaSStorageLogComponent implements OnInit {
  currentStorage: ThermalStorageStatus | null = null;
  storageHistory: ThermalStorageStatus[] = [];
  optimizationLogs: OptimizationLog[] = [];

  logFilter = '';
  dateFrom = '';
  dateTo = '';
  logLimit = 50;
  activeTab: 'logs' | 'history' = 'logs';
  isLoading = false;

  constructor(private haas: HaaSService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.haas.getStorageStatus().subscribe({
      next: (s) => { this.currentStorage = s; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
    this.haas.getStorageHistory(20).subscribe({
      next: (h) => this.storageHistory = h,
      error: () => {}
    });
    this.loadLogs();
  }

  loadLogs(): void {
    const from = this.dateFrom ? new Date(this.dateFrom).toISOString() : undefined;
    const to   = this.dateTo   ? new Date(this.dateTo).toISOString()   : undefined;
    this.haas.getOptimizationLogs(from, to, this.logLimit).subscribe({
      next: (logs) => this.optimizationLogs = logs,
      error: () => {}
    });
  }

  get filteredLogs(): OptimizationLog[] {
    if (!this.logFilter.trim()) return this.optimizationLogs;
    const q = this.logFilter.toLowerCase();
    return this.optimizationLogs.filter(l =>
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.target_ECOSYSTEM?.toLowerCase().includes(q) ||
      l.status.toLowerCase().includes(q)
    );
  }

  getStateClass(state: number): string {
    if (state === 1) return 'state-charging';
    if (state === 2) return 'state-discharging';
    return 'state-idle';
  }

  getStatusClass(status: string): string {
    if (status === 'SUCCESS') return 'status-success';
    if (status === 'PARTIAL') return 'status-partial';
    return 'status-deficit';
  }

  getActionIcon(action: string): string {
    if (action.includes('STORAGE')) return '🔋';
    if (action.includes('DISTRICT')) return '🏘️';
    if (action.includes('AGRIC')) return '🌿';
    if (action.includes('INDUSTRY')) return '🏭';
    if (action.includes('DISCHARGE')) return '⬇️';
    return '⚡';
  }

  getTankArcPath(): string {
    // SVG arc for the gauge fill (not used in CSS approach, keep for future enhancement)
    return '';
  }

  get chargePercent(): number {
    return this.currentStorage?.charge_PERCENTAGE ?? 0;
  }

  /** CSS-based gauge offset (stroke-dashoffset for SVG circle) */
  get gaugeOffset(): number {
    const circumference = 2 * Math.PI * 70;
    return circumference - (this.chargePercent / 100) * circumference;
  }

  get gaugeCircumference(): number {
    return 2 * Math.PI * 70;
  }
}
