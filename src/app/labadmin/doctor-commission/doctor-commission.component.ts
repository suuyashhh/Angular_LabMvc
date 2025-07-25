import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ServicesService } from '../../shared/services.service';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-doctor-commission',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule, FormattedDatePipe,NgxPaginationModule],
  templateUrl: './doctor-commission.component.html',
  styleUrl: './doctor-commission.component.css'
})
export class DoctorCommissionComponent implements OnInit {
  data!: FormGroup;
  doctorcommission: any;
  doctor: any;
  DOC_COM_ID: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  loadingCommission = false;
  Reason: string = '';

  constructor(private api: ApiService, private toastr: ToastrService, private service: ServicesService) {}

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem('COM_ID') || '0');
    this.initForm();
    this.loadDoctorCommission();
    this.loadDoctors();
  }

  initForm() {

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    this.data = new FormGroup({
      DATE: new FormControl(formattedDate, Validators.required),
      DOCTOR_ID: new FormControl('', Validators.required),
      DOC_COM_PRICE: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      COM_ID: new FormControl(this.ComId)
    });
  }

  loadDoctorCommission() {
    this.loadingCommission = true;
    this.api.get('DoctorCommission/DoctorCommissions').subscribe({
      next: (res: any) => {
        this.doctorcommission = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load doctor commission list');
        console.error(err);
        this.doctorcommission = [];
      },
      complete: () => this.loadingCommission = false
    });
  }

  loadDoctors() {
    this.api.get('Doctor/Doctors').subscribe({
      next: (res: any) => {
        this.doctor = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load doctors list');
        console.error(err);
        this.doctor = [];
      }
    });
  }

  clearData() {
    this.DOC_COM_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 2;

  submit(DocCom: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    const rawDate = this.data.get('DATE')?.value;
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    DocCom.DATE = this.service.getFormattedDate(formatted, 1);

    if (this.DOC_COM_ID == 0 && this.btn == '') {
      this.api.post('DoctorCommission/SaveDoctorCommission', DocCom).subscribe({
        next: () => {
          this.loadDoctorCommission();
          setTimeout(() => {
            this.toastr.success('Commission added successfully');
            this.api.modalClose('doctorComFormModal');
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add commission');
          console.error(err);
        }
      });

    } else if (this.DOC_COM_ID != 0 && this.btn == 'E') {
      this.api.post('DoctorCommission/EditDoctorCommission/' + this.DOC_COM_ID, DocCom).subscribe({
        next: () => {
          this.loadDoctorCommission();
          setTimeout(() => {
            this.toastr.success('Commission updated successfully');
            this.api.modalClose('doctorComFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update commission');
          console.error(err);
        }
      });

    } else if (this.DOC_COM_ID != 0 && this.btn == 'D') {
      if (this.Reason.trim() !== '') {
        this.api.delete('DoctorCommission/DeleteDoctorCommission/' + this.DOC_COM_ID).subscribe({
          next: () => {
            this.loadDoctorCommission();
            setTimeout(() => {
              this.toastr.success('Commission deleted successfully');
              this.api.modalClose('doctorComFormModal');
              this.clearData();
              this.Reason = '';
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete commission');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning('Please fill in the reason before deleting.');
      }
    }
  }

  getDataById(DocComCode: number, btn: string) {
    this.btn = btn;
    this.api.get('DoctorCommission/DoctorCommission/' + DocComCode).subscribe((res: any) => {
      this.DOC_COM_ID = res.doC_COM_ID;
      this.data.patchValue({
        DATE: this.service.getFormattedDate(res.date, 8),
        DOCTOR_ID: res.doctoR_ID,
        DOC_COM_PRICE: res.doC_COM_PRICE
      });
    });
  }

  getDoctorName(code: number): string {
  if (!this.doctor || !Array.isArray(this.doctor)) return 'Unknown';
  const doc = this.doctor.find((d: any) => d.doctoR_CODE === code);
  return doc ? doc.doctoR_NAME : 'Unknown';
}

  filteredDocCommission(): any[] {
    let result = this.doctorcommission || [];

    // Apply search filter if searchTerm exists
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      result = result.filter((doctorcommission: any) =>
        doctorcommission.doC_COM_PRICE?.toLowerCase().includes(searchTermLower)
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
