import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-notes-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerObj = {
    name: '',
    number: '',
    password: ''
  };
  isLoading = false;

  private http = inject(HttpClient);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  register() {
    if (!this.registerObj.name || !this.registerObj.number || !this.registerObj.password) {
      this.toastr.error('All fields (Name, Number, Password) are required', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    const payload = {
      name: this.registerObj.name,
      number: this.registerObj.number,
      password: this.registerObj.password
    };

    this.http.post(`${this.api.baseurl}NotesUser/Register`, payload)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loader.hide();
      }))
      .subscribe({
        next: (res: any) => {
          this.toastr.success('Registration successful! Please login.', 'Success');
          this.router.navigate(['/notes/login']);
        },
        error: (err: any) => {
          console.error(err);
          const msg = err?.error || 'Registration failed. Number might be already registered.';
          this.toastr.error(msg, 'Registration Failed');
        }
      });
  }
}
