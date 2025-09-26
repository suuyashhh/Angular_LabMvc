import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { FooterComponent } from "../../shared/footer/footer.component";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    FooterComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  user: any;
  isSidebarVisible: boolean = false;

  @ViewChild('sidebar') sidebar!: ElementRef;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  closeSidebar() {
    this.isSidebarVisible = false;
  }

  // Close sidebar when clicking outside of it
  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (this.isSidebarVisible && 
        !this.isToggleButton(event) && 
        !this.isSidebarClick(event)) {
      this.closeSidebar();
    }
  }

  // Check if click is on the toggle button
  private isToggleButton(event: Event): boolean {
    const target = event.target as HTMLElement;
    return target.closest('.mobile-menu-toggle') !== null;
  }

  // Check if click is inside the sidebar
  private isSidebarClick(event: Event): boolean {
    const target = event.target as HTMLElement;
    return target.closest('.layout-menu') !== null;
  }

  // Optional: Close sidebar when pressing Escape key
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.closeSidebar();
  }

  home() {
    const userJson = localStorage.getItem('userDetails');
    if (userJson) {
      const user = JSON.parse(userJson);
      user.coM_ID = 0;
      user.user_Name = '';
      user.lab_Admin = '';
      localStorage.setItem('userDetails', JSON.stringify(user));
      this.router.navigate(["ADMIN"]);
    }
  }
}