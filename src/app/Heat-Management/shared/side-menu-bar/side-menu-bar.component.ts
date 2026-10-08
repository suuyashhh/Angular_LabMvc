import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
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
  @Input() isCollapsed = false;
  @Output() collapseChange = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fa-solid fa-house',
      route: '/heatmanagement/dashboard'
    },
    {
      id: 'data-server',
      label: 'Data Server',
      icon: 'fa-solid fa-server',
      route: '/heatmanagement/data-server'
    },
    {
      id: 'thermal-storage',
      label: 'Thermal Storage',
      icon: 'fa-solid fa-box-archive',
      route: '/heatmanagement/thermal-storage'
    },
    {
      id: 'heat-consumers',
      label: 'Heat Consumers',
      icon: 'fa-solid fa-industry',
      route: '/heatmanagement/heat-consumers'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'fa-solid fa-chart-line',
      route: '/heatmanagement/reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'fa-solid fa-gear',
      route: '/heatmanagement/settings'
    }
  ];

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapseChange.emit(this.isCollapsed);
  }
}
