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

  generatePdf(purchase: any): Promise<jsPDF> {
    return new Promise((resolve) => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const proceed = (fontLoaded: boolean = false) => {
        // Styling
        const primaryColor = [43, 92, 46];
        const textColor = [30, 37, 28];
        const lightGrey = [245, 247, 243];

        if (purchase.showMarathi && fontLoaded) {
          doc.setFont('NotoSansDevanagari', 'normal');
        } else {
          doc.setFont('Helvetica', 'normal');
        }

        // Title
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'bold');
        }
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('VegBook', 15, 20);

        doc.setFontSize(10);
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'normal');
        }
        doc.setTextColor(120, 120, 120);
        doc.text(purchase.showMarathi ? 'खरेदी खाते बिल' : 'PURCHASE LEDGER BILL', 15, 25);

        doc.setFontSize(10);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'bold');
        }
        doc.text(purchase.showMarathi ? `इन्व्हॉइस #: ${purchase.id}` : `Invoice #: ${purchase.id}`, 140, 20);
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'normal');
        }
        doc.text(purchase.showMarathi ? `दिनांक: ${new Date(purchase.date).toLocaleDateString('en-IN')}` : `Date: ${new Date(purchase.date).toLocaleDateString('en-IN')}`, 140, 25);

        doc.setDrawColor(220, 220, 220);
        doc.line(15, 30, 195, 30);

        // Hotel Info
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'bold');
        }
        doc.setFontSize(11);
        doc.text(purchase.showMarathi ? 'बिल पाठवले:' : 'BILLED TO:', 15, 40);
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'normal');
        }
        doc.text(purchase.hotelName || 'N/A', 15, 45);
        let currentY = 50;
        if (purchase.contactNumber) {
          doc.text(purchase.showMarathi ? `संपर्क: ${purchase.contactNumber}` : `Contact: ${purchase.contactNumber}`, 15, currentY);
          currentY += 5;
        }
        if (purchase.address) {
          doc.text(purchase.showMarathi ? `पत्ता: ${purchase.address}` : `Address: ${purchase.address}`, 15, currentY);
          currentY += 5;
        }

        // Table headers
        let y = Math.max(currentY + 5, 65);
        doc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
        doc.rect(15, y, 180, 8, 'F');

        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'bold');
        }
        doc.setFontSize(9);
        doc.text(purchase.showMarathi ? 'भाजीपाला नाव' : 'Vegetable Item', 18, y + 5.5);
        doc.text(purchase.showMarathi ? 'प्रमाण' : 'Quantity', 95, y + 5.5, { align: 'right' });
        doc.text(purchase.showMarathi ? 'दर / किलो' : 'Price / KG', 145, y + 5.5, { align: 'right' });
        doc.text(purchase.showMarathi ? 'एकूण' : 'Total', 190, y + 5.5, { align: 'right' });

        y += 8;

        // Table items
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'normal');
        }
        const items = purchase.items || [];
        items.forEach((item: any) => {
          if (y > 270) {
            doc.addPage();
            if (purchase.showMarathi && fontLoaded) {
              doc.setFont('NotoSansDevanagari', 'normal');
            }
            y = 20;
          }
          const cleanedName = (purchase.showMarathi && fontLoaded)
            ? item.vegetableName 
            : (item.vegetableName || 'Item').replace(/[^\x00-\x7F]/g, "").trim().replace(/\s+-\s*$/, "") || item.vegetableName;
          
          doc.text(cleanedName, 18, y + 5.5);
          doc.text(`${item.quantity} KG`, 95, y + 5.5, { align: 'right' });
          doc.text(`Rs ${item.pricePerKg.toFixed(2)}`, 145, y + 5.5, { align: 'right' });
          doc.text(`Rs ${item.total.toFixed(2)}`, 190, y + 5.5, { align: 'right' });
          y += 8;
        });

        doc.line(15, y, 195, y);
        y += 6;

        // Totals
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'bold');
        }
        doc.text(purchase.showMarathi ? 'एकूण रक्कम:' : 'Grand Total:', 130, y + 2);
        doc.text(`Rs ${(purchase.grandTotal || 0).toFixed(2)}`, 190, y + 2, { align: 'right' });

        doc.text(purchase.showMarathi ? 'भरलेली रक्कम:' : 'Paid Amount:', 130, y + 8);
        doc.text(`Rs ${(purchase.paidAmount || 0).toFixed(2)}`, 190, y + 8, { align: 'right' });

        const remaining = (purchase.grandTotal || 0) - (purchase.paidAmount || 0);
        doc.setTextColor(200, 50, 50);
        doc.text(purchase.showMarathi ? 'उर्वरित रक्कम:' : 'Remaining Due:', 130, y + 14);
        doc.text(`Rs ${remaining.toFixed(2)}`, 190, y + 14, { align: 'right' });

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        if (!purchase.showMarathi || !fontLoaded) {
          doc.setFont('Helvetica', 'normal');
        }
        doc.setFontSize(9);
        doc.text(purchase.showMarathi ? `पेमेंट पद्धत: ${purchase.paymentMethod || 'N/A'}` : `Payment Method: ${purchase.paymentMethod || 'N/A'}`, 15, y + 2);
        if (purchase.notes) {
          doc.text(purchase.showMarathi ? `टीप: ${purchase.notes}` : `Notes: ${purchase.notes}`, 15, y + 8);
        }

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(purchase.showMarathi ? 'व्हेजबुक प्रणालीद्वारे स्वयंचलितपणे तयार केले' : 'Generated automatically by VegBook Ledger System', 15, 285);

        resolve(doc);
      };

      if (purchase.showMarathi) {
        fetch('https://fonts.gstatic.com/s/notosansdevanagari/v30/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly-A.ttf')
          .then(res => {
            if (!res.ok) throw new Error('Network response not ok');
            return res.arrayBuffer();
          })
          .then(buffer => {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = window.btoa(binary);
            doc.addFileToVFS('NotoSansDevanagari.ttf', base64);
            doc.addFont('NotoSansDevanagari.ttf', 'NotoSansDevanagari', 'normal');
            proceed(true);
          })
          .catch(err => {
            console.error('Failed to load Devanagari font:', err);
            proceed(false);
          });
      } else {
        proceed(false);
      }
    });
  }

  openInvoicePdf(entry: any) {
    this.apiService.getPurchase(entry.id).subscribe({
      next: (fullPurchase) => {
        if (fullPurchase && fullPurchase.items) {
          fullPurchase.items = fullPurchase.items.map((item: any) => {
            const parts = (item.vegetableName || '').split(' - ');
            const engName = parts[0]?.trim() || '';
            const marName = parts[1]?.trim() || '';
            return {
              ...item,
              vegetableName: fullPurchase.showMarathi && marName ? marName : engName
            };
          });
        }
        this.generatePdf(fullPurchase).then((doc) => {
          const pdfBlob = doc.output('blob');
          const fileURL = URL.createObjectURL(pdfBlob);
          window.open(fileURL, '_blank');
        });
      },
      error: (loadErr) => {
        console.error('Failed to load purchase details:', loadErr);
        alert('Failed to load purchase details to generate invoice PDF.');
      }
    });
  }

  shareEntry(entry: any) {
    // Immediately open blank tab to bypass popup blocker
    const whatsappWindow = window.open('', '_blank');

    // 1. Fetch full purchase details first to get all vegetable items
    this.apiService.getPurchase(entry.id).subscribe({
      next: (fullPurchase) => {
        if (fullPurchase && fullPurchase.items) {
          fullPurchase.items = fullPurchase.items.map((item: any) => {
            const parts = (item.vegetableName || '').split(' - ');
            const engName = parts[0]?.trim() || '';
            const marName = parts[1]?.trim() || '';
            return {
              ...item,
              vegetableName: fullPurchase.showMarathi && marName ? marName : engName
            };
          });
        }
        this.generatePdf(fullPurchase).then((doc) => {
          const pdfBlob = doc.output('blob');
          const pdfFile = new File([pdfBlob], `Invoice_${fullPurchase.id}.pdf`, { type: 'application/pdf' });

          // 3. Upload PDF file to backend database
          this.apiService.uploadPurchasePdf(fullPurchase.id, pdfFile).subscribe({
            next: (res) => {
              const hostUrl = this.apiService.getHostUrl();
              let cleanHost = hostUrl.replace('/api/', '').replace('/api', '');
              if (cleanHost.endsWith('/')) {
                cleanHost = cleanHost.slice(0, -1);
              }
              const pdfUrl = `${cleanHost}/api/purchase/${fullPurchase.id}/pdf`;

              const remaining = (fullPurchase.grandTotal || 0) - (fullPurchase.paidAmount || 0);

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
              
              // 5. Direct user to WhatsApp chat
              if (whatsappWindow) {
                whatsappWindow.location.href = whatsappUrl;
              } else {
                window.open(whatsappUrl, '_blank');
              }
            },
            error: (uploadErr) => {
              console.error('Failed to upload PDF:', uploadErr);
              alert('Failed to upload PDF invoice. Sharing standard text instead.');
              const remaining = (fullPurchase.grandTotal || 0) - (fullPurchase.paidAmount || 0);
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
              if (whatsappWindow) {
                whatsappWindow.location.href = whatsappUrl;
              } else {
                window.open(whatsappUrl, '_blank');
              }
            }
          });
        }).catch(err => {
          console.error('Error generating PDF for sharing:', err);
          if (whatsappWindow) whatsappWindow.close();
          alert('Error generating PDF.');
        });
      },
      error: (loadErr) => {
        console.error('Failed to load purchase details:', loadErr);
        if (whatsappWindow) whatsappWindow.close();
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
