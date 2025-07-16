import { Component, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements AfterViewInit {

  toggleSidebar(): void {
    if (window.innerWidth < 1200) {
      const layoutMenu = document.querySelector('#layout-menu');
      if (layoutMenu) {
        layoutMenu.classList.toggle('d-block');
        this.reinitializeSidebarMenu();
      }
    }
  }

  ngAfterViewInit(): void {
    this.reinitializeSidebarMenu();
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
