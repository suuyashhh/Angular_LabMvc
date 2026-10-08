import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-thermal-storage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-4 font-sans">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#16253c] pb-3">
        <div>
          <div class="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Thermal Storage Array &bull; Subsystem 02</span>
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-slate-100 tracking-tight mt-0.5">
            Phase Change & Stratified Heat Buffer Tanks
          </h2>
        </div>
        <div class="flex items-center gap-2 font-mono">
          <span class="px-2.5 py-1 rounded bg-[#07101e] border border-[#172840] text-[11px] text-slate-300">
            TOTAL CAPACITY: <strong class="text-amber-400">12,500 kWh</strong>
          </span>
        </div>
      </div>

      <!-- Storage Tank Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <!-- Tank 01 -->
        <div class="bg-[#0a1324] border border-[#182a44] rounded p-4 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-[#14233a] font-mono">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-400"></span>
              <span class="text-xs font-bold text-slate-100 uppercase">Buffer Tank 01 (Primary PCM)</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-[#061814] border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              CHARGING
            </span>
          </div>

          <!-- Tank Telemetry Grid -->
          <div class="grid grid-cols-2 gap-2 font-mono">
            <div class="p-2.5 rounded bg-[#070e1c] border border-[#15243a]">
              <div class="text-[10px] text-slate-400">CHARGE LEVEL</div>
              <div class="text-lg font-bold text-slate-100 mt-0.5">82.4% <span class="text-[10px] text-slate-400 font-normal">(5,150 kWh)</span></div>
            </div>
            <div class="p-2.5 rounded bg-[#070e1c] border border-[#15243a]">
              <div class="text-[10px] text-slate-400">CORE FLUID TEMP</div>
              <div class="text-lg font-bold text-amber-400 mt-0.5">78.5 °C</div>
            </div>
          </div>

          <!-- Stratification Gauge -->
          <div class="space-y-1 font-mono">
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>STRATIFICATION DEPTH</span>
              <span class="text-slate-200">3.8 / 4.5 M</span>
            </div>
            <div class="w-full bg-[#070e1c] border border-[#15243a] h-2 rounded-[2px] overflow-hidden">
              <div class="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-[1px]" style="width: 82.4%;"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono">
            <div class="p-2 rounded bg-[#070e1c] border border-[#15243a]">
              <span class="text-slate-500">INFLOW:</span>
              <span class="text-slate-200 font-bold ml-1">+1.25 kW (Server Rack)</span>
            </div>
            <div class="p-2 rounded bg-[#070e1c] border border-[#15243a]">
              <span class="text-slate-500">DISCHARGE:</span>
              <span class="text-slate-200 font-bold ml-1">Pre-heater Valve #2</span>
            </div>
          </div>
        </div>

        <!-- Tank 02 -->
        <div class="bg-[#0a1324] border border-[#182a44] rounded p-4 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-[#14233a] font-mono">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span class="text-xs font-bold text-slate-100 uppercase">Buffer Tank 02 (Secondary Water)</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-[#071526] border border-cyan-500/30 text-cyan-400 text-[10px] font-bold">
              STANDBY
            </span>
          </div>

          <!-- Tank Telemetry Grid -->
          <div class="grid grid-cols-2 gap-2 font-mono">
            <div class="p-2.5 rounded bg-[#070e1c] border border-[#15243a]">
              <div class="text-[10px] text-slate-400">CHARGE LEVEL</div>
              <div class="text-lg font-bold text-slate-100 mt-0.5">64.0% <span class="text-[10px] text-slate-400 font-normal">(4,000 kWh)</span></div>
            </div>
            <div class="p-2.5 rounded bg-[#070e1c] border border-[#15243a]">
              <div class="text-[10px] text-slate-400">CORE FLUID TEMP</div>
              <div class="text-lg font-bold text-cyan-400 mt-0.5">62.0 °C</div>
            </div>
          </div>

          <!-- Stratification Gauge -->
          <div class="space-y-1 font-mono">
            <div class="flex justify-between text-[10px] text-slate-400">
              <span>STRATIFICATION DEPTH</span>
              <span class="text-slate-200">2.9 / 4.5 M</span>
            </div>
            <div class="w-full bg-[#070e1c] border border-[#15243a] h-2 rounded-[2px] overflow-hidden">
              <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-[1px]" style="width: 64%;"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono">
            <div class="p-2 rounded bg-[#070e1c] border border-[#15243a]">
              <span class="text-slate-500">INFLOW:</span>
              <span class="text-slate-200 font-bold ml-1">0.00 kW (Standby)</span>
            </div>
            <div class="p-2 rounded bg-[#070e1c] border border-[#15243a]">
              <span class="text-slate-500">DISCHARGE:</span>
              <span class="text-slate-200 font-bold ml-1">District Network A</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ThermalStorageComponent {}
