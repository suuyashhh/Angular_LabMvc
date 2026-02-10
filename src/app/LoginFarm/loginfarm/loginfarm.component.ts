import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loginfarm',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './loginfarm.component.html',
  styleUrl: './loginfarm.component.css'
})
export class LoginfarmComponent {
  loginObj: any = {
    CONTACT: '',  
    PASSWORD: ''  
  };
  isLoading = false;
  showPassword = false; // Add this property for password visibility toggle

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit() {
    if (this.auth.isFarmUserLoggedIn()) {
      this.router.navigate(['SF']);
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    // basic validation
    if (!this.loginObj.CONTACT || !this.loginObj.PASSWORD) {
      this.toastr.error('Please enter contact and password', 'Validation');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.api.baseurl}LoginFarm/Login`;

    // Create payload with correct property names
    const payload = {
      CONTACT: this.loginObj.CONTACT,
      PASSWORD: this.loginObj.PASSWORD
    };

    this.http.post(url, payload, { headers })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.auth.setFarmUserDetailsCookie(res, 365);
            this.toastr.success('Login Successful..!', 'User Login');
            this.router.navigate(['SF']);
          } else {
            this.toastr.error('Invalid credentials', 'Login Failed');
          }
        },
        error: (err: any) => {
          console.error('User login error', err);
          this.toastr.error('Invalid User or server error', 'Login Failed');
          // redirect to dairyfarm page when login fails
          this.router.navigate(['/farm']);
        }
      });
  }
}