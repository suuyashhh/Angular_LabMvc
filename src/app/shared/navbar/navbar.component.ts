import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  toggleSidebar(): void {
  if (window.innerWidth < 1200) { // Example breakpoint for mobile
    const layoutMenu = document.querySelector('#layout-menu');
    if (layoutMenu) {
      layoutMenu.classList.toggle('d-block');
      this.reinitializeSidebarMenu();
    }
  }
}

ngAfterViewInit(): void {
    // Trigger menu.js logic again
    this.reinitializeSidebarMenu();
  }

  reinitializeSidebarMenu(): void {
  // Wait for DOM to update, especially after route change or sidebar toggle
  setTimeout(() => {
    const layoutMenu = document.querySelector('#layout-menu');
    if (typeof (window as any).Menu !== 'undefined' && layoutMenu) {
      const menu = new (window as any).Menu(layoutMenu, {
        orientation: 'vertical',
        closeChildren: false,
      });
      menu.init();
    }
  }, 50); // Small delay allows DOM rendering to finish
}
}
