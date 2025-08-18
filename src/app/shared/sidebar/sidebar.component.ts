import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, AfterViewInit {
  user: any;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
  }

  ngAfterViewInit(): void {
    // Only initialize menu on desktop
    if (window.innerWidth >= 1200) {
      this.reinitializeSidebarMenu();
    }
    
    // Add resize listener
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1200) {
        this.reinitializeSidebarMenu();
      }
    });
  }

  reinitializeSidebarMenu(): void {
    setTimeout(() => {
      const layoutMenu = document.querySelector('#layout-menu');
      if (typeof (window as any).Menu !== 'undefined' && layoutMenu) {
        new (window as any).Menu(layoutMenu, {
          orientation: 'vertical',
          closeChildren: false,
        });
      }
    }, 50);
  }
}