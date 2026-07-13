import { Component, OnInit } from '@angular/core';
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
  selector: 'app-fab-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fab-login.component.html',
  styleUrls: ['./fab-login.component.css']
})
export class FabLoginComponent implements OnInit {
  loginObj: any = {
    username: '',
    password: '',
    type: 'Admin' // default to Admin
  };
  isLoading = false;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.auth.isFabLoggedIn()) {
      this.router.navigate(['/fab/dashboard']);
    }
  }

  login() {
    if (!this.loginObj.username || !this.loginObj.password) {
      this.toastr.error('Please enter username and password', 'Validation');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const url = `${this.api.baseurl}Fab/Login`;

    this.http.post(url, this.loginObj, { headers })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.auth.setFabCredentialsCookie(res, 30);
            this.toastr.success('Login Successful!', 'Fabrication Portal');
            this.router.navigate(['/fab/dashboard']);
          } else {
            this.toastr.error('Invalid credentials', 'Login Failed');
          }
        },
        error: (err: any) => {
          console.error('Fabrication login error', err);
          this.toastr.error('Invalid User or server error', 'Login Failed');
        }
      });
  }
}
