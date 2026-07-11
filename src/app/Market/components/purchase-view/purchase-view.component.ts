import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-purchase-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './purchase-view.component.html',
  styleUrl: './purchase-view.component.css'
})
export class PurchaseViewComponent implements OnInit, AfterViewChecked {
  purchase: any = null;
  isPrintMode = false;
  zoomScreenshot = false;
  printTriggered = false;

  constructor(
    public apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.url.subscribe(url => {
      this.isPrintMode = url.some(segment => segment.path === 'print');
    });

    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadPurchase(id);
    });
  }

  ngAfterViewChecked() {
    if (this.isPrintMode && this.purchase && !this.printTriggered) {
      this.printTriggered = true;
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }

  loadPurchase(id: number) {
    this.apiService.getPurchase(id).subscribe({
      next: (data) => this.purchase = data,
      error: (err) => alert('Failed to load purchase details.')
    });
  }

  printBill() {
    window.open(`/market/purchase/print/${this.purchase.id}`, '_blank');
  }

  shareBill() {
    const dateStr = new Date(this.purchase.date).toLocaleDateString('en-IN');
    const text = `*VegBook Purchase Bill*\n\n*Date:* ${dateStr}\n*Hotel:* ${this.purchase.hotelName}\n*Total:* ₹${this.purchase.grandTotal}\n*Paid:* ₹${this.purchase.paidAmount}\n*Due:* ₹${(this.purchase.grandTotal - this.purchase.paidAmount).toFixed(2)}\n\nView details: ${window.location.origin}/market/purchase/view/${this.purchase.id}`;
    
    let cleanNumber = this.purchase.contactNumber ? this.purchase.contactNumber.replace(/[^0-9]/g, '') : '';
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    try {
      const url = new URL(this.apiService.getHostUrl());
      return url.origin + path;
    } catch {
      return 'https://backend.suyashpatil.in' + path;
    }
  }
}
