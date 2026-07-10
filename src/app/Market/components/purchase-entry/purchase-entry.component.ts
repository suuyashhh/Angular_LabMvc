import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-purchase-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="purchase-entry-container pb-5">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 no-print">
        <div class="d-flex align-items-center gap-3">
          <button routerLink="/market/dashboard" class="btn btn-light-custom btn-icon-only">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div>
            <span class="text-uppercase text-muted fw-semibold small" style="letter-spacing: 1px;">
              {{ editMode ? 'EDIT ENTRY' : 'NEW ENTRY' }}
            </span>
            <h1 class="fw-bold mb-0">Purchase Bill</h1>
          </div>
        </div>
        <button (click)="saveEntry()" class="btn btn-primary-green px-4 py-2.5 d-flex align-items-center gap-2" [disabled]="isSaving">
          <span *ngIf="isSaving" class="spinner-border spinner-border-sm"></span>
          <span>Save Entry</span>
        </button>
      </div>

      <!-- Main Form -->
      <div class="row g-4">
        <!-- Hotel & Date Selection Card -->
        <div class="col-12">
          <div class="entry-card p-4">
            <div class="row g-3">
              <!-- Searchable Hotel Dropdown -->
              <div class="col-md-8 position-relative">
                <label class="form-label text-uppercase fw-semibold" style="font-size: 11px;">Hotel *</label>
                <div class="dropdown-trigger-box" (click)="toggleHotelDropdown($event)">
                  <span *ngIf="selectedHotel">{{ selectedHotel.hotelName }}</span>
                  <span class="text-muted" *ngIf="!selectedHotel">Search hotel by name...</span>
                  <i class="bi bi-chevron-down ms-auto text-muted"></i>
                </div>

                <!-- Custom Dropdown Menu -->
                <div class="custom-dropdown-menu p-3 shadow-lg" *ngIf="showHotelDropdown">
                  <input 
                    type="text" 
                    class="form-control mb-2" 
                    placeholder="Search hotel by name..." 
                    [(ngModel)]="hotelSearchQuery"
                    (click)="$event.stopPropagation()"
                    #hotelSearchInput>
                  
                  <div class="dropdown-options-list">
                    <div 
                      class="dropdown-option-item p-2" 
                      *ngFor="let hotel of filteredHotels"
                      (click)="selectHotel(hotel, $event)">
                      <div class="fw-bold">{{ hotel.hotelName }}</div>
                      <div class="text-muted small fs-7">{{ hotel.address || 'No Address' }} · {{ hotel.contactNumber || 'No Phone' }}</div>
                    </div>
                    <div class="text-muted text-center py-2 small" *ngIf="filteredHotels.length === 0">
                      No hotels found.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Date Picker -->
              <div class="col-md-4">
                <label for="date" class="form-label text-uppercase fw-semibold" style="font-size: 11px;">Date *</label>
                <input 
                  type="date" 
                  id="date" 
                  class="form-control" 
                  [(ngModel)]="entryDate"
                  (keydown.enter)="onEnter($event)">
              </div>
            </div>
          </div>
        </div>

        <!-- Vegetables Entry Table Card -->
        <div class="col-12">
          <div class="entry-card p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span class="text-uppercase text-muted fw-semibold small" style="letter-spacing: 0.5px;">ITEMS</span>
                <h4 class="fw-bold mb-0">Vegetables</h4>
              </div>
              <span class="small text-muted">{{ itemsList.length }} rows</span>
            </div>

            <!-- Items Table -->
            <div class="table-responsive mb-4" *ngIf="itemsList.length > 0">
              <table class="table align-middle">
                <thead>
                  <tr class="text-muted uppercase small" style="font-size: 11px; letter-spacing: 0.5px;">
                    <th style="width: 45%;">Vegetable</th>
                    <th style="width: 15%;">Qty (KG)</th>
                    <th style="width: 15%;">Price / KG</th>
                    <th style="width: 15%;">Total</th>
                    <th style="width: 10%;" class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of itemsList; let idx = index">
                    <td class="fw-bold">{{ item.vegetableName }}</td>
                    <td>
                      <input 
                        type="number" 
                        class="form-control py-1 px-2 text-center" 
                        [(ngModel)]="item.quantity" 
                        (ngModelChange)="calculateRowTotal(item)"
                        (keydown.enter)="onEnter($event)"
                        min="0.01">
                    </td>
                    <td>
                      <div class="input-group input-group-sm">
                        <span class="input-group-text bg-light border-end-0">₹</span>
                        <input 
                          type="number" 
                          class="form-control py-1 px-2 border-start-0 ps-0" 
                          [(ngModel)]="item.pricePerKg" 
                          (ngModelChange)="calculateRowTotal(item)"
                          (keydown.enter)="onEnter($event)"
                          min="0">
                      </div>
                    </td>
                    <td class="fw-bold">₹{{ item.total | number:'1.2-2' }}</td>
                    <td class="text-end">
                      <button (click)="removeItem(idx)" class="btn btn-sm btn-outline-danger border-0">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                  <!-- Grand Total Row -->
                  <tr class="table-light">
                    <td colspan="3" class="text-end fw-bold">Grand Total</td>
                    <td colspan="2" class="fw-extrabold text-success fs-5">₹{{ grandTotal | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Empty Items State -->
            <div class="text-center py-4 border border-dashed rounded-3 mb-4" *ngIf="itemsList.length === 0">
              <span class="text-muted small">No vegetable items added to bill yet. Select a vegetable below to add.</span>
            </div>

            <!-- Vegetable searchable select dropdown -->
            <div class="position-relative">
              <label class="form-label text-uppercase fw-semibold" style="font-size: 11px;">Add Vegetable</label>
              <div class="dropdown-trigger-box" (click)="toggleVegetableDropdown($event)">
                <span class="text-muted">Type to search vegetables...</span>
                <i class="bi bi-chevron-down ms-auto text-muted"></i>
              </div>

              <!-- Custom Vegetable Dropdown Menu -->
              <div class="custom-dropdown-menu p-3 shadow-lg" *ngIf="showVegetableDropdown">
                <input 
                  type="text" 
                  class="form-control mb-2" 
                  placeholder="Type to search vegetables..." 
                  [(ngModel)]="vegSearchQuery"
                  (click)="$event.stopPropagation()"
                  #vegSearchInput>
                
                <div class="dropdown-options-list">
                  <div 
                    class="dropdown-option-item p-2 d-flex justify-content-between align-items-center" 
                    *ngFor="let veg of filteredVegetables"
                    [class.disabled]="isVegAdded(veg.id)"
                    (click)="!isVegAdded(veg.id) && selectVegetable(veg, $event)">
                    <span class="fw-bold" [class.text-muted]="isVegAdded(veg.id)">{{ veg.vegetableName }}</span>
                    <span class="badge bg-light text-muted small fs-8" *ngIf="isVegAdded(veg.id)">already added</span>
                  </div>
                  <div class="text-muted text-center py-2 small" *ngIf="filteredVegetables.length === 0">
                    No vegetables found.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Card -->
        <div class="col-12">
          <div class="entry-card p-4">
            <h4 class="fw-bold mb-3">Payment</h4>

            <div class="row g-4">
              <!-- Payment Method Radios -->
              <div class="col-md-6">
                <label class="form-label text-uppercase fw-semibold mb-2" style="font-size: 11px;">Payment Method</label>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="payment-radio-card" [class.active]="paymentMethod === 'Cash'">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="Cash" 
                        [(ngModel)]="paymentMethod"
                        (change)="onPaymentMethodChange()">
                      <div class="fw-bold">Cash</div>
                      <span class="small text-muted">Physical cash payment</span>
                    </label>
                  </div>
                  <div class="col-6">
                    <label class="payment-radio-card" [class.active]="paymentMethod === 'Online'">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="Online" 
                        [(ngModel)]="paymentMethod"
                        (change)="onPaymentMethodChange()">
                      <div class="fw-bold">Online</div>
                      <span class="small text-muted">UPI, bank transfer, etc.</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Payment Screenshot Upload -->
              <div class="col-md-6" *ngIf="paymentMethod === 'Online'">
                <label class="form-label text-uppercase fw-semibold mb-2" style="font-size: 11px;">Payment Screenshot (optional)</label>
                <div class="d-flex align-items-center gap-3">
                  <!-- Dotted Dnd Box -->
                  <label class="screenshot-upload-box" *ngIf="!uploadedImageUrl">
                    <i class="bi bi-upload mb-1 fs-4"></i>
                    <span class="small fw-semibold">Upload Image</span>
                    <input type="file" (change)="onImageUpload($event)" class="d-none" accept="image/*">
                  </label>
                  
                  <!-- Preview -->
                  <div class="uploaded-image-preview-container position-relative" *ngIf="uploadedImageUrl">
                    <img [src]="getImageUrl(uploadedImageUrl)" class="img-fluid rounded-3 border">
                    <button (click)="removeImage()" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 24px; height: 24px;">
                      <i class="bi bi-x small"></i>
                    </button>
                  </div>

                  <div class="small text-muted" *ngIf="!uploadedImageUrl">
                    Attach the UPI/bank screenshot for record. Max 3 MB.
                  </div>
                  <div class="small text-muted" *ngIf="isUploading">
                    <div class="spinner-border spinner-border-sm text-success me-1" role="status"></div>
                    Uploading...
                  </div>
                </div>
              </div>
            </div>

            <!-- Financial Totals Section -->
            <div class="row g-3 align-items-center border-top pt-4 mt-4">
              <div class="col-md-4 text-center text-md-start">
                <span class="text-uppercase text-muted fw-bold small" style="font-size: 10px;">Grand Total</span>
                <h3 class="fw-extrabold text-success mb-0">₹{{ grandTotal | number:'1.2-2' }}</h3>
              </div>

              <div class="col-md-4">
                <label for="paidAmount" class="form-label text-uppercase fw-semibold mb-1" style="font-size: 11px;">Paid Amount</label>
                <input 
                  type="number" 
                  id="paidAmount" 
                  class="form-control" 
                  [(ngModel)]="paidAmount" 
                  placeholder="0.00"
                  (keydown.enter)="onEnter($event)"
                  min="0">
              </div>

              <div class="col-md-4 text-center text-md-end">
                <span class="text-uppercase text-muted fw-bold small" style="font-size: 10px;">Remaining</span>
                <h3 class="fw-extrabold text-danger mb-0">₹{{ remainingAmount | number:'1.2-2' }}</h3>
              </div>
            </div>

            <!-- Notes Section -->
            <div class="row mt-4">
              <div class="col-12">
                <label for="notes" class="form-label text-uppercase fw-semibold" style="font-size: 11px;">Notes (optional)</label>
                <textarea 
                  id="notes" 
                  class="form-control" 
                  rows="3" 
                  placeholder="Write notes about this purchase..." 
                  [(ngModel)]="notes"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .entry-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: var(--card-shadow);
    }
    .btn-icon-only {
      width: 40px;
      height: 40px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .dropdown-trigger-box {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px 14px;
      background: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      min-height: 44px;
    }
    .custom-dropdown-menu {
      position: absolute;
      top: 100%;
      left: 12px;
      right: 12px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      z-index: 1000;
      margin-top: 4px;
    }
    .dropdown-options-list {
      max-height: 200px;
      overflow-y: auto;
    }
    .dropdown-option-item {
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .dropdown-option-item:hover {
      background: #f7f8f5;
    }
    .dropdown-option-item.disabled {
      cursor: not-allowed;
      opacity: 0.6;
      background: #fdfdfd;
    }
    .payment-radio-card {
      display: block;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      background: #ffffff;
      transition: all 0.2s;
    }
    .payment-radio-card input[type="radio"] {
      display: none;
    }
    .payment-radio-card.active {
      border-color: var(--primary-color);
      background-color: #f7f9f5;
      box-shadow: 0 0 0 3px rgba(43, 92, 46, 0.08);
    }
    .screenshot-upload-box {
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      width: 100px;
      height: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      background: #fcfdfa;
      transition: border-color 0.2s;
    }
    .screenshot-upload-box:hover {
      border-color: var(--primary-color);
    }
    .uploaded-image-preview-container {
      width: 100px;
      height: 100px;
      overflow: hidden;
      border-radius: 12px;
    }
    .uploaded-image-preview-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `]
})
export class PurchaseEntryComponent implements OnInit {
  editMode = false;
  entryId: number = 0;
  isSaving = false;

  // Master lists
  hotelsList: any[] = [];
  vegetablesList: any[] = [];

  // Dropdown states
  showHotelDropdown = false;
  showVegetableDropdown = false;
  hotelSearchQuery = '';
  vegSearchQuery = '';

  // Form selections
  selectedHotel: any = null;
  entryDate = '';
  itemsList: any[] = [];
  paymentMethod: 'Cash' | 'Online' = 'Cash';
  uploadedImageUrl: string | null = null;
  isUploading = false;
  paidAmount = 0;
  notes = '';

  constructor(
    public apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const today = new Date();
    this.entryDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadMasters();
  }

  loadMasters() {
    // Load Hotels
    this.apiService.getHotels().subscribe({
      next: (h) => {
        this.hotelsList = h;
        // Load Vegetables
        this.apiService.getVegetables().subscribe({
          next: (v) => {
            this.vegetablesList = v;
            // Check if we are in Edit Mode
            this.route.params.subscribe(params => {
              if (params['id']) {
                this.editMode = true;
                this.entryId = +params['id'];
                this.loadEntryForEdit(this.entryId);
              }
            });
          }
        });
      }
    });
  }

  loadEntryForEdit(id: number) {
    this.apiService.getPurchase(id).subscribe({
      next: (data) => {
        this.selectedHotel = this.hotelsList.find(h => h.id === data.hotelId);
        this.entryDate = new Date(data.date).toISOString().split('T')[0];
        this.paymentMethod = data.paymentMethod;
        this.uploadedImageUrl = data.paymentImage;
        this.paidAmount = data.paidAmount;
        this.notes = data.notes || '';
        
        // Populate items
        this.itemsList = data.items.map((item: any) => ({
          vegetableId: item.vegetableId,
          vegetableName: item.vegetableName,
          quantity: item.quantity,
          pricePerKg: item.pricePerKg,
          total: item.total
        }));
      },
      error: (err) => alert('Failed to load purchase details for edit.')
    });
  }

  // Hotel Custom Dropdown helpers
  toggleHotelDropdown(event: Event) {
    event.stopPropagation();
    this.showHotelDropdown = !this.showHotelDropdown;
    this.showVegetableDropdown = false;
    this.hotelSearchQuery = '';
  }

  selectHotel(hotel: any, event: Event) {
    event.stopPropagation();
    this.selectedHotel = hotel;
    this.showHotelDropdown = false;
  }

  get filteredHotels() {
    return this.hotelsList.filter(h =>
      !this.hotelSearchQuery || h.hotelName?.toLowerCase().includes(this.hotelSearchQuery.toLowerCase())
    );
  }

  // Vegetable Custom Dropdown helpers
  toggleVegetableDropdown(event: Event) {
    event.stopPropagation();
    this.showVegetableDropdown = !this.showVegetableDropdown;
    this.showHotelDropdown = false;
    this.vegSearchQuery = '';
  }

  selectVegetable(veg: any, event: Event) {
    event.stopPropagation();
    // Add Row
    this.itemsList.push({
      vegetableId: veg.id,
      vegetableName: veg.vegetableName,
      quantity: 1,
      pricePerKg: 0,
      total: 0
    });
    this.showVegetableDropdown = false;
  }

  isVegAdded(id: number): boolean {
    return this.itemsList.some(item => item.vegetableId === id);
  }

  get filteredVegetables() {
    return this.vegetablesList.filter(v =>
      !this.vegSearchQuery || v.vegetableName?.toLowerCase().includes(this.vegSearchQuery.toLowerCase())
    );
  }

  // Grid/Calculations helpers
  calculateRowTotal(item: any) {
    const qty = item.quantity || 0;
    const price = item.pricePerKg || 0;
    item.total = qty * price;
  }

  removeItem(index: number) {
    this.itemsList.splice(index, 1);
  }

  get grandTotal(): number {
    return this.itemsList.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }

  get remainingAmount(): number {
    return Math.max(0, this.grandTotal - (this.paidAmount || 0));
  }

  // Keyboard navigation helper
  onEnter(event: any) {
    event.preventDefault();
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled])')) as HTMLElement[];
    const index = inputs.indexOf(event.target);
    if (index > -1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  }

  onPaymentMethodChange() {
    if (this.paymentMethod === 'Cash') {
      this.uploadedImageUrl = null;
    }
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.apiService.uploadScreenshot(file).subscribe({
      next: (res) => {
        this.uploadedImageUrl = res.url;
        this.isUploading = false;
      },
      error: () => {
        this.isUploading = false;
        alert('Image upload failed.');
      }
    });
  }

  removeImage() {
    this.uploadedImageUrl = null;
  }

  saveEntry() {
    if (!this.selectedHotel) {
      alert('Please select a hotel.');
      return;
    }
    if (!this.entryDate) {
      alert('Please select a date.');
      return;
    }
    if (this.itemsList.length === 0) {
      alert('Please add at least one vegetable.');
      return;
    }
    
    // Validate quantities and prices
    for (const item of this.itemsList) {
      if (item.quantity <= 0) {
        alert(`Quantity for ${item.vegetableName} must be greater than 0.`);
        return;
      }
      if (item.pricePerKg < 0) {
        alert(`Price for ${item.vegetableName} must be positive.`);
        return;
      }
    }

    this.isSaving = true;

    const payload = {
      id: this.entryId,
      hotelId: this.selectedHotel.id,
      date: new Date(this.entryDate).toISOString(),
      paymentMethod: this.paymentMethod,
      paidAmount: this.paidAmount || 0,
      paymentImage: this.uploadedImageUrl,
      grandTotal: this.grandTotal,
      notes: this.notes,
      items: this.itemsList.map(item => ({
        vegetableId: item.vegetableId,
        quantity: item.quantity,
        pricePerKg: item.pricePerKg,
        total: item.total
      }))
    };

    if (this.editMode) {
      this.apiService.updatePurchase(this.entryId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/market/dashboard']);
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to save purchase entry.');
        }
      });
    } else {
      this.apiService.createPurchase(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/market/dashboard']);
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to save purchase entry.');
        }
      });
    }
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    // If it is already a full URL, return it
    if (path.startsWith('http')) return path;
    
    // Get host from baseurl
    try {
      const url = new URL(this.apiService.getHostUrl());
      return url.origin + path;
    } catch {
      // Fallback
      return 'https://backend.suyashpatil.in' + path;
    }
  }
}
