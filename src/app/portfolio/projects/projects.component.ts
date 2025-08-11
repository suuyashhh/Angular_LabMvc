import { Component } from '@angular/core';


declare const particlesJS: any;

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent {

  ngOnInit(): void {
    // Initialize particles.js
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('Particles.js loaded');
    });
  }

  // Carousel functionality
  imageIndex: { [key: string]: number } = {
    dairyfarm: 1,
    fabrication: 1
  };

  showImage(project: string, index: number): void {
    const images = document.querySelectorAll(`#${project}-img-1, #${project}-img-2, #${project}-img-3, #${project}-img-4`);
    images.forEach((img: any, i: number) => {
      img.style.opacity = (i + 1 === index) ? "1" : "0";
    });
  }

  nextImage(project: string): void {
    this.imageIndex[project]++;
    if (this.imageIndex[project] > 4) this.imageIndex[project] = 1;
    this.showImage(project, this.imageIndex[project]);
  }

  prevImage(project: string): void {
    this.imageIndex[project]--;
    if (this.imageIndex[project] < 1) this.imageIndex[project] = 4;
    this.showImage(project, this.imageIndex[project]);
  }
}