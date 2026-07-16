import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-notes-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginObj = {
    number: '',
    password: ''
  };
  isLoading = false;

  private http = inject(HttpClient);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private loader = inject(LoaderService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  ngOnInit() {
    if (this.auth.isNotesLoggedIn()) {
      this.router.navigate(['/notes/dashboard']);
    }
  }

  login() {
    if (!this.loginObj.number || !this.loginObj.password) {
      this.toastr.error('Number and Password are required', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const payload = {
      number: this.loginObj.number,
      password: this.loginObj.password
    };

    this.http.post(`${this.api.baseurl}NotesUser/Login`, payload)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          this.auth.setNotesUser(res);
          this.toastr.success('Welcome back!', 'Login Successful');
          this.router.navigate(['/notes/dashboard']);
        },
        error: (err: any) => {
          console.error(err);
          const errorMsg = err?.error || 'Invalid credentials or connection error';
          this.toastr.error(errorMsg, 'Login Failed');
        }
      });
  }
}
