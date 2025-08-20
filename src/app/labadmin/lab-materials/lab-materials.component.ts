import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';
import { ServicesService } from '../../shared/services.service';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-lab-materials',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormattedDatePipe, FormsModule, NgxPaginationModule],
  templateUrl: './lab-materials.component.html',
  styleUrl: './lab-materials.component.css'
})
export class LabMaterialsComponent implements OnInit {
  data!: FormGroup;
  material: any;
  MAT_ID: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  loadingMaterials = false;
  Reason: string = '';
  startDate!: string;
  endDate!: string;

  constructor(private api: ApiService, private toastr: ToastrService, private service: ServicesService) { }

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem('COM_ID') || '0');
    this.initForm();
    const { start, end } = this.service.getCurrentMonthRange();
    this.startDate = start;
    this.endDate = end;
    this.loadMaterials();
  }

  initForm() {
    this.data = new FormGroup({
      DATE: new FormControl(this.service.getFormattedDate(new Date(), 8), Validators.required),
      MAT_NAME: new FormControl('', Validators.required),
      MAT_PRICE: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      COM_ID: new FormControl(this.ComId)
    });
  }

  onDateChange() {
    if (this.startDate && this.endDate) this.loadMaterials();
  }

  getMaterials() {
    this.loadingMaterials = true;
    this.api.get('LabMaterials/LabMaterials').subscribe({
      next: (res: any) => {
        this.material = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load material list');
        console.error(err);
        this.material = [];
      },
      complete: () => this.loadingMaterials = false
    });
  }

  loadMaterials() {
    const startDate = this.service.formatDate(this.startDate, 1);   // yyyyMMdd
    const endDate = this.service.formatDate(this.endDate, 1);     // yyyyMMdd
    this.loadingMaterials = true;
    this.api.get(`LabMaterials/GetDateWiseLabMaterials/${startDate},${endDate}`).subscribe({
      next: (res: any) => this.material = res,
      error: () => this.toastr.error('Failed to load materials'),
      complete: () => this.loadingMaterials = false
    });
  }

  clearData() {
    this.MAT_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 10;

  submit(material: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    const rawDate = this.data.get('DATE')?.value;
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    material.DATE = this.service.getFormattedDate(formatted, 1);

    if (this.MAT_ID == 0 && this.btn == '') {
      this.api.post('LabMaterials/SaveLabMaterials', material).subscribe({
        next: () => {
          this.loadMaterials();
          setTimeout(() => {
            this.toastr.success('Material added successfully');
            this.api.modalClose('labMatFormModal');
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add material');
          console.error(err);
        }
      });

    } else if (this.MAT_ID != 0 && this.btn == 'E') {
      this.api.post('LabMaterials/EditLabMaterials/' + this.MAT_ID, material).subscribe({
        next: () => {
          this.loadMaterials();
          setTimeout(() => {
            this.toastr.success('Material updated successfully');
            this.api.modalClose('labMatFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update material');
          console.error(err);
        }
      });

    } else if (this.MAT_ID != 0 && this.btn == 'D') {
      if (this.Reason.trim() !== '') {
        this.api.delete('LabMaterials/DeleteLabMaterials/' + this.MAT_ID).subscribe({
          next: () => {
            this.loadMaterials();
            setTimeout(() => {
              this.toastr.success('Material deleted successfully');
              this.api.modalClose('labMatFormModal');
              this.clearData();
              this.Reason = "";
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete material');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning('Please fill in the reason before deleting.');
      }
    }
  }

  getDataById(matCode: number, btn: string) {
    this.btn = btn;
    this.api.get('LabMaterials/LabMaterial/' + matCode).subscribe((res: any) => {
      this.MAT_ID = res.maT_ID;
      this.data.patchValue({
        DATE: this.service.getFormattedDate(res.date, 8),
        MAT_NAME: res.maT_NAME,
        MAT_PRICE: res.maT_PRICE
      });
    });
  }


  filteredMaterials(): any[] {
    let result = this.material || [];

    // Apply search filter if searchTerm exists
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      result = result.filter((material: any) =>
        material.maT_NAME?.toLowerCase().includes(searchTermLower)
      );
    }

    // Reset to page 1 when search term changes
    if (this.searchTerm) {
      this.page = 1;
    }

    return result;
  }

  onSearch() {
    // Reset to first page when searching
    this.page = 1;
  }


}






