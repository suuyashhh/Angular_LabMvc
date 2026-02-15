import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

declare const particlesJS: any;

interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
  tech: string[];
  links: {
    code: string;
    demo: string;
    android?: string;
    desktop?: string;
  };
  category: 'webApp' | 'website';
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  activeTab: 'webApps' | 'websites' = 'webApps';
  currentImageIndex: { [key: string]: number } = {};
  
  // Image preview modal
  showImagePreview = false;
  previewImage = '';
  previewProjectTitle = '';
  currentPreviewProjectId = '';

  projects: Project[] = [
    {
      id: 'laboratory',
      title: 'Laboratory - App',
      description: 'Manage laboratory operations efficiently with our comprehensive solution.',
      images: [
        '../../../assets/img/LabApplication/LabApp2.png',
        '../../../assets/img/LabApplication/LabApp1.png',
        '../../../assets/img/LabApplication/LapApp3.png',
        '../../../assets/img/LabApplication/LabApp4.png'
      ],
      tech: ['Angular', 'Tailwind CSS', 'Typescript', 'SQL', '.Net Core', 'Android Studio'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://suyashpatil.in/lab',
        android: '../../../assets/APK\'S/Lab.apk'
      },
      category: 'webApp'
    },
    {
      id: 'dairy',
      title: 'DairyFarm - App',
      description: 'Manage your dairy farm operations efficiently with our comprehensive solution.',
      images: [
        '../../../assets/img/DairFarm/DF1.png',
        '../../../assets/img/DairFarm/DF2.png',
        '../../../assets/img/DairFarm/DF3.png',
        '../../../assets/img/DairFarm/DF4.png'
      ],
      tech: ['Angular', '.Net Core Web Api', 'SQL', 'Android Studio'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://suyashpatil.in/dairyfarm',
        android: '../../../assets/APK\'S/DairyFarm.apk',
        desktop: '../../../assets/DeskTopAPK\'S/Dairy Farm.lnk'
      },
      category: 'webApp'
    },
    {
      id: 'fabrication',
      title: 'Fabrication - App',
      description: 'Streamline your fabrication management processes with our powerful tools.',
      images: [
        '../../../assets/img/Fabrication/img1.png',
        '../../../assets/img/Fabrication/img2.png',
        '../../../assets/img/Fabrication/img3.png',
        '../../../assets/img/Fabrication/img4.png'
      ],
      tech: ['JavaScript', 'Bootstrap', 'SQL', '.Net Webforms', 'Android Studio'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://dairyfarm.revolutionit.in/Fabrication_Admin',
        android: '../../../assets/APK\'S/Fabrication.apk'
      },
      category: 'webApp'
    },
    {
      id: 'farm',
      title: 'Farm Management App',
      description: 'Complete farm management solution for modern agriculture.',
      images: [
        '../../../assets/img/Farm/Farm1.png',
        '../../../assets/img/Farm/Farm2.png',
        '../../../assets/img/Farm/Farm3.png',
        '../../../assets/img/Farm/Farm4.png'
      ],
      tech: ['Angular', 'SQL', '.Net Core'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://dairyfarm.revolutionit.in/Fabrication_Admin',
        android: '../../../assets/APK\'S/Fabrication.apk'
      },
      category: 'webApp'
    },
    {
      id: 'portfolio',
      title: 'Lab Website',
      description: 'A modern personal Lab website showcasing my skills and projects.',
      images: [
        '../../../assets/img/LabApplication/LabWeb1.png',
        '../../../assets/img/LabApplication/LabWeb2.png'
      ],
      tech: ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://rupeshlabmanipaltrutest.com/'
      },
      category: 'website'
    },
    {
      id: 'ecommerce',
      title: 'Fabrication Website',
      description: 'A fully responsive e-commerce platform with product listings and cart functionality.',
      images: [
        '../../../assets/img/Fabrication/FabWeb1.png',
        '../../../assets/img/Fabrication/FabWeb2.png'
      ],
      tech: ['HTML5', 'CSS', 'JavaScript'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://dairyfarm.revolutionit.in/WebFabrication.html'
      },
      category: 'website'
    }
  ];

  constructor(private toastr: ToastrService) {
    // Initialize image indices
    this.projects.forEach(project => {
      this.currentImageIndex[project.id] = 0;
    });
  }

  ngOnInit(): void {
    // Initialize particles.js
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('Particles.js loaded');
    });

    // Keyboard navigation for image preview
    document.addEventListener('keydown', (e) => {
      if (this.showImagePreview) {
        if (e.key === 'ArrowRight') {
          this.nextImageInPreview();
        } else if (e.key === 'ArrowLeft') {
          this.prevImageInPreview();
        } else if (e.key === 'Escape') {
          this.closeImagePreview();
        }
      }
    });
  }

  // Switch between tabs
  switchTab(tab: 'webApps' | 'websites'): void {
    this.activeTab = tab;
  }

  // Navigate to next image in carousel
  nextImage(projectId: string): void {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.currentImageIndex[projectId] = 
        (this.currentImageIndex[projectId] + 1) % project.images.length;
    }
  }

  // Navigate to previous image in carousel
  prevImage(projectId: string): void {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.currentImageIndex[projectId] = 
        (this.currentImageIndex[projectId] - 1 + project.images.length) % project.images.length;
    }
  }

  // Open image preview modal
  openImagePreview(project: Project): void {
    this.previewImage = project.images[this.currentImageIndex[project.id]];
    this.previewProjectTitle = project.title;
    this.currentPreviewProjectId = project.id;
    this.showImagePreview = true;
    document.body.style.overflow = 'hidden';
  }

  // Close image preview modal
  closeImagePreview(): void {
    this.showImagePreview = false;
    document.body.style.overflow = 'auto';
  }

  // Navigate to next image in preview modal
  nextImageInPreview(): void {
    const project = this.projects.find(p => p.id === this.currentPreviewProjectId);
    if (project) {
      this.currentImageIndex[this.currentPreviewProjectId] = 
        (this.currentImageIndex[this.currentPreviewProjectId] + 1) % project.images.length;
      this.previewImage = project.images[this.currentImageIndex[this.currentPreviewProjectId]];
    }
  }

  // Navigate to previous image in preview modal
  prevImageInPreview(): void {
    const project = this.projects.find(p => p.id === this.currentPreviewProjectId);
    if (project) {
      this.currentImageIndex[this.currentPreviewProjectId] = 
        (this.currentImageIndex[this.currentPreviewProjectId] - 1 + project.images.length) % project.images.length;
      this.previewImage = project.images[this.currentImageIndex[this.currentPreviewProjectId]];
    }
  }

  // Get current project images for counter
  getCurrentProjectImages(): string[] {
    const project = this.projects.find(p => p.id === this.currentPreviewProjectId);
    return project ? project.images : [];
  }

  // Show toast notification
  showToast(event: Event): void {
    event.preventDefault();
    this.toastr.warning('Coming soon..!');
  }
}