import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { PortfolioProjectService } from '../../Adminstrator/services/portfolio-project.service';
import { PortfolioProject } from '../../Adminstrator/models/portfolio-project';
import { LoaderService } from '../../services/loader.service';
import { SeoService } from '../../shared/seo.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  private seoService = inject(SeoService);
  private platformId = inject(PLATFORM_ID);
  activeTab: 'webApp' | 'website' = 'webApp'; // Note: category is saved as 'webApp' or 'website'
  currentImageIndex: { [key: number]: number } = {};

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
    private projectService: PortfolioProjectService,
    private loader: LoaderService
  ) {}

  ngOnInit(): void {
    this.seoService.setSeoData({
      title: "Suyash Patil | Projects & Portfolio",
      description: "Explore the projects built by Suyash Patil, ranging from laboratory management systems to dairy farm apps, using Angular, .NET Core, and SQL.",
      url: "https://suyashpatil.in/portfolio/projects",
      image: "https://suyashpatil.in/assets/images/suyashpatil.png",
      type: "website"
    });
    this.loadProjects();

    // Keyboard navigation for image preview
    if (isPlatformBrowser(this.platformId)) {
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
  }

  loadProjects(): void {
    this.isLoading = true;
    this.hasError = false;
    this.loader.show();
    this.projectService.getAllProjects(true).subscribe({
      next: (data) => {
        this.projects = data || [];
        this.projects.forEach(project => {
          this.currentImageIndex[project.projectId] = 0;
        });
        this.isLoading = false;
        this.loader.hide();
      },
      error: (err) => {
        this.hasError = true;
        this.isLoading = false;
        this.loader.hide();
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

  // Switch between tabs
  switchTab(tab: 'webApp' | 'website'): void {
    this.activeTab = tab;
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

  showWorkInProgressToast(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toastr.warning('work in prograce');
  }
}
