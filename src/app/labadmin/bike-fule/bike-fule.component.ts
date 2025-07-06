import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-bike-fule',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './bike-fule.component.html',
  styleUrl: './bike-fule.component.css'
})
export class BikeFuleComponent {
  
  bikefule:any;
  data: any;
  BIKE_ID: any = 0;
  ComId: number = 0;
  btn: any = '';
  submitted = false;
  Reason: any = '';

  constructor(private api: ApiService) { }


  ngOnInit(): void {
    // this.clearData();
    this.load();
  }

  load() {
    this.data = new FormGroup({
      BIKE_NAME: new FormControl('', Validators.required),
      BIKE_PRICE: new FormControl('', Validators.required),
      COM_ID: new FormControl()
    });

    this.api.get('BikeFule/BikeFule').subscribe((res: any) => {
      this.bikefule = res;
      console.log(this.bikefule)
    })

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

  clearData() {
    this.BIKE_ID = 0;
    this.btn = '';
    this.data.patchValue({
      BIKE_NAME: '',
      BIKE_PRICE: '',
    })
  }

  submit(bike: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.BIKE_ID == 0 && this.btn == '') {
      bike.COM_ID = this.ComId
        this.api.post('BikeFule/SaveBikeFule', bike).subscribe((res: any) => {
          this.api.modalClose();
          this.load();
       }); 
    } else if (this.BIKE_ID != 0 && this.btn == 'E') {
      console.log(this.BIKE_ID);
      this.api.post('BikeFule/EditBikeFule/' + this.BIKE_ID, bike).subscribe((res: any) => {
        this.load();
        console.log(res);
        
      });
    }
    else if (this.BIKE_ID != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('BikeFule/DeleteBikeFule/' + this.BIKE_ID).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

  getDataById(bikeCode: number, btn: any) {
    this.btn = btn;
    this.api.get('BikeFule/BikeFule/' + bikeCode).subscribe((res: any) => {
      console.log(res);

      this.BIKE_ID = res.bikE_ID;
      this.data.patchValue({
        BIKE_NAME: res.bikE_NAME,
        BIKE_PRICE: res.bikE_PRICE,
      })
    })
  }
  
}
