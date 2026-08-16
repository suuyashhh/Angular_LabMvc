import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ApiService } from '../../shared/api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  constructor(
    private router: Router,
    private api: ApiService
  ) { }

  login(username: string, password: string) {
    return this.api.post('MainAdmin/login', { username, password }).pipe(
      map((response: any) => {
        if (response && response.adminId) {
          const now = new Date();
          // Expiration time is 15 minutes from now
          const item = {
            value: response.adminId,
            expiry: now.getTime() + 15 * 60 * 1000,
          }
          localStorage.setItem('mainAdmin', JSON.stringify(item));
          return true;
        }
        return false;
      })
    );
  }

  isLoggedIn(): boolean {
    const itemStr = localStorage.getItem('mainAdmin');
    if (!itemStr) {
      return false;
    }
    
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    if (now.getTime() > item.expiry) {
      // If the item is expired, delete the item from storage
      this.logout();
      return false;
    }
    
    return true;
  }

  logout() {
    localStorage.removeItem('mainAdmin');
    this.router.navigate(['/admin/login']);
  }
}
