import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { ServicesService } from '../../shared/services.service';
import { FormattedDatePipe } from '../../shared/pipes/formatted-date.pipe';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-employee-salary',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule, FormattedDatePipe, NgxPaginationModule],
  templateUrl: './employee-salary.component.html',
  styleUrl: './employee-salary.component.css'
})
export class EmployeeSalaryComponent implements OnInit {
  employeesalary: any;
  data!: FormGroup;
  employee: any;
  EMP_TRN_ID: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  Reason: string = '';
  loadingSalary = false;

  constructor(private api: ApiService, private toastr: ToastrService, private service: ServicesService) { }

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem("COM_ID") || '0');
    this.initForm();
    this.pageloadDatewiseEmpSal();
  }


  formatDateToYyyyMmDd(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = ('0' + (date.getMonth() + 1)).slice(-2); // Fixed: using '0' not 'o'
    const dd = ('0' + date.getDate()).slice(-2);       // Fixed: using '0' not 'o'
    return `${yyyy}${mm}${dd}`;                        // Fixed: using proper template literals
  }

  pageloadDatewiseEmpSal() {

    this.api.get('Employee/Employees').subscribe((res: any) => {
      this.employee = res;
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formattedStart = this.formatDateToYyyyMmDd(startOfMonth); // e.g. 20250801
    const formattedEnd = this.formatDateToYyyyMmDd(endOfMonth);     // e.g. 20250831

    this.getDateWiseEmpSalary(formattedStart, formattedEnd); // Call on page load
  }


  initForm() {
    const now = new Date();
    // first date
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // last date
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const format = (date: Date): string => {
      const yyyy = date.getFullYear();
      const mm = ('0' + (date.getMonth() + 1)).slice(-2);
      const dd = ('0' + date.getDate()).slice(-2);
      return `${yyyy}-${mm}-${dd}`;  // Fixed: using proper template literals
    };
    this.data = new FormGroup({
      startDate: new FormControl(format(startOfMonth), Validators.required),
      endDate: new FormControl(format(endOfMonth), Validators.required),
      EMP_ID: new FormControl('', Validators.required),
      EMP_PRICE: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      DATE: new FormControl(format(now), Validators.required),
      COM_ID: new FormControl()
    });
  }


  onDateChange() {
    const start = this.data.get('startDate')?.value;
    const end = this.data.get('endDate')?.value;

    if (start && end) {
      const startDate = this.formatDateToYyyyMmDd(new Date(start));
      const endDate = this.formatDateToYyyyMmDd(new Date(end));
      this.getDateWiseEmpSalary(startDate, endDate);
    }
  }

  getDateWiseEmpSalary(startDate: string, endDate: string) {
    this.loadingSalary = true;
    this.api.get('EmployeeSalary/GetDateWiseEmpSalary/' + startDate + ',' + endDate).subscribe({
      next: (res: any) => {
        this.employeesalary = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load material list');
        console.error(err);
        this.employeesalary = [];
      },
      complete: () => this.loadingSalary = false
    });
  }

  load() {
    this.loadingSalary = true;
    this.api.get('EmployeeSalary/EmployeeSalarys').subscribe({
      next: (res: any) => {
        this.employeesalary = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load salary list');
        console.error(err);
        this.employeesalary = [];
      },
      complete: () => this.loadingSalary = false
    });

  }

  clearData() {
    this.EMP_TRN_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }

  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 10;

  submit(employeesalary: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    const rawDate = this.data.get('DATE')?.value;
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    employeesalary.DATE = this.service.getFormattedDate(formatted, 1);

    if (this.EMP_TRN_ID == 0 && this.btn == '') {
      employeesalary.COM_ID = this.ComId;
      this.api.post('EmployeeSalary/SaveEmployeeSalary', employeesalary).subscribe({
        next: () => {
          this.pageloadDatewiseEmpSal();
          setTimeout(() => {
            this.toastr.success('Salary added successfully');
            this.api.modalClose('EmpSalFormModal');
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add salary');
          console.error(err);
        }
      });

    } else if (this.EMP_TRN_ID != 0 && this.btn == 'E') {
      this.api.post('EmployeeSalary/EditEmployeeSalary/' + this.EMP_TRN_ID, employeesalary).subscribe({
        next: () => {
          this.pageloadDatewiseEmpSal();
          setTimeout(() => {
            this.toastr.success('Salary updated successfully');
            this.api.modalClose('EmpSalFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update salary');
          console.error(err);
        }
      });

    } else if (this.EMP_TRN_ID != 0 && this.btn == 'D') {
      if (this.Reason.trim() !== '') {
        this.api.delete('EmployeeSalary/DeleteEmployeeSalary/' + this.EMP_TRN_ID).subscribe({
          next: () => {
            this.pageloadDatewiseEmpSal();
            setTimeout(() => {
              this.toastr.success('Salary deleted successfully');
              this.api.modalClose('EmpSalFormModal');
              this.clearData();
              this.Reason = "";
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete salary');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning('Please fill in the reason before deleting.');
      }
    }
  }

  getDataById(EmpSalCode: number, btn: string) {
    this.btn = btn;
    this.api.get('EmployeeSalary/EmployeeSalary/' + EmpSalCode).subscribe((res: any) => {
      this.EMP_TRN_ID = res.emP_TRN_ID;
      this.data.patchValue({
        EMP_ID: res.emP_ID,
        EMP_PRICE: res.emP_PRICE,
        DATE: this.service.getFormattedDate(res.date, 8)
      });
    });
  }

  getEmployeeName(id: number): string {
    if (!this.employee || !Array.isArray(this.employee)) return 'Unknown';
    const emp = this.employee.find((e: any) => e.emP_ID == id);
    return emp ? emp.emP_NAME : 'Unknown';
  }

  filteredEmpSalary(): any[] {
    let result = this.employeesalary || [];
    // Apply search filter if searchTerm exists
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      result = result.filter((employeesalary: any) =>
        employeesalary.emP_PRICE?.toLowerCase().includes(searchTermLower)
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
