import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const particlesJS: any;

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  imageIndex: { [key: string]: number } = {
    dairy: 1,
    fabrication: 1,
    laboratory: 1
  };

  ngOnInit(): void {
    // Initialize particles.js
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('Particles.js loaded');
    });
  }

  nextImage(project: string): void {
    this.imageIndex[project] = this.imageIndex[project] % 4 + 1;
  }

  prevImage(project: string): void {
    this.imageIndex[project] = (this.imageIndex[project] - 2 + 4) % 4 + 1;
  }
}