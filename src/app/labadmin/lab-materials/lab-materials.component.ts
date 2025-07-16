import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-lab-materials',
  standalone: true,
  imports: [HttpClientModule,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './lab-materials.component.html',
  styleUrl: './lab-materials.component.css'
})
export class LabMaterialsComponent implements OnInit {


  material: any;
  data: any;
  MAT_ID: any = 0;
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
      MAT_NAME: new FormControl('', Validators.required),
      MAT_PRICE: new FormControl('', Validators.required),
      DATE: new FormControl(''),
      COM_ID: new FormControl()
    });

    this.api.get('LabMaterials/LabMaterials').subscribe((res: any) => {
      this.material = res;
      console.log(this.material)
    })

    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');

  }

  clearData() {
    this.MAT_ID = 0;
    this.btn = '';
    this.data.patchValue({
      MAT_NAME: '',
      MAT_PRICE: '',
      DATE: ''
    })
  }

  submit(material: any) {
    this.submitted = false;
    if (!this.data.valid) {
      this.submitted = true;
      return;
    }
    if (this.MAT_ID == 0 && this.btn == '') {
      material.COM_ID = this.ComId
        this.api.post('LabMaterials/SaveLabMaterials', material).subscribe((res: any) => {
          this.load();
          this.api.modalClose('labMatFormModal');
       });
    } else if (this.MAT_ID != 0 && this.btn == 'E') {
      console.log(this.MAT_ID);
      this.api.post('LabMaterials/EditLabMaterials/' + this.MAT_ID, material).subscribe((res: any) => {
        this.load();
        console.log(res);

      });
    }
    else if (this.MAT_ID != 0 && this.btn == 'D') {
      console.log(this.Reason);

      if (this.Reason != '') {
        this.api.delete('LabMaterials/DeleteLabMaterials/' + this.MAT_ID).subscribe((res: any) => {
          this.load();
        })
      }
      else {
        alert("Fill the reason");
      }
    }
  }

  getDataById(matCode: number, btn: any) {
    this.btn = btn;
    this.api.get('LabMaterials/LabMaterials/' + matCode).subscribe((res: any) => {
      console.log(res);

      this.MAT_ID = res.maT_ID;
      this.data.patchValue({
        MAT_NAME: res.maT_NAME,
        MAT_PRICE: res.maT_PRICE,
        DATE: res.date
      })
    })
  }


}
