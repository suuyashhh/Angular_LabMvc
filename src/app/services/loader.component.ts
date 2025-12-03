import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from './loader.service';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="loader.loading$ | async" class="app-loader-overlay" aria-busy="true" aria-live="polite">
      <div class="app-loader-card" role="status" aria-label="Loading">
        <div class="loader-row">
          <span class="brand-spinner" aria-hidden="true"></span>
          <span class="loader-text">Please wait…</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host{
      /* Brand colors (tweak once, used everywhere) */
      --brand: #8c57ff;
      --brand-2: #6b46ff;
      --brand-3: #a37bff;
      --overlay: rgba(17, 12, 28, 0.35); /* soft dim */
    }

    /* Fullscreen overlay that blurs & blocks everything */
    .app-loader-overlay{
      position: fixed; inset: 0; z-index: 2000;
      display: grid; place-items: center;
      background: var(--overlay);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      pointer-events: auto;           /* capture clicks */
    }

    /* Frosted glass card with soft brand glow */
    .app-loader-card{
      display: inline-flex;
      align-items: center;
      border-radius: 14px;
      padding: 14px 18px;
      background:
        radial-gradient(120% 120% at 0% 0%, rgba(140,87,255,0.08), transparent 55%),
        rgba(255,255,255,0.92);
      border: 1px solid rgba(140,87,255,0.18);
      box-shadow:
        0 20px 40px rgba(0,0,0,0.18),
        0 0 0 6px rgba(140,87,255,0.06); /* subtle brand aura */
      backdrop-filter: blur(2px);
    }

    /* Single row: spinner + text */
    .loader-row{
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }

    /* Custom brand spinner (CSS animation, smoother than default) */
    .brand-spinner{
      width: 28px; height: 28px;
      border-radius: 999px;
      border: 3px solid transparent;
      border-top-color: var(--brand);
      border-right-color: var(--brand-2);
      animation: spin .8s linear infinite;
      filter: drop-shadow(0 2px 6px rgba(140,87,255,.35));
    }

    .loader-text{
      font-weight: 600;
      font-size: 0.985rem;
      color: var(--brand-2);
      letter-spacing: .2px;
      white-space: nowrap;
      user-select: none;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* High-contrast fallback if backdrop-filter not supported */
    @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .app-loader-overlay{ background: rgba(17, 12, 28, 0.55); }
    }
  `]
})
export class LoaderComponent {
    constructor(public loader: LoaderService) { }
}
