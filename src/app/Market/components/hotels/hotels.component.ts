import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hotels-container">
      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span class="text-uppercase text-muted fw-semibold small" style="letter-spacing: 1px;">MASTER</span>
          <h1 class="fw-bold mb-0">Hotels</h1>
          <p class="text-muted mb-0">Add and manage hotels you supply to.</p>
        </div>
        <button (click)="openAddDrawer()" class="btn btn-primary-green d-flex align-items-center gap-2 shadow-sm">
          <i class="bi bi-plus-lg"></i>
          <span>Add Hotel</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="input-group shadow-sm border-0 rounded-3 overflow-hidden">
            <span class="input-group-text bg-white border-0"><i class="bi bi-search text-muted"></i></span>
            <input type="text" class="form-control border-0 ps-0 py-2.5" placeholder="Search hotels..." [(ngModel)]="searchQuery">
          </div>
        </div>
      </div>

      <!-- Hotels Grid -->
      <div class="row g-3">
        <div class="col-12 col-md-6 col-lg-4" *ngFor="let hotel of filteredHotels">
          <div class="hotel-card p-4">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h4 class="fw-bold mb-0 text-truncate" style="max-width: 80%;" [title]="hotel.hotelName">{{ hotel.hotelName }}</h4>
              <div class="d-flex gap-1">
                <button (click)="openEditDrawer(hotel)" class="btn btn-sm btn-action-icon" title="Edit">
                  <i class="bi bi-pencil text-secondary"></i>
                </button>
                <button (click)="confirmDelete(hotel.id)" class="btn btn-sm btn-action-icon" title="Delete">
                  <i class="bi bi-trash text-danger"></i>
                </button>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2 text-muted mb-2 small">
              <i class="bi bi-geo-alt"></i>
              <span class="text-truncate">{{ hotel.address || 'No address provided' }}</span>
            </div>

            <div class="d-flex align-items-center gap-2 text-muted small">
              <i class="bi bi-telephone"></i>
              <span>{{ hotel.contactNumber || 'No phone number' }}</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="col-12 text-center py-5 text-muted" *ngIf="filteredHotels.length === 0">
          <i class="bi bi-building-exclamation fs-1 d-block mb-2 text-light"></i>
          No hotels found. Add a hotel to get started.
        </div>
      </div>

      <!-- Slide Drawer (Overlay & Drawer Panel) -->
      <div class="drawer-backdrop" [class.show]="isDrawerOpen" (click)="closeDrawer()"></div>
      
      <div class="side-drawer" [class.show]="isDrawerOpen">
        <div class="drawer-header">
          <h4 class="fw-bold mb-0">{{ editMode ? 'Edit Hotel' : 'Add Hotel' }}</h4>
          <button type="button" class="btn-close" (click)="closeDrawer()"></button>
        </div>

        <div class="drawer-body">
          <form #hotelForm="ngForm">
            <div class="mb-3">
              <label for="hotelName" class="form-label text-uppercase fw-semibold" style="font-size: 11px;">Hotel Name *</label>
              <input 
                type="text" 
                id="hotelName" 
                name="hotelName" 
                class="form-control" 
                [(ngModel)]="formData.hotelName" 
                placeholder="Enter hotel name"
                required
                #nameModel="ngModel"
                [class.is-invalid]="nameModel.touched && nameModel.invalid">
              <div class="invalid-feedback">Hotel name is required.</div>
            </div>

            <div class="mb-3">
              <label for="address" class="form-label text-uppercase fw-semibold" style="font-size: 11px;">Address</label>
              <textarea 
                id="address" 
                name="address" 
                class="form-control" 
                rows="4" 
                [(ngModel)]="formData.address" 
                placeholder="Enter address details"></textarea>
            </div>

            <div class="mb-3">
              <label for="contactNumber" class="form-label text-uppercase fw-semibold" style="font-size: 11px;">WhatsApp Contact Number</label>
              <input 
                type="text" 
                id="contactNumber" 
                name="contactNumber" 
                class="form-control" 
                [(ngModel)]="formData.contactNumber" 
                placeholder="+91 98765 43210">
              <span class="text-muted small d-block mt-1">Include country code for WhatsApp share.</span>
            </div>
          </form>
        </div>

        <div class="drawer-footer">
          <button type="button" class="btn btn-light-custom flex-grow-1 py-2.5" (click)="closeDrawer()">Cancel</button>
          <button 
            type="button" 
            class="btn btn-primary-green flex-grow-1 py-2.5" 
            (click)="saveHotel()" 
            [disabled]="hotelForm.invalid || isSaving">
            <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
            Save Hotel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hotel-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--card-shadow);
      transition: all 0.2s;
    }
    .hotel-card:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    }
    .btn-action-icon {
      background: #f7f8f5;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.2s;
    }
    .btn-action-icon:hover {
      background: #eef1ec;
    }
  `]
})
export class HotelsComponent implements OnInit {
  hotels: any[] = [];
  searchQuery = '';

  // Drawer states
  isDrawerOpen = false;
  editMode = false;
  isSaving = false;
  
  formData: any = {
    id: 0,
    hotelName: '',
    address: '',
    contactNumber: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadHotels();
  }

  loadHotels() {
    this.apiService.getHotels().subscribe({
      next: (data) => this.hotels = data,
      error: (err) => console.error(err)
    });
  }

  get filteredHotels() {
    return this.hotels.filter(h => 
      !this.searchQuery || h.hotelName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openAddDrawer() {
    this.editMode = false;
    this.formData = {
      id: 0,
      hotelName: '',
      address: '',
      contactNumber: ''
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(hotel: any) {
    this.editMode = true;
    this.formData = { ...hotel };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  saveHotel() {
    if (!this.formData.hotelName) return;

    this.isSaving = true;
    if (this.editMode) {
      this.apiService.updateHotel(this.formData.id, this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadHotels();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to update hotel');
        }
      });
    } else {
      this.apiService.createHotel(this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadHotels();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to add hotel');
        }
      });
    }
  }

  confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this hotel? All associated purchases will be deleted.')) {
      this.apiService.deleteHotel(id).subscribe({
        next: () => this.loadHotels(),
        error: (err) => alert(err.error?.message || 'Failed to delete hotel')
      });
    }
  }
}
