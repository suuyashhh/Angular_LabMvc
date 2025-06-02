import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import saveAs from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(private http: HttpClient) {}

  // ✅ Function to download and open PDF in a new tab
  downloadAndOpenPdf() {
    this.http.get('/assets/sample.pdf', { responseType: 'blob' }).subscribe(blob => {
      // Save the PDF file
      const file = new Blob([blob], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      // Save the file (optional)
      saveAs(file, 'downloaded.pdf');

      // Open in new tab
      window.open(fileURL, '_blank');
    }, error => {
      console.error('Error downloading PDF:', error);
    });
  }

}
