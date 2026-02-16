import { Component, OnInit, AfterViewInit } from '@angular/core';

declare const particlesJS: any;
declare global {
  interface Window {
    downloadPDF: () => void;
    openInNewTab: () => void;
  }
}

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.css'
})
export class ResumeComponent implements OnInit, AfterViewInit {
  
  private pdfPath = '../../../assets/img/SuyashPatilResume.pdf';

  ngOnInit(): void {
    // Initialize particles.js
    particlesJS.load('particles-js', 'assets/particles.json', () => {
      console.log('Particles.js loaded');
    });

    // Make functions available globally for onclick handlers
    window.downloadPDF = this.downloadPDF.bind(this);
    window.openInNewTab = this.openInNewTab.bind(this);
  }

  ngAfterViewInit(): void {
    // Hide loading overlay once PDF is loaded
    const desktopIframe = document.getElementById('pdfViewer') as HTMLIFrameElement;
    const mobileIframe = document.getElementById('pdfViewerMobile') as HTMLIFrameElement;
    const loadingOverlay = document.getElementById('loadingOverlay');

    const hideLoading = () => {
      if (loadingOverlay) {
        setTimeout(() => {
          loadingOverlay.style.opacity = '0';
          setTimeout(() => {
            loadingOverlay.style.display = 'none';
          }, 300);
        }, 500);
      }
    };

    if (desktopIframe) {
      desktopIframe.onload = hideLoading;
    }

    if (mobileIframe) {
      mobileIframe.onload = hideLoading;
    }

    // Fallback - hide loading after 2 seconds if iframe doesn't load
    setTimeout(hideLoading, 2000);
  }

  /**
   * Download the PDF file
   */
  downloadPDF(): void {
    const link = document.createElement('a');
    link.href = this.pdfPath;
    link.download = 'SuyashPatil_Resume.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Open PDF in new tab
   */
  openInNewTab(): void {
    window.open(this.pdfPath, '_blank');
  }
}