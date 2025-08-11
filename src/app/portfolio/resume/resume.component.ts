import { Component } from '@angular/core';

declare const particlesJS: any;
@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.css'
})
export class ResumeComponent {
  ngOnInit(): void {
    // Initialize particles.js
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('Particles.js loaded');
    });
  }
}
