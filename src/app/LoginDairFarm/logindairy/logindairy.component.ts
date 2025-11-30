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
    contact: '',
    password: ''
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
      this.auth.setDairyCredentialsCookie(res, 7);
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
}
