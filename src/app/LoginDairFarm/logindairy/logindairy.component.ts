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
  selector: 'app-logindairy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './logindairy.component.html',
  styleUrls: ['./logindairy.component.css']
})
export class LogindairyComponent {
  loginObj: any = {
    user_name: '',
    email: '',
    contact: '',
    password: ''
  };
  isLoading = false;
  isLoginMode = true;

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.loginObj = { user_name: '', email: '', contact: '', password: '' };
  }

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.auth.isDairyLoggedIn()) {
      this.router.navigate(['SDF']);
    }
  }

  login() {
    // basic validation
    if (!this.loginObj.contact || !this.loginObj.password) {
      this.toastr.error('Please enter contact and password', 'Validation');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.api.baseurl}LoginDairFarm/Login`; // matches your controller route

    this.http.post(url, this.loginObj, { headers })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.auth.setDairyCredentialsCookie(res, 365);
            this.toastr.success('Login Successful..!', 'Dairy Login');
            this.router.navigate(['SDF']);
          } else {
            this.toastr.error('Invalid credentials', 'Login Failed');
          }
        },
        error: (err: any) => {
          console.error('Dairy login error', err);
          this.toastr.error('Invalid User or server error', 'Login Failed');
          // redirect to dairyfarm page when login fails
          this.router.navigate(['/dairyfarm']);
        }
      });
  }

  register() {
    if (!this.loginObj.user_name || !this.loginObj.email || !this.loginObj.contact || !this.loginObj.password) {
      this.toastr.error('Please fill all fields', 'Validation');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.api.baseurl}LoginDairFarm/Register`; 

    this.http.post(url, this.loginObj, { headers })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          this.toastr.success('Registration Successful! You can now login.', 'Success');
          this.toggleMode();
        },
        error: (err: any) => {
          console.error('Registration error', err);
          const msg = err.error || 'Registration failed';
          this.toastr.error(msg, 'Error');
        }
      });
  }
}
