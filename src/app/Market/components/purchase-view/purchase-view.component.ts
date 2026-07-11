import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { jsPDF } from 'jspdf';

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
    if (!this.purchase) return;

    // 1. Generate PDF Blob
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Styling
    const primaryColor = [43, 92, 46];
    const textColor = [30, 37, 28];
    const lightGrey = [245, 247, 243];

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('VegBook', 15, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('PURCHASE LEDGER BILL', 15, 25);

    doc.setFontSize(10);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Invoice #: ${this.purchase.id}`, 140, 20);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${new Date(this.purchase.date).toLocaleDateString('en-IN')}`, 140, 25);

    doc.setDrawColor(220, 220, 220);
    doc.line(15, 30, 195, 30);

    // Hotel Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BILLED TO:', 15, 40);
    doc.setFont('Helvetica', 'normal');
    doc.text(this.purchase.hotelName || 'N/A', 15, 45);
    let currentY = 50;
    if (this.purchase.contactNumber) {
      doc.text(`Contact: ${this.purchase.contactNumber}`, 15, currentY);
      currentY += 5;
    }
    if (this.purchase.address) {
      doc.text(`Address: ${this.purchase.address}`, 15, currentY);
      currentY += 5;
    }

    // Table headers
    let y = Math.max(currentY + 5, 65);
    doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
    doc.rect(15, y, 180, 8, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Vegetable Item', 18, y + 5.5);
    doc.text('Quantity', 95, y + 5.5, { align: 'right' });
    doc.text('Price / KG', 145, y + 5.5, { align: 'right' });
    doc.text('Total', 190, y + 5.5, { align: 'right' });

    y += 8;

    // Table items
    doc.setFont('Helvetica', 'normal');
    const items = this.purchase.items || [];
    items.forEach((item: any) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const cleanedName = (item.vegetableName || 'Item').replace(/[^\x00-\x7F]/g, "").trim().replace(/\s+-\s*$/, "") || item.vegetableName;
      doc.text(cleanedName, 18, y + 5.5);
      doc.text(`${item.quantity} KG`, 95, y + 5.5, { align: 'right' });
      doc.text(`Rs ${item.pricePerKg.toFixed(2)}`, 145, y + 5.5, { align: 'right' });
      doc.text(`Rs ${item.total.toFixed(2)}`, 190, y + 5.5, { align: 'right' });
      y += 8;
    });

    doc.line(15, y, 195, y);
    y += 6;

    // Totals
    doc.setFont('Helvetica', 'bold');
    doc.text('Grand Total:', 130, y + 2);
    doc.text(`Rs ${(this.purchase.grandTotal || 0).toFixed(2)}`, 190, y + 2, { align: 'right' });

    doc.text('Paid Amount:', 130, y + 8);
    doc.text(`Rs ${(this.purchase.paidAmount || 0).toFixed(2)}`, 190, y + 8, { align: 'right' });

    const remaining = (this.purchase.grandTotal || 0) - (this.purchase.paidAmount || 0);
    doc.setTextColor(200, 50, 50);
    doc.text('Remaining Due:', 130, y + 14);
    doc.text(`Rs ${remaining.toFixed(2)}`, 190, y + 14, { align: 'right' });

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Payment Method: ${this.purchase.paymentMethod || 'N/A'}`, 15, y + 2);
    if (this.purchase.notes) {
      doc.text(`Notes: ${this.purchase.notes}`, 15, y + 8);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated automatically by VegBook Ledger System', 15, 285);

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], `Invoice_${this.purchase.id}.pdf`, { type: 'application/pdf' });

    // 2. Upload PDF file to backend
    this.apiService.uploadScreenshot(pdfFile).subscribe({
      next: (res) => {
        const hostUrl = this.apiService.getHostUrl();
        let cleanHost = hostUrl.replace('/api/', '').replace('/api', '');
        if (cleanHost.endsWith('/')) {
          cleanHost = cleanHost.slice(0, -1);
        }
        const pdfUrl = `${cleanHost}${res.url}`;

        // 3. Construct WhatsApp Message with custom user-requested template
        const formattedDate = new Date(this.purchase.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const text = `VegBook Purchase Bill \n\n Date: ${formattedDate}\n Hotel: ${this.purchase.hotelName}\n Total : ₹${(this.purchase.grandTotal || 0).toFixed(2)}\n Paid  : ₹${(this.purchase.paidAmount || 0).toFixed(2)}\n Due   : ₹${remaining.toFixed(2)}\n\n Invoice PDF: \n${pdfUrl}`;
        
        let cleanNumber = this.purchase.contactNumber ? this.purchase.contactNumber.replace(/[^0-9]/g, '') : '';
        if (cleanNumber.length === 10) {
          cleanNumber = '91' + cleanNumber;
        }
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
        
        // 4. Direct user to WhatsApp chat directly
        window.open(whatsappUrl, '_blank');
      },
      error: (uploadErr) => {
        console.error('Failed to upload PDF:', uploadErr);
        alert('Failed to upload PDF invoice. Sharing standard text instead.');
        const formattedDate = new Date(this.purchase.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const text = `VegBook Purchase Bill \n\n Date: ${formattedDate}\n Hotel: ${this.purchase.hotelName}\n Total : ₹${(this.purchase.grandTotal || 0).toFixed(2)}\n Paid  : ₹${(this.purchase.paidAmount || 0).toFixed(2)}\n Due   : ₹${remaining.toFixed(2)}`;
        let cleanNumber = this.purchase.contactNumber ? this.purchase.contactNumber.replace(/[^0-9]/g, '') : '';
        if (cleanNumber.length === 10) {
          cleanNumber = '91' + cleanNumber;
        }
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
      }
    });
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
