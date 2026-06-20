import { Component, ViewEncapsulation } from '@angular/core';
import { NavbarPortComponent } from '../../shared/navbar-port/navbar-port.component';
import { FooterPortComponent } from '../../shared/footer-port/footer-port.component';
import { RouterOutlet } from '@angular/router';
import { CuteCatComponent } from '../cute-cat/cute-cat.component';

@Component({
  selector: 'app-portfolio-landing',
  standalone: true,
  imports: [NavbarPortComponent, FooterPortComponent, RouterOutlet, CuteCatComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PortfolioLandingComponent {

}
