import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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
