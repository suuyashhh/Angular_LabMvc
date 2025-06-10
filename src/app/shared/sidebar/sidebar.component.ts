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
    if (typeof (window as any).Menu !== 'undefined') {
      // Materio uses 'Menu' global class to handle dropdowns
      const menu = new (window as any).Menu(document.querySelector('#layout-menu'), {
        orientation: 'vertical',
        closeChildren: false
      });
      menu.init();
    }
  }
}
