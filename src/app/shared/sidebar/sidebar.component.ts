import { AfterViewInit, Component,OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements AfterViewInit {

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
