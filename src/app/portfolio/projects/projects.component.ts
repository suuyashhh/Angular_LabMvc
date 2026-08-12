import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { PortfolioProjectService } from '../../Adminstrator/services/portfolio-project.service';
import { PortfolioProject } from '../../Adminstrator/models/portfolio-project';

declare const particlesJS: any;

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  activeTab: 'webApp' | 'website' = 'webApp'; // Note: category is saved as 'webApp' or 'website'
  currentImageIndex: { [key: number]: number } = {};
  
  private observer: IntersectionObserver | null = null;

  // Image preview modal
  showImagePreview = false;
  previewImage = '';
  previewProjectTitle = '';
  currentPreviewProjectId = 0;

  projects: PortfolioProject[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(
    private toastr: ToastrService,
    private projectService: PortfolioProjectService
  ) {}

  ngOnInit(): void {
    this.loadProjects();

    // Initialize particles.js
    if (typeof particlesJS !== 'undefined') {
        particlesJS.load('particles-js', 'assets/particles.json', () => {
          console.log('Particles.js loaded');
        });
    }

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

  loadProjects(): void {
    this.isLoading = true;
    this.hasError = false;
    this.projectService.getAllProjects(true).subscribe({
      next: (data) => {
        this.projects = data || [];
        this.projects.forEach(project => {
          this.currentImageIndex[project.projectId] = 0;
        });
        this.isLoading = false;
        setTimeout(() => {
          this.initScrollReveal();
        }, 100);
      },
      error: (err) => {
        this.hasError = true;
        this.isLoading = false;
        this.toastr.error('Failed to load portfolio projects');
      }
    });
  }

  getProjectImages(project: PortfolioProject): string[] {
    const images: string[] = [];
    if (project.image1) images.push(this.projectService.getFullUrl(project.image1));
    if (project.image2) images.push(this.projectService.getFullUrl(project.image2));
    if (project.image3) images.push(this.projectService.getFullUrl(project.image3));
    if (project.image4) images.push(this.projectService.getFullUrl(project.image4));
    return images;
  }

  getFullUrl(path: string | undefined): string {
    return this.projectService.getFullUrl(path);
  }

  getProjectTech(project: PortfolioProject): string[] {
    if (!project.technologies) return [];
    return project.technologies.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  ngAfterViewInit() {
    this.initScrollReveal();
  }

  initScrollReveal() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        } else {
          entry.target.classList.remove('reveal-visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    const targets = document.querySelectorAll('.scroll-reveal');
    targets.forEach(target => this.observer!.observe(target));
  }

  // Switch between tabs
  switchTab(tab: 'webApp' | 'website'): void {
    this.activeTab = tab;
    setTimeout(() => {
      this.initScrollReveal();
    }, 50);
  }

  // Navigate to next image in carousel
  nextImage(projectId: number): void {
    const project = this.projects.find(p => p.projectId === projectId);
    if (project) {
      const images = this.getProjectImages(project);
      if (images.length > 0) {
          this.currentImageIndex[projectId] = 
            (this.currentImageIndex[projectId] + 1) % images.length;
      }
    }
  }

  // Navigate to previous image in carousel
  prevImage(projectId: number): void {
    const project = this.projects.find(p => p.projectId === projectId);
    if (project) {
      const images = this.getProjectImages(project);
      if (images.length > 0) {
          this.currentImageIndex[projectId] = 
            (this.currentImageIndex[projectId] - 1 + images.length) % images.length;
      }
    }
  }

  // Open image preview modal
  openImagePreview(project: PortfolioProject): void {
    const images = this.getProjectImages(project);
    if (images.length === 0) return;

    this.previewImage = images[this.currentImageIndex[project.projectId]];
    this.previewProjectTitle = project.projectName;
    this.currentPreviewProjectId = project.projectId;
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
    const project = this.projects.find(p => p.projectId === this.currentPreviewProjectId);
    if (project) {
      const images = this.getProjectImages(project);
      this.currentImageIndex[this.currentPreviewProjectId] = 
        (this.currentImageIndex[this.currentPreviewProjectId] + 1) % images.length;
      this.previewImage = images[this.currentImageIndex[this.currentPreviewProjectId]];
    }
  }

  // Navigate to previous image in preview modal
  prevImageInPreview(): void {
    const project = this.projects.find(p => p.projectId === this.currentPreviewProjectId);
    if (project) {
      const images = this.getProjectImages(project);
      this.currentImageIndex[this.currentPreviewProjectId] = 
        (this.currentImageIndex[this.currentPreviewProjectId] - 1 + images.length) % images.length;
      this.previewImage = images[this.currentImageIndex[this.currentPreviewProjectId]];
    }
  }

  // Get current project images for counter
  getCurrentProjectImages(): string[] {
    const project = this.projects.find(p => p.projectId === this.currentPreviewProjectId);
    return project ? this.getProjectImages(project) : [];
  }

  // Show toast notification
  showToast(event: Event): void {
    event.preventDefault();
    this.toastr.warning('Coming soon..!');
  }
}
