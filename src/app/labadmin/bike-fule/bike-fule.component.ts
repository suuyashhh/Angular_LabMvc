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
  selector: 'app-bike-fule',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule, FormattedDatePipe, NgxPaginationModule],
  templateUrl: './bike-fule.component.html',
  styleUrl: './bike-fule.component.css'
})
export class BikeFuleComponent implements OnInit {

  data!: FormGroup;
  bikefule: any;
  BIKE_ID: number = 0;
  ComId: number = 0;
  btn: string = '';
  submitted: boolean = false;
  loadingBikeFule = false;
  Reason: string = '';

  constructor(private api: ApiService, private toastr: ToastrService, private service: ServicesService) { }

  ngOnInit(): void {
    this.ComId = parseInt(localStorage.getItem('COM_ID') || '0');
    this.initForm();
    this.pageloadDatewiseBike();
  }

  formatDateToYyyyMmDd(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = ('0' + (date.getMonth() + 1)).slice(-2); // Fixed: using '0' not 'o'
    const dd = ('0' + date.getDate()).slice(-2);       // Fixed: using '0' not 'o'
    return `${yyyy}${mm}${dd}`;                        // Fixed: using proper template literals
  }

  pageloadDatewiseBike() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formattedStart = this.formatDateToYyyyMmDd(startOfMonth); // e.g. 20250801
    const formattedEnd = this.formatDateToYyyyMmDd(endOfMonth);     // e.g. 20250831

    this.getDateWiseBikeFule(formattedStart, formattedEnd); // Call on page load
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
      DATE: new FormControl(format(now), Validators.required),
      BIKE_NAME: new FormControl('', Validators.required),
      BIKE_PRICE: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      COM_ID: new FormControl()
    });
  }


  onDateChange() {
    const start = this.data.get('startDate')?.value;
    const end = this.data.get('endDate')?.value;

    if (start && end) {
      const startDate = this.formatDateToYyyyMmDd(new Date(start));
      const endDate = this.formatDateToYyyyMmDd(new Date(end));
      this.getDateWiseBikeFule(startDate, endDate);
    }
  }


  getDateWiseBikeFule(startDate: string, endDate: string) {
    this.loadingBikeFule = true;
    this.api.get('BikeFule/GetDateWiseBikeFule/' + startDate + ',' + endDate).subscribe({
      next: (res: any) => {
        this.bikefule = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load material list');
        console.error(err);
        this.bikefule = [];
      },
      complete: () => this.loadingBikeFule = false
    });
  }

  getBikeFule() {
    this.loadingBikeFule = true;
    this.api.get('BikeFule/BikeFules').subscribe({
      next: (res: any) => {
        this.bikefule = res;
      },
      error: (err) => {
        this.toastr.error('Failed to load bike fuel list');
        console.error(err);
        this.bikefule = [];
      },
      complete: () => this.loadingBikeFule = false
    });
  }

  clearData() {
    this.BIKE_ID = 0;
    this.btn = '';
    this.data.reset();
    this.initForm();
  }


  searchTerm: string = '';
  page: number = 1;
  readonly pageSize: number = 10;

  submit(bike: any) {
    this.submitted = true;

    if (this.data.invalid) {
      this.toastr.error('Please fix validation errors.');
      return;
    }

    const rawDate = this.data.get('DATE')?.value;
    const parts = rawDate.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    bike.DATE = this.service.getFormattedDate(formatted, 1);

    if (this.BIKE_ID == 0 && this.btn == '') {
      this.api.post('BikeFule/SaveBikeFule', bike).subscribe({
        next: () => {
          this.pageloadDatewiseBike();
          setTimeout(() => {
            this.toastr.success('Bike fuel added successfully');
            this.api.modalClose('bikeFormModal');
            this.clearData();
          }, 300);
        },
        error: (err) => {
          this.toastr.error('Failed to add bike fuel');
          console.error(err);
        }
      });

    } else if (this.BIKE_ID != 0 && this.btn == 'E') {
      this.api.post('BikeFule/EditBikeFule/' + this.BIKE_ID, bike).subscribe({
        next: () => {
          this.pageloadDatewiseBike();
          setTimeout(() => {
            this.toastr.success('Bike fuel updated successfully');
            this.api.modalClose('bikeFormModal');
            this.clearData();
          }, 200);
        },
        error: (err) => {
          this.toastr.error('Failed to update bike fuel');
          console.error(err);
        }
      });

    } else if (this.BIKE_ID != 0 && this.btn == 'D') {
      if (this.Reason.trim() !== '') {
        this.api.delete('BikeFule/DeleteBikeFule/' + this.BIKE_ID).subscribe({
          next: () => {
            this.getBikeFule();
            setTimeout(() => {
              this.toastr.success('Bike fuel deleted successfully');
              this.api.modalClose('bikeFormModal');
              this.clearData();
              this.Reason = "";
            }, 200);
          },
          error: (err) => {
            this.toastr.error('Failed to delete bike fuel');
            console.error(err);
          }
        });
      } else {
        this.toastr.warning('Please fill in the reason before deleting.');
      }
    }
  }

  getDataById(bikeCode: number, btn: string) {
    this.btn = btn;
    this.api.get('BikeFule/BikeFule/' + bikeCode).subscribe((res: any) => {
      this.BIKE_ID = res.bikE_ID;
      this.data.patchValue({
        DATE: this.service.getFormattedDate(res.date, 8),
        BIKE_NAME: res.bikE_NAME,
        BIKE_PRICE: res.bikE_PRICE
      });
    });
  }


  filteredBikeFules(): any[] {
    let result = this.bikefule || [];

    // Apply search filter if searchTerm exists
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      result = result.filter((bikefule: any) =>
        bikefule.bikE_NAME?.toLowerCase().includes(searchTermLower)
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
