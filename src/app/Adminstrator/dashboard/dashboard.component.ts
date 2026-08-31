import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  projects = [
    { name: 'Dairy Farm', key: 'DairyFarm', route: '/dairyfarm' },
    { name: 'Farm', key: 'Farm', route: '/farm' },
    { name: 'Shop', key: 'Shop', route: '/tejas/login' },
    { name: 'Lab Management', key: 'Lab', route: '/lab' },
    { name: 'Smart Parking', key: 'Parking', route: '/parking/provider-login' },
    { name: 'Market', key: 'Market', route: '/market/login' },
    { name: 'Fab', key: 'Fab', route: '/fab/login' },
    { name: 'Notes', key: 'Notes', route: '/notes/login' }
  ];

  selectedProject: any = null;
  projectUsers: any[] = [];
  isLoadingUsers = false;

  constructor(
    private authService: AdminAuthService, 
    private router: Router,
    private http: HttpClient,
    private api: ApiService
  ) {}

  ngOnInit() {
    if (this.projects.length > 0) {
      this.selectProject(this.projects[0]);
    }
  }

  selectProject(project: any) {
    this.selectedProject = project;
    this.fetchProjectUsers(project.key);
  }

  fetchProjectUsers(moduleName: string) {
    this.isLoadingUsers = true;
    this.projectUsers = [];
    this.http.get(`${this.api.baseurl}MainAdmin/GetModuleUsers/${moduleName}`).subscribe({
      next: (res: any) => {
        this.projectUsers = res;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Error fetching module users', err);
        this.isLoadingUsers = false;
      }
    });
  }

  loginAsUser(user: any) {
    if (!this.selectedProject) return;
    
    this.router.navigate([this.selectedProject.route], { 
      queryParams: { 
        autoLogin: 'true', 
        u: user.contact || user.username || user.id,
        p: user.password 
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
