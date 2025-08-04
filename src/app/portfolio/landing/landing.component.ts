import { Component } from '@angular/core';
import { NavbarPortComponent } from '../../shared/navbar-port/navbar-port.component';
import { FooterPortComponent } from '../../shared/footer-port/footer-port.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [NavbarPortComponent,FooterPortComponent,RouterOutlet],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {

}
