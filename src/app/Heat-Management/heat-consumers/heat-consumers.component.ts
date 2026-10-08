import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-heat-consumers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-4 font-sans">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#16253c] pb-3">
        <div>
          <div class="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
            <span>Secondary Distribution &bull; Thermal Loops</span>
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-slate-100 tracking-tight mt-0.5">
            Industrial Waste-Heat Consumers & Thermal Loops
          </h2>
        </div>
        <span class="px-2.5 py-1 rounded bg-[#07101e] border border-[#172840] text-xs font-mono font-bold text-emerald-400 self-start sm:self-auto">
          TOTAL RECLAIMED: 4.85 MW
        </span>
      </div>

      <!-- Consumer Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
        <div class="bg-[#0a1324] border border-[#182a44] rounded p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-100 uppercase">District Heating Loop A</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-[#061814] text-emerald-400 font-bold border border-emerald-500/30">ONLINE</span>
          </div>
          <p class="text-[11px] font-sans text-slate-400">Municipal grid feed providing residential space heating.</p>
          <div class="pt-2 border-t border-[#14233a] text-[11px] flex justify-between">
            <span class="text-slate-500">FLOW: 180 m³/h</span>
            <span class="text-amber-400 font-bold">2.4 MW</span>
          </div>
        </div>

        <div class="bg-[#0a1324] border border-[#182a44] rounded p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-100 uppercase">Absorption Chiller Unit</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-[#061814] text-emerald-400 font-bold border border-emerald-500/30">ACTIVE</span>
          </div>
          <p class="text-[11px] font-sans text-slate-400">Thermally driven chiller converting extracted waste heat into chilled water.</p>
          <div class="pt-2 border-t border-[#14233a] text-[11px] flex justify-between">
            <span class="text-slate-500">COP: 0.82</span>
            <span class="text-sky-400 font-bold">1.2 MW</span>
          </div>
        </div>

        <div class="bg-[#0a1324] border border-[#182a44] rounded p-3.5 space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-100 uppercase">Domestic Hot Water (DHW)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-[#061814] text-emerald-400 font-bold border border-emerald-500/30">ACTIVE</span>
          </div>
          <p class="text-[11px] font-sans text-slate-400">Preheating service water for factory sanitization and clean loops.</p>
          <div class="pt-2 border-t border-[#14233a] text-[11px] flex justify-between">
            <span class="text-slate-500">&Delta;T: +42 °C</span>
            <span class="text-amber-400 font-bold">1.25 MW</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HeatConsumersComponent {}
