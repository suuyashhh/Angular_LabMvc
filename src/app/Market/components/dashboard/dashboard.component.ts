import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Page Header -->
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <span class="text-uppercase text-muted fw-semibold small" style="letter-spacing: 1px;">LEDGER · {{ todayStr }}</span>
          <h1 class="fw-bold mb-0">Dashboard</h1>
          <p class="text-muted mb-0">Track vegetable purchases across all hotels.</p>
        </div>
        <button routerLink="/market/purchase/add" class="btn btn-primary-green d-flex align-items-center gap-2 shadow-sm">
          <i class="bi bi-plus-lg"></i>
          <span>Add Purchase Entry</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="row g-3 mb-4" *ngIf="stats">
        <div class="col-6 col-md-4 col-lg-2.4 col-custom">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="stat-title">Total Hotels</span>
              <i class="bi bi-building text-muted"></i>
            </div>
            <h2 class="stat-value">{{ stats.totalHotels }}</h2>
          </div>
        </div>

        <div class="col-6 col-md-4 col-lg-2.4 col-custom">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="stat-title">Vegetables</span>
              <i class="bi bi-egg-fried text-muted"></i>
            </div>
            <h2 class="stat-value">{{ stats.totalVegetables }}</h2>
          </div>
        </div>

        <div class="col-6 col-md-4 col-lg-2.4 col-custom">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="stat-title">Purchase Entries</span>
              <i class="bi bi-file-earmark-text text-muted"></i>
            </div>
            <h2 class="stat-value">{{ stats.totalPurchaseEntries }}</h2>
          </div>
        </div>

        <div class="col-6 col-md-6 col-lg-2.4 col-custom">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="stat-title">Today's Total</span>
              <i class="bi bi-calendar-event text-danger"></i>
            </div>
            <h2 class="stat-value text-success">₹{{ stats.todayPurchaseTotal | number:'1.2-2' }}</h2>
          </div>
        </div>

        <div class="col-12 col-md-6 col-lg-2.4 col-custom">
          <div class="stat-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="stat-title">Overall Total</span>
              <i class="bi bi-wallet2 text-success"></i>
            </div>
            <h2 class="stat-value text-success">₹{{ stats.overallPurchaseTotal | number:'1.2-2' }}</h2>
          </div>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="filters-panel p-4 mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="text-uppercase fw-semibold text-muted small" style="letter-spacing: 0.5px;"><i class="bi bi-filter me-2"></i>Filters</span>
          <span class="small text-muted">{{ filteredEntries.length }} entries</span>
        </div>
        <div class="row g-3">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
              <input type="text" class="form-control border-start-0 ps-0" placeholder="Search hotel..." [(ngModel)]="searchHotel">
            </div>
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" [(ngModel)]="searchDate">
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="filterPayment">
              <option value="All">All payments</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <div class="col-md-2.5 col-sm-6 flex-grow-1">
            <input type="number" class="form-control" placeholder="Min amount" [(ngModel)]="minAmount">
          </div>
          <div class="col-md-2.5 col-sm-6 flex-grow-1">
            <input type="number" class="form-control" placeholder="Max amount" [(ngModel)]="maxAmount">
          </div>
        </div>
      </div>

      <!-- Entries Table -->
      <div class="custom-table-container">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Hotel</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Paid</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of filteredEntries">
                <td class="fw-medium text-secondary">{{ entry.date | date:'dd MMM yyyy' }}</td>
                <td>
                  <div class="fw-bold">{{ entry.hotelName }}</div>
                  <div class="text-muted small" *ngIf="entry.contactNumber">{{ entry.contactNumber }}</div>
                </td>
                <td class="fw-bold">₹{{ entry.grandTotal | number:'1.2-2' }}</td>
                <td>
                  <span [class]="entry.paymentMethod === 'Online' ? 'badge-online' : 'badge-cash'">
                    {{ entry.paymentMethod }}
                  </span>
                </td>
                <td>
                  <div class="fw-bold text-success">₹{{ entry.paidAmount | number:'1.2-2' }}</div>
                  <div class="small text-danger" *ngIf="entry.grandTotal - entry.paidAmount > 0">
                    Due ₹{{ (entry.grandTotal - entry.paidAmount) | number:'1.2-2' }}
                  </div>
                </td>
                <td class="text-end">
                  <div class="d-inline-flex gap-2">
                    <button [routerLink]="['/market/purchase/view', entry.id]" class="btn btn-sm btn-icon" title="View">
                      <i class="bi bi-eye text-primary"></i>
                    </button>
                    <button [routerLink]="['/market/purchase/edit', entry.id]" class="btn btn-sm btn-icon" title="Edit">
                      <i class="bi bi-pencil text-secondary"></i>
                    </button>
                    <button (click)="printEntry(entry.id)" class="btn btn-sm btn-icon" title="Print">
                      <i class="bi bi-printer text-dark"></i>
                    </button>
                    <button (click)="shareEntry(entry)" class="btn btn-sm btn-icon" title="Share">
                      <i class="bi bi-share text-success"></i>
                    </button>
                    <button (click)="confirmDelete(entry.id)" class="btn btn-sm btn-icon" title="Delete">
                      <i class="bi bi-trash text-danger"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredEntries.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-clipboard-x fs-1 d-block mb-2 text-light"></i>
                  No purchase entries found matching the filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-panel {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--card-shadow);
    }
    .stat-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-light);
      font-weight: 600;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0;
    }
    .btn-icon {
      background: #f7f8f5;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.2s;
    }
    .btn-icon:hover {
      background: #eef1ec;
      border-color: #d1d5cb;
    }
    .col-custom {
      flex: 0 0 auto;
    }
    @media (min-width: 992px) {
      .col-lg-2\\.4 {
        width: 20%;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  entries: any[] = [];
  todayStr = '';

  // Filter bindings
  searchHotel = '';
  searchDate = '';
  filterPayment = 'All';
  minAmount?: number;
  maxAmount?: number;

  constructor(private apiService: ApiService, private router: Router) {
    const today = new Date();
    this.todayStr = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadStats();
    this.loadEntries();
  }

  loadStats() {
    this.apiService.getStats().subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error(err)
    });
  }

  loadEntries() {
    this.apiService.getPurchases().subscribe({
      next: (data) => this.entries = data,
      error: (err) => console.error(err)
    });
  }

  confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this purchase entry?')) {
      this.apiService.deletePurchase(id).subscribe({
        next: () => {
          this.loadEntries();
          this.loadStats();
        },
        error: (err) => alert(err.error?.message || 'Failed to delete purchase entry')
      });
    }
  }

  printEntry(id: number) {
    window.open(`/market/purchase/print/${id}`, '_blank');
  }

  shareEntry(entry: any) {
    const text = `*VegBook Purchase Bill*\n\n*Date:* ${new Date(entry.date).toLocaleDateString('en-IN')}\n*Hotel:* ${entry.hotelName}\n*Total:* ₹${entry.grandTotal}\n*Paid:* ₹${entry.paidAmount}\n*Due:* ₹${(entry.grandTotal - entry.paidAmount).toFixed(2)}\n\nView details: ${window.location.origin}/market/purchase/view/${entry.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Purchase Bill',
        text: text,
        url: `${window.location.origin}/market/purchase/view/${entry.id}`
      }).catch(err => console.log(err));
    } else {
      const cleanNumber = entry.contactNumber ? entry.contactNumber.replace(/[^0-9]/g, '') : '';
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  }

  get filteredEntries() {
    return this.entries.filter(e => {
      const matchesHotel = !this.searchHotel || e.hotelName?.toLowerCase().includes(this.searchHotel.toLowerCase());
      
      let matchesDate = true;
      if (this.searchDate) {
        const entryDate = new Date(e.date).toISOString().split('T')[0];
        matchesDate = entryDate === this.searchDate;
      }
      
      const matchesPayment = this.filterPayment === 'All' || e.paymentMethod === this.filterPayment;
      
      const matchesMin = this.minAmount === undefined || this.minAmount === null || e.grandTotal >= this.minAmount;
      const matchesMax = this.maxAmount === undefined || this.maxAmount === null || e.grandTotal <= this.maxAmount;
      
      return matchesHotel && matchesDate && matchesPayment && matchesMin && matchesMax;
    });
  }
}
