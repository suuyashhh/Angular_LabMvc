import { Component, OnInit } from '@angular/core';
import { FooterComponent } from "../../shared/footer/footer.component";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FooterComponent, NavbarComponent, SidebarComponent , RouterOutlet,CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit{
  user:any;

  constructor(private auth:AuthService,private router:Router){}

  ngOnInit(): void {
   this.user = this.auth.getUser();
  }
  home(){
    const userJson = localStorage.getItem('userDetails');
  if (userJson) {
    const user = JSON.parse(userJson);

    // Update the coM_ID (e.g., set it to "123")
    user.coM_ID = 0; // or any other value you want
    user.user_Name = '';
    user.lab_Admin = '';

    // Save back to localStorage
    localStorage.setItem('userDetails', JSON.stringify(user));

    console.log('Updated user:', user);
    this.router.navigate(["ADMIN"]);
  } else {
    console.warn('No user found in localStorage');
  }
  }

}
