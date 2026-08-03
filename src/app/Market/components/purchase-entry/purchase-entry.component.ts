import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-purchase-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './purchase-entry.component.html',
  styleUrl: './purchase-entry.component.css'
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
  showMarathiInTable = false;

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
        this.showMarathiInTable = data.showMarathi || false;
        
        // Populate items
        this.itemsList = data.items.map((item: any) => {
          const parts = (item.vegetableName || '').split(' - ');
          const engName = parts[0]?.trim() || '';
          const marName = parts[1]?.trim() || '';

          return {
            vegetableId: item.vegetableId,
            engVegetableName: engName,
            marVegetableName: marName,
            vegetableName: this.showMarathiInTable && marName ? marName : engName,
            quantity: item.quantity,
            pricePerKg: item.pricePerKg,
            total: item.total
          };
        });
      },
      error: (err) => alert('Failed to load purchase details for edit.')
    });
  }

  onLanguageToggleChange() {
    this.itemsList = this.itemsList.map(item => ({
      ...item,
      vegetableName: this.showMarathiInTable && item.marVegetableName 
        ? item.marVegetableName 
        : item.engVegetableName
    }));
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
      engVegetableName: veg.engVegetableName,
      marVegetableName: veg.marVegetableName,
      vegetableName: this.showMarathiInTable && veg.marVegetableName
        ? veg.marVegetableName
        : veg.engVegetableName,
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
      !this.vegSearchQuery || 
      v.engVegetableName?.toLowerCase().includes(this.vegSearchQuery.toLowerCase()) ||
      v.marVegetableName?.toLowerCase().includes(this.vegSearchQuery.toLowerCase())
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
      showMarathi: this.showMarathiInTable,
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
