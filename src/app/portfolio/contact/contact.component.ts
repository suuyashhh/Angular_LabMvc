import { Component } from '@angular/core';

declare const particlesJS: any;
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  ngOnInit(): void {
    // Initialize particles.js
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('Particles.js loaded');
    });
  }
}
