import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  route: string;
}

@Component({
  selector: 'app-side-menu-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-menu-bar.component.html',
  styleUrl: './side-menu-bar.component.css'
})
export class SideMenuBarComponent {
  
  @Input() isCollapsed: boolean = false;
  @Input() isMobileOpen: boolean = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() closeMobile = new EventEmitter<void>();

  navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'home',
      route: '/heatmanagement/dashboard'
    },
    {
      id: 'data-server',
      label: 'Data Server',
      icon: 'server',
      route: '/heatmanagement/data-server'
    },
    {
      id: 'thermal-storage',
      label: 'Thermal Storage',
      icon: 'cylinder',
      route: '/heatmanagement/thermal-storage'
    },
    {
      id: 'heat-consumers',
      label: 'Heat Consumers',
      icon: 'consumer',
      route: '/heatmanagement/heat-consumers'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'reports',
      route: '/heatmanagement/reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: '/heatmanagement/settings'
    }
  ];

  onNavClick(): void {
    this.closeMobile.emit();
  }

  onToggle(): void {
    this.toggleCollapse.emit();
  }
}
