import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" id="nav-dashboard">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span class="nav-label">Dashboard</span>
      </a>

      <a routerLink="/billing" routerLinkActive="active" class="nav-item" id="nav-billing">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span class="nav-label">Billing</span>
      </a>

      <a routerLink="/entries" routerLinkActive="active" class="nav-item" id="nav-entries">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        <span class="nav-label">Entries</span>
      </a>

      <a routerLink="/food-master" routerLinkActive="active" class="nav-item" id="nav-food-master">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8h1a4 4 0 010 8h-1"/>
          <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
        <span class="nav-label">Food Master</span>
      </a>

      <a routerLink="/printer" routerLinkActive="active" class="nav-item" id="nav-printer">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6,9 6,2 18,2 18,9"/>
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        <span class="nav-label">Printer</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--nav-height);
      background: var(--color-white);
      display: flex;
      align-items: center;
      justify-content: space-around;
      box-shadow: 0 -2px 16px rgba(44, 24, 16, 0.08);
      z-index: 50;
      padding: 0 4px;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border-radius: 12px;
      color: var(--color-text-secondary);
      transition: all 0.2s ease;
      text-decoration: none;
      min-width: 60px;
    }

    .nav-item:hover {
      color: var(--color-primary);
      background: var(--color-primary-lighter);
    }

    .nav-item.active {
      color: var(--color-primary);
    }

    .nav-item.active .nav-icon {
      stroke: var(--color-primary);
    }

    .nav-item.active .nav-label {
      color: var(--color-primary);
      font-weight: 700;
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      stroke: currentColor;
    }

    .nav-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  `]
})
export class BottomNavComponent {}
