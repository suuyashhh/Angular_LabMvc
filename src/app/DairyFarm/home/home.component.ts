import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../shared/auth.service';       // adjust path if necessary
import { LoaderService } from '../../services/loader.service'; // adjust path if necessary
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  userName: string | null = null;
  constructor(
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
  const dairy = this.auth.getDairyCredentialsFromCookie();
  if (dairy && dairy.user_name) {
    this.userName = dairy.user_name;
  }
}

  // Called from template button
  dairyLogout(): void {
    try {
      this.loader.show();
    } catch (e) {
    }

    try {
      this.auth.dairyLogout();
    } finally {
      setTimeout(() => {
        try { this.loader.hide(); } catch (e) {}
      }, 200);
    }
  }
}
