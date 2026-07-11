import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  entries: any[] = [];
  todayStr = '';

  // Filter bindings
  searchHotel = '';
  fromDate = '';
  toDate = '';
  filterPayment = 'All';

  constructor(private apiService: ApiService, private router: Router) {
    const today = new Date();
    this.todayStr = today.toISOString().split('T')[0];
    this.fromDate = this.todayStr;
    this.toDate = this.todayStr;
  }

  ngOnInit() {
    this.loadEntries();
  }



  loadEntries() {
    this.apiService.getPurchases(this.fromDate, this.toDate).subscribe({
      next: (data) => this.entries = data,
      error: (err) => console.error(err)
    });
  }

  confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this purchase entry?')) {
      this.apiService.deletePurchase(id).subscribe({
        next: () => {
          this.loadEntries();
        },
        error: (err) => alert(err.error?.message || 'Failed to delete purchase entry')
      });
    }
  }

  printEntry(id: number) {
    window.open(`/market/purchase/print/${id}`, '_blank');
  }

  openInvoicePdf(entry: any) {
    this.apiService.getPurchase(entry.id).subscribe({
      next: (fullPurchase) => {
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
        doc.text(`Invoice #: ${fullPurchase.id}`, 140, 20);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Date: ${new Date(fullPurchase.date).toLocaleDateString('en-IN')}`, 140, 25);

        doc.setDrawColor(220, 220, 220);
        doc.line(15, 30, 195, 30);

        // Hotel Info
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('BILLED TO:', 15, 40);
        doc.setFont('Helvetica', 'normal');
        doc.text(fullPurchase.hotelName || 'N/A', 15, 45);
        let currentY = 50;
        if (fullPurchase.contactNumber) {
          doc.text(`Contact: ${fullPurchase.contactNumber}`, 15, currentY);
          currentY += 5;
        }
        if (fullPurchase.address) {
          doc.text(`Address: ${fullPurchase.address}`, 15, currentY);
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
        const items = fullPurchase.items || [];
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
        doc.text(`Rs ${(fullPurchase.grandTotal || 0).toFixed(2)}`, 190, y + 2, { align: 'right' });

        doc.text('Paid Amount:', 130, y + 8);
        doc.text(`Rs ${(fullPurchase.paidAmount || 0).toFixed(2)}`, 190, y + 8, { align: 'right' });

        const remaining = (fullPurchase.grandTotal || 0) - (fullPurchase.paidAmount || 0);
        doc.setTextColor(200, 50, 50);
        doc.text('Remaining Due:', 130, y + 14);
        doc.text(`Rs ${remaining.toFixed(2)}`, 190, y + 14, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Payment Method: ${fullPurchase.paymentMethod || 'N/A'}`, 15, y + 2);
        if (fullPurchase.notes) {
          doc.text(`Notes: ${fullPurchase.notes}`, 15, y + 8);
        }

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated automatically by VegBook Ledger System', 15, 285);

        const pdfBlob = doc.output('blob');
        const fileURL = URL.createObjectURL(pdfBlob);
        window.open(fileURL, '_blank');
      },
      error: (loadErr) => {
        console.error('Failed to load purchase details:', loadErr);
        alert('Failed to load purchase details to generate invoice PDF.');
      }
    });
  }

  shareEntry(entry: any) {
    // 1. Fetch full purchase details first to get all vegetable items
    this.apiService.getPurchase(entry.id).subscribe({
      next: (fullPurchase) => {
        // 2. Generate PDF Blob
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
        doc.text(`Invoice #: ${fullPurchase.id}`, 140, 20);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Date: ${new Date(fullPurchase.date).toLocaleDateString('en-IN')}`, 140, 25);

        doc.setDrawColor(220, 220, 220);
        doc.line(15, 30, 195, 30);

        // Hotel Info
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('BILLED TO:', 15, 40);
        doc.setFont('Helvetica', 'normal');
        doc.text(fullPurchase.hotelName || 'N/A', 15, 45);
        let currentY = 50;
        if (fullPurchase.contactNumber) {
          doc.text(`Contact: ${fullPurchase.contactNumber}`, 15, currentY);
          currentY += 5;
        }
        if (fullPurchase.address) {
          doc.text(`Address: ${fullPurchase.address}`, 15, currentY);
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
        const items = fullPurchase.items || [];
        items.forEach((item: any) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          // Clean non-ASCII (like Marathi characters) to avoid jsPDF font issues
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
        doc.text(`Rs ${(fullPurchase.grandTotal || 0).toFixed(2)}`, 190, y + 2, { align: 'right' });

        doc.text('Paid Amount:', 130, y + 8);
        doc.text(`Rs ${(fullPurchase.paidAmount || 0).toFixed(2)}`, 190, y + 8, { align: 'right' });

        const remaining = (fullPurchase.grandTotal || 0) - (fullPurchase.paidAmount || 0);
        doc.setTextColor(200, 50, 50);
        doc.text('Remaining Due:', 130, y + 14);
        doc.text(`Rs ${remaining.toFixed(2)}`, 190, y + 14, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Payment Method: ${fullPurchase.paymentMethod || 'N/A'}`, 15, y + 2);
        if (fullPurchase.notes) {
          doc.text(`Notes: ${fullPurchase.notes}`, 15, y + 8);
        }

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated automatically by VegBook Ledger System', 15, 285);

        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], `Invoice_${fullPurchase.id}.pdf`, { type: 'application/pdf' });

        // 3. Upload PDF file to backend
        this.apiService.uploadScreenshot(pdfFile).subscribe({
          next: (res) => {
            const hostUrl = this.apiService.getHostUrl();
            let cleanHost = hostUrl.replace('/api/', '').replace('/api', '');
            if (cleanHost.endsWith('/')) {
              cleanHost = cleanHost.slice(0, -1);
            }
            const pdfUrl = `${cleanHost}${res.url}`;

            // 4. Construct WhatsApp Message with custom user-requested template
            const formattedDate = new Date(fullPurchase.date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            const text = `VegBook Purchase Bill \n\n Date: ${formattedDate}\n Hotel: ${fullPurchase.hotelName}\n Total : ₹${(fullPurchase.grandTotal || 0).toFixed(2)}\n Paid  : ₹${(fullPurchase.paidAmount || 0).toFixed(2)}\n Due   : ₹${remaining.toFixed(2)}\n\n Invoice PDF: \n${pdfUrl}`;
            
            let cleanNumber = fullPurchase.contactNumber ? fullPurchase.contactNumber.replace(/[^0-9]/g, '') : '';
            if (cleanNumber.length === 10) {
              cleanNumber = '91' + cleanNumber;
            }
            const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
            
            // 5. Direct user to WhatsApp chat directly
            window.open(whatsappUrl, '_blank');
          },
          error: (uploadErr) => {
            console.error('Failed to upload PDF:', uploadErr);
            alert('Failed to upload PDF invoice. Sharing standard text instead.');
            const formattedDate = new Date(fullPurchase.date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            const text = `VegBook Purchase Bill \n\n Date: ${formattedDate}\n Hotel: ${fullPurchase.hotelName}\n Total : ₹${(fullPurchase.grandTotal || 0).toFixed(2)}\n Paid  : ₹${(fullPurchase.paidAmount || 0).toFixed(2)}\n Due   : ₹${remaining.toFixed(2)}`;
            let cleanNumber = fullPurchase.contactNumber ? fullPurchase.contactNumber.replace(/[^0-9]/g, '') : '';
            if (cleanNumber.length === 10) {
              cleanNumber = '91' + cleanNumber;
            }
            const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank');
          }
        });
      },
      error: (loadErr) => {
        console.error('Failed to load purchase details:', loadErr);
        alert('Failed to load purchase details to generate invoice PDF.');
      }
    });
  }

  get filteredEntries() {
    return this.entries.filter(e => {
      const matchesHotel = !this.searchHotel || e.hotelName?.toLowerCase().includes(this.searchHotel.toLowerCase());
      const matchesPayment = this.filterPayment === 'All' || e.paymentMethod === this.filterPayment;
      return matchesHotel && matchesPayment;
    });
  }
}
