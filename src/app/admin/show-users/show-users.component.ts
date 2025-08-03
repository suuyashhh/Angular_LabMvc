import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-show-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-users.component.html',
  styleUrl: './show-users.component.css'
})
export class ShowUsersComponent implements OnInit{

  companies:any=[];
  loadingTests = false;


  constructor(private api:ApiService, private router:Router) { }

  ngOnInit(): void {
    this.load();
  }

  load(){
    this.api.get('Admin/Companies').subscribe((res:any)=>{
      console.log(res);
      this.companies = res;

    });
  }

 companyDetails(comId:any) {
  const userJson = localStorage.getItem('userDetails');
  if (userJson) {
    const user = JSON.parse(userJson);

    // Update the coM_ID (e.g., set it to "123")
    user.coM_ID = comId; // or any other value you want
    user.user_Name = user.name;
    user.lab_Admin = 'Y';

    // Save back to localStorage
    localStorage.setItem('userDetails', JSON.stringify(user));

    console.log('Updated user:', user);
    this.router.navigate(["LABADMIN"]);
  } else {
    console.warn('No user found in localStorage');
  }
}


}
