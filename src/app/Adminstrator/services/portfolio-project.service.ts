import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { Observable } from 'rxjs';
import { PortfolioProject } from '../models/portfolio-project';

@Injectable({
  providedIn: 'root'
})
export class PortfolioProjectService {

  constructor(private api: ApiService) { }

  getAllProjects(onlyActive: boolean = true): Observable<any> {
    return this.api.get(`PortfolioProjects?onlyActive=${onlyActive}`) as Observable<any>;
  }

  getProjectById(id: number): Observable<any> {
    return this.api.get(`PortfolioProjects/${id}`) as Observable<any>;
  }

  addProject(project: PortfolioProject): Observable<any> {
    return this.api.post('PortfolioProjects', project) as Observable<any>;
  }

  updateProject(id: number, project: PortfolioProject): Observable<any> {
    return this.api.put(`PortfolioProjects/${id}`, project) as Observable<any>;
  }

  deleteProject(id: number): Observable<any> {
    return this.api.delete(`PortfolioProjects/${id}`) as Observable<any>;
  }

  uploadFile(file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return this.api.upload('PortfolioProjects/upload', formData) as Observable<any>;
  }

  getFullUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Get server root url by removing 'api/' from baseurl
    const serverUrl = this.api.baseUrl.replace('api/', '');
    
    // Ensure smooth concatenation
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return serverUrl + cleanPath;
  }
}
