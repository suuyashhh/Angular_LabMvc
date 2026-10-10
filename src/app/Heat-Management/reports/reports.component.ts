import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-4 font-sans">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#16253c] pb-3">
        <div>
          <div class="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span>Analytics & Audit &bull; Subsystem 04</span>
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-slate-100 tracking-tight mt-0.5">
            Energy Recovery & Carbon Abatement Reports
          </h2>
        </div>
        <button class="px-3 py-1.5 rounded bg-[#10233d] hover:bg-[#183257] text-[11px] font-mono font-bold text-slate-200 border border-[#1e3d67] flex items-center gap-2 self-start sm:self-auto transition">
          <i class="fa-solid fa-file-csv text-orange-400 text-xs"></i>
          <span>EXPORT CSV AUDIT</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
        <div class="p-4 rounded bg-[#0a1324] border border-[#182a44]">
          <span class="text-[10px] text-slate-400 font-bold uppercase">DAILY HEAT RECAPTURED</span>
          <div class="text-xl font-bold text-slate-100 mt-1">116.4 MWh</div>
          <div class="text-[10px] text-emerald-400 mt-1">&uarr; +8.2% vs baseline</div>
        </div>
        <div class="p-4 rounded bg-[#0a1324] border border-[#182a44]">
          <span class="text-[10px] text-slate-400 font-bold uppercase">CO2 EMISSIONS AVOIDED</span>
          <div class="text-xl font-bold text-emerald-400 mt-1">24.6 Metric Tons</div>
          <div class="text-[10px] text-slate-500 mt-1">Calculated per EPA factor</div>
        </div>
        <div class="p-4 rounded bg-[#0a1324] border border-[#182a44]">
          <span class="text-[10px] text-slate-400 font-bold uppercase">NET OFFSET SAVINGS</span>
          <div class="text-xl font-bold text-amber-400 mt-1">$8,420 / mo</div>
          <div class="text-[10px] text-slate-500 mt-1">Equivalent gas offset</div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {}
