import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-4 font-sans max-w-4xl">
      <div class="border-b border-[#16253c] pb-3">
        <div class="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
          <i class="fa-solid fa-sliders text-xs"></i>
          <span>SCADA Gateway Configuration &bull; Node 01</span>
        </div>
        <h2 class="text-lg sm:text-xl font-bold text-slate-100 tracking-tight mt-0.5">
          System & Telemetry Settings
        </h2>
      </div>

      <div class="bg-[#0a1324] border border-[#182a44] rounded p-4 space-y-4 font-mono">
        <div>
          <h3 class="text-xs font-bold text-slate-100 uppercase tracking-wide">Gateway Telemetry Polling Rate</h3>
          <p class="text-[11px] font-sans text-slate-400 mt-0.5">Set real-time sensor refresh interval for server rack thermal nodes.</p>
          <div class="mt-2.5 flex flex-wrap gap-2 text-[11px]">
            <button class="px-2.5 py-1 rounded bg-[#10233d] border border-[#25466e] text-white font-bold">1 Second (High Precision)</button>
            <button class="px-2.5 py-1 rounded bg-[#070e1c] border border-[#15243a] text-slate-400 hover:text-slate-200">5 Seconds (Balanced)</button>
            <button class="px-2.5 py-1 rounded bg-[#070e1c] border border-[#15243a] text-slate-400 hover:text-slate-200">10 Seconds (Low Bandwidth)</button>
          </div>
        </div>

        <div class="pt-3 border-t border-[#14233a]">
          <h3 class="text-xs font-bold text-slate-100 uppercase tracking-wide">Critical Overheat Trip Threshold</h3>
          <p class="text-[11px] font-sans text-slate-400 mt-0.5">Trigger automatic heat bypass valves if exhaust exceeds safety limit.</p>
          <div class="mt-2.5 flex items-center gap-2">
            <input type="number" value="95" class="px-2.5 py-1 rounded bg-[#070e1c] border border-[#15243a] text-slate-100 font-bold w-20 text-xs focus:outline-none focus:border-orange-500 font-mono">
            <span class="text-xs text-slate-400 font-bold">°C</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {}
