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
    laboratory: 1,
    portfolio: 1,
    ecommerce: 1,
    blog: 1
  };

  ngOnInit(): void {
    // Initialize particles.js
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('Particles.js loaded');
    });
  }

  nextImage(project: string): void {
    const maxImages = project === 'dairy' || project === 'fabrication' || project === 'laboratory' ? 4 : 2;
    this.imageIndex[project] = this.imageIndex[project] % maxImages + 1;
  }

  prevImage(project: string): void {
    const maxImages = project === 'dairy' || project === 'fabrication' || project === 'laboratory' ? 4 : 2;
    this.imageIndex[project] = (this.imageIndex[project] - 2 + maxImages) % maxImages + 1;
  }

 showSection(section: string): void {
  // Hide all sections
  document.getElementById('webAppsSection')?.classList.add('hidden');
  document.getElementById('websitesSection')?.classList.add('hidden');
  
  // Reset all buttons to inactive state (white/transparent background)
  document.getElementById('webAppsBtn')?.classList.remove('bg-purple-600/90', 'text-white');
  document.getElementById('webAppsBtn')?.classList.add('bg-white/10', 'text-black-300');
  document.getElementById('websitesBtn')?.classList.remove('bg-purple-600/90', 'text-white');
  document.getElementById('websitesBtn')?.classList.add('bg-white/10', 'text-black-300');
  
  // Show selected section and update button to active state (purple background)
  if (section === 'webApps') {
    document.getElementById('webAppsSection')?.classList.remove('hidden');
    document.getElementById('webAppsBtn')?.classList.add('bg-purple-600/90', 'text-white');
    document.getElementById('webAppsBtn')?.classList.remove('bg-white/10', 'text-black-300');
  } else {
    document.getElementById('websitesSection')?.classList.remove('hidden');
    document.getElementById('websitesBtn')?.classList.add('bg-purple-600/90', 'text-white');
    document.getElementById('websitesBtn')?.classList.remove('bg-white/10', 'text-black-300');
  }
}
}