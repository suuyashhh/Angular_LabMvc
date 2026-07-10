import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-vegetables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="vegetables-container">
      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span class="text-uppercase text-muted fw-semibold small" style="letter-spacing: 1px;">MASTER</span>
          <h1 class="fw-bold mb-0">Vegetables</h1>
          <p class="text-muted mb-0">Manage the list of vegetables available for purchase.</p>
        </div>
        <button (click)="openAddDrawer()" class="btn btn-primary-green d-flex align-items-center gap-2 shadow-sm">
          <i class="bi bi-plus-lg"></i>
          <span>Add Vegetable</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="input-group shadow-sm border-0 rounded-3 overflow-hidden">
            <span class="input-group-text bg-white border-0"><i class="bi bi-search text-muted"></i></span>
            <input type="text" class="form-control border-0 ps-0 py-2.5" placeholder="Search vegetables..." [(ngModel)]="searchQuery">
          </div>
        </div>
      </div>

      <!-- Vegetables List -->
      <div class="row g-3">
        <div class="col-12 col-md-6 col-lg-4" *ngFor="let veg of filteredVegetables">
          <div class="veg-card p-3 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <div class="veg-icon-box">
                <i class="bi bi-egg-fried"></i>
              </div>
              <span class="fw-bold fs-5 text-truncate" style="max-width: 180px;">{{ veg.vegetableName }}</span>
            </div>
            <div class="d-flex gap-1">
              <button (click)="openEditDrawer(veg)" class="btn btn-sm btn-action-icon" title="Edit">
                <i class="bi bi-pencil text-secondary"></i>
              </button>
              <button (click)="confirmDelete(veg.id)" class="btn btn-sm btn-action-icon" title="Delete">
                <i class="bi bi-trash text-danger"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="col-12 text-center py-5 text-muted" *ngIf="filteredVegetables.length === 0">
          <i class="bi bi-egg-fried fs-1 d-block mb-2 text-light"></i>
          No vegetables found. Add a vegetable to get started.
        </div>
      </div>

      <!-- Slide Drawer (Overlay & Drawer Panel) -->
      <div class="drawer-backdrop" [class.show]="isDrawerOpen" (click)="closeDrawer()"></div>
      
      <div class="side-drawer" [class.show]="isDrawerOpen">
        <div class="drawer-header">
          <h4 class="fw-bold mb-0">{{ editMode ? 'Edit Vegetable' : 'Add Vegetable' }}</h4>
          <button type="button" class="btn-close" (click)="closeDrawer()"></button>
        </div>

        <div class="drawer-body">
          <form #vegForm="ngForm">
            <div class="mb-3">
              <label for="vegetableName" class="form-label text-uppercase fw-semibold" style="font-size: 11px;">Vegetable Name *</label>
              <input 
                type="text" 
                id="vegetableName" 
                name="vegetableName" 
                class="form-control" 
                [(ngModel)]="formData.vegetableName" 
                placeholder="e.g. Tomato, Potato, Onion"
                required
                #nameModel="ngModel"
                [class.is-invalid]="nameModel.touched && nameModel.invalid">
              <div class="invalid-feedback">Vegetable name is required.</div>
            </div>
          </form>
        </div>

        <div class="drawer-footer">
          <button type="button" class="btn btn-light-custom flex-grow-1 py-2.5" (click)="closeDrawer()">Cancel</button>
          <button 
            type="button" 
            class="btn btn-primary-green flex-grow-1 py-2.5" 
            (click)="saveVegetable()" 
            [disabled]="vegForm.invalid || isSaving">
            <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
            Save Vegetable
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .veg-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--card-shadow);
      transition: all 0.2s;
    }
    .veg-card:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    }
    .veg-icon-box {
      width: 40px;
      height: 40px;
      background: #eef1ec;
      border-radius: 8px;
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
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
export class VegetablesComponent implements OnInit {
  vegetables: any[] = [];
  searchQuery = '';

  isDrawerOpen = false;
  editMode = false;
  isSaving = false;

  formData: any = {
    id: 0,
    vegetableName: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadVegetables();
  }

  loadVegetables() {
    this.apiService.getVegetables().subscribe({
      next: (data) => this.vegetables = data,
      error: (err) => console.error(err)
    });
  }

  get filteredVegetables() {
    return this.vegetables.filter(v => 
      !this.searchQuery || v.vegetableName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openAddDrawer() {
    this.editMode = false;
    this.formData = {
      id: 0,
      vegetableName: ''
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(veg: any) {
    this.editMode = true;
    this.formData = { ...veg };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  saveVegetable() {
    if (!this.formData.vegetableName) return;

    this.isSaving = true;
    if (this.editMode) {
      this.apiService.updateVegetable(this.formData.id, this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadVegetables();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to update vegetable');
        }
      });
    } else {
      this.apiService.createVegetable(this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadVegetables();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to add vegetable');
        }
      });
    }
  }

  confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this vegetable?')) {
      this.apiService.deleteVegetable(id).subscribe({
        next: () => this.loadVegetables(),
        error: (err) => alert(err.error?.message || 'Failed to delete vegetable')
      });
    }
  }
}
