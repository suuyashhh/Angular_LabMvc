import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioProjectService } from '../services/portfolio-project.service';
import { PortfolioProject } from '../models/portfolio-project';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-project-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-master.component.html',
  styleUrl: './project-master.component.css'
})
export class ProjectMasterComponent implements OnInit {
  projects: PortfolioProject[] = [];
  filteredProjects: PortfolioProject[] = [];
  searchQuery: string = '';

  showForm: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;

  currentProject: PortfolioProject = this.getEmptyProject();

  constructor(
    private projectService: PortfolioProjectService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  getEmptyProject(): PortfolioProject {
    return {
      projectId: 0,
      srNo: 1,
      projectName: '',
      projectDescription: '',
      technologies: '',
      codeLink: '',
      liveDemoLink: '',
      apkFile: '',
      desktopFile: '',
      image1: '',
      image2: '',
      image3: '',
      image4: '',
      category: 'webApp',
      isActive: true
    };
  }

  loadProjects(): void {
    this.isLoading = true;
    // Load ALL projects for admin, including inactive
    this.projectService.getAllProjects(false).subscribe({
      next: (data) => {
        this.projects = data || [];
        this.filterProjects();
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load projects');
        this.isLoading = false;
      }
    });
  }

  filterProjects(): void {
    if (!this.searchQuery) {
      this.filteredProjects = [...this.projects];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredProjects = this.projects.filter(p => 
        p.projectName.toLowerCase().includes(q) || 
        (p.technologies && p.technologies.toLowerCase().includes(q))
      );
    }
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentProject = this.getEmptyProject();
    if (this.projects.length > 0) {
        this.currentProject.srNo = Math.max(...this.projects.map(p => p.srNo)) + 1;
    }
    this.showForm = true;
  }

  openEditForm(project: PortfolioProject): void {
    this.isEditing = true;
    this.currentProject = { ...project };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.currentProject = this.getEmptyProject();
  }

  async onFileChange(event: any, fieldName: keyof PortfolioProject, type: string) {
    const file = event.target.files[0];
    if (file) {
      try {
        this.toastr.info('Uploading file...');
        const res = await this.projectService.uploadFile(file, type).toPromise();
        if (res && res.path) {
          (this.currentProject as any)[fieldName] = res.path;
          this.toastr.success('File uploaded successfully');
        }
      } catch (err) {
        this.toastr.error('Failed to upload file');
      }
    }
  }

  getFullUrl(path: string | undefined): string {
    return this.projectService.getFullUrl(path);
  }

  saveProject(): void {
    if (!this.currentProject.projectName || !this.currentProject.projectDescription || !this.currentProject.technologies) {
      this.toastr.warning('Please fill in all required fields (Name, Description, Technologies)');
      return;
    }

    this.isLoading = true;
    if (this.isEditing) {
      this.projectService.updateProject(this.currentProject.projectId, this.currentProject).subscribe({
        next: () => {
          this.toastr.success('Project updated successfully');
          this.showForm = false;
          this.loadProjects();
        },
        error: () => {
          this.toastr.error('Failed to update project');
          this.isLoading = false;
        }
      });
    } else {
      this.projectService.addProject(this.currentProject).subscribe({
        next: () => {
          this.toastr.success('Project added successfully');
          this.showForm = false;
          this.loadProjects();
        },
        error: () => {
          this.toastr.error('Failed to add project');
          this.isLoading = false;
        }
      });
    }
  }

  deleteProject(id: number): void {
    if (confirm('Are you sure you want to deactivate/delete this project?')) {
      this.isLoading = true;
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.toastr.success('Project deleted successfully');
          this.loadProjects();
        },
        error: () => {
          this.toastr.error('Failed to delete project');
          this.isLoading = false;
        }
      });
    }
  }

  toggleActive(project: PortfolioProject): void {
    const updated = { ...project, isActive: !project.isActive };
    this.projectService.updateProject(updated.projectId, updated).subscribe({
      next: () => {
        project.isActive = updated.isActive;
        this.toastr.success(`Project ${updated.isActive ? 'activated' : 'deactivated'}`);
      },
      error: () => {
        this.toastr.error('Failed to update status');
      }
    });
  }
}
