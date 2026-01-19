import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-history-dairy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './history-dairy.component.html',
  styleUrl: './history-dairy.component.css'
})
export class HistoryDairyComponent implements OnInit, OnDestroy {
  @ViewChild('viewModal') viewModal!: ElementRef;
  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;

  // Data
  history: any[] = [];
  filteredHistory: any[] = [];
  groupedHistory: Map<string, any[]> = new Map();
  typeCounts: { [key: string]: number } = {};
  
  // Selected Item
  selectedHistory: any = null;
  viewImageUrl: string = '';
  isLoadingImage: boolean = false;

  // Search & Filter
  searchTerm: string = '';
  selectedType: string = '';

  // Loading
  isLoading: boolean = false;
  dairyUserId: number = 0;

  // Image Preview
  previewImageUrl: string = '';
  isImagePreviewOpen: boolean = false;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService,
    private router: Router,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    this.dairyUserId = this.getDairyUserId();
    this.loadHistory();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  // ==================== LOAD HISTORY ====================
  loadHistory(): void {
    if (!this.dairyUserId) {
      this.toastr.warning('Please login to Dairy Farm');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    this.api.get(`HistoryDairy/History/${this.dairyUserId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.history = Array.isArray(response) ? response : [];
          
          // Process each history item to add display properties
          this.history.forEach(item => {
            item.DisplayTitle = this.getDisplayTitle(item);
            item.DisplaySubtitle = this.getDisplaySubtitle(item);
            item.BadgeColor = this.getBadgeColor(item.expense_name);
            item.IconClass = this.getTypeIconClass(item.expense_name);
            item.FormattedPrice = this.getFormattedPrice(item);
            item.PriceColor = this.getPriceColor(item.expense_name);
          });
          
          this.filteredHistory = [...this.history];
          this.calculateTypeCounts();
          this.groupByDate();
        },
        error: (error: any) => {
          console.error('Failed to load history:', error);
          this.toastr.error('Failed to load history');
          this.history = [];
          this.filteredHistory = [];
        }
      });
  }

  // ==================== SEARCH & FILTER ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();
    
    if (!search && !this.selectedType) {
      this.filteredHistory = [...this.history];
      this.groupByDate();
      return;
    }

    this.filteredHistory = this.history.filter(item => {
      // Type filter
      if (this.selectedType && item.expense_name !== this.selectedType) {
        return false;
      }

      // Search filter
      if (!search) return true;

      return (
        (item.DisplayTitle && item.DisplayTitle.toLowerCase().includes(search)) ||
        (item.DisplaySubtitle && item.DisplaySubtitle.toLowerCase().includes(search)) ||
        (item.feed_name && item.feed_name.toLowerCase().includes(search)) ||
        (item.animal_name && item.animal_name.toLowerCase().includes(search)) ||
        (item.reason && item.reason.toLowerCase().includes(search)) ||
        (item.animal_type && item.animal_type.toLowerCase().includes(search))
      );
    });

    this.groupByDate();
  }

  onTypeFilter(): void {
    this.onSearch();
  }

  // ==================== GROUPING ====================
  groupByDate(): void {
    this.groupedHistory.clear();
    
    this.filteredHistory.forEach(item => {
      const dateKey = this.formatDateDisplay(item.date);
      if (!this.groupedHistory.has(dateKey)) {
        this.groupedHistory.set(dateKey, []);
      }
      this.groupedHistory.get(dateKey)!.push(item);
    });
  }

  calculateTypeCounts(): void {
    this.typeCounts = {};
    this.history.forEach(item => {
      const type = item.expense_name;
      this.typeCounts[type] = (this.typeCounts[type] || 0) + 1;
    });
  }

  dateGroupComparator = (a: any, b: any): number => {
    // Sort dates in descending order (newest first)
    const dateA = new Date(a.key.split('/').reverse().join('-'));
    const dateB = new Date(b.key.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  }

  // ==================== VIEW MODAL METHODS ====================
  async openViewModal(item: any): Promise<void> {
    this.selectedHistory = item;
    this.isLoadingImage = true;
    
    // Initially show default image
    this.viewImageUrl = this.getDefaultIconForType(item.expense_name);
    
    // Show the modal immediately
    this.showViewModal();
    
    // Now fetch the actual image from API
    await this.loadHistoryImage(item);
  }

  loadHistoryImage(item: any): void {
    const expenseId = item.expense_id;
    const expenseName = item.expense_name;

    if (!expenseId) {
      console.error('No expense_id found for history item:', item);
      this.isLoadingImage = false;
      return;
    }

    this.api.get(`HistoryDairy/GetHistoryImage/${expenseId}/${expenseName}`)
      .pipe(finalize(() => {
        this.isLoadingImage = false;
      }))
      .subscribe({
        next: (response: any) => {
          // Try different possible property names for the image
          const image = response?.Image || response?.image || 
                       response?.feedImage || response?.AnimalImage || 
                       response?.doctorImage || response?.billImage;
          
          if (image && image.trim() !== '' && !image.includes('undefined')) {
            // Check if it's a base64 image or a URL
            if (image.startsWith('data:image') || image.startsWith('http')) {
              this.viewImageUrl = image;
            } else if (image) {
              // If it's not a data URL, assume it's a base64 string without the prefix
              this.viewImageUrl = 'data:image/jpeg;base64,' + image;
            }
          } else {
            // If no image found, use type-specific default icon
            this.viewImageUrl = this.getTypeIcon(expenseName);
          }
        },
        error: (error: any) => {
          console.error('Failed to load history image:', error);
          // Use type-specific default icon
          this.viewImageUrl = this.getTypeIcon(expenseName);
        }
      });
  }

  handleViewImageError(): void {
    // If the image fails to load, show type-specific default icon
    this.viewImageUrl = this.getDefaultIconForType(this.selectedHistory?.expense_name);
    this.isLoadingImage = false;
  }

  previewImage(): void {
    if (this.viewImageUrl && !this.viewImageUrl.includes('default-history.png')) {
      this.previewImageUrl = this.viewImageUrl;
      this.isImagePreviewOpen = true;
      this.showImagePreviewModal();
    }
  }

  closeViewModal(): void {
    const modalElement = this.viewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
    
    // Reset view modal data
    this.selectedHistory = null;
    this.viewImageUrl = '';
    this.isLoadingImage = false;
  }

  showViewModal(): void {
    const modalElement = this.viewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      backdrop.addEventListener('click', () => this.closeViewModal());
      document.body.appendChild(backdrop);
    }
  }

  // ==================== IMAGE PREVIEW MODAL METHODS ====================
  showImagePreviewModal(): void {
    const modalElement = this.imagePreviewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      backdrop.addEventListener('click', () => this.closeImagePreview());
      document.body.appendChild(backdrop);
    }
  }

  closeImagePreview(): void {
    const modalElement = this.imagePreviewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');

      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
    
    this.isImagePreviewOpen = false;
  }

  // ==================== PRICE FORMATTING METHODS ====================
  getFormattedPrice(item: any): string {
    const price = item.price || 0;
    
    if (item.expense_name === 'Bill') {
      // For Bills: Green with + prefix
      return `+₹${price}`;
    } else {
      // For all other expenses: Red with - prefix
      return `-₹${price}`;
    }
  }

  getPriceColor(type: string): string {
    if (type === 'Bill') {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  }

  // ==================== HELPER METHODS ====================
  get totalCount(): number {
    return this.history.length;
  }

  getTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      'Feeds': 'Feed',
      'OtherFeeds': 'Other Feed',
      'Medicine': 'Medicine',
      'Doctor': 'Doctor Visit',
      'Bill': 'Bill'
    };
    return typeMap[type] || type;
  }

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'Feeds': '../../../assets/DairryFarmImg/seed-bag_12627079.png',
      'OtherFeeds': '../../../assets/DairryFarmImg/Dryfeed_9137270.png',
      'Medicine': '../../../assets/DairryFarmImg/tablet_16443237.png',
      'Doctor': '../../../assets/DairryFarmImg/doctor_16802630.png',
      'Bill': '../../../assets/DairryFarmImg/bill_1052856.png'
    };
    return iconMap[type] || '../../../assets/DairryFarmImg/default-history.png';
  }

  getDefaultIconForType(type: string): string {
    return this.getTypeIcon(type);
  }

  getTypeIconClass(type: string): string {
    const iconClassMap: { [key: string]: string } = {
      'Feeds': 'ri-box-3-line',
      'OtherFeeds': 'ri-bowl-line',
      'Medicine': 'ri-medicine-bottle-line',
      'Doctor': 'ri-stethoscope-line',
      'Bill': 'ri-bill-line'
    };
    return iconClassMap[type] || 'ri-question-line';
  }

  getBadgeColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'Feeds': 'bg-green-100 text-green-800',
      'OtherFeeds': 'bg-blue-100 text-blue-800',
      'Medicine': 'bg-purple-100 text-purple-800',
      'Doctor': 'bg-red-100 text-red-800',
      'Bill': 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  }

  getTypeColorClass(type: string): string {
    const colorMap: { [key: string]: string } = {
      'Feeds': 'text-green-600',
      'OtherFeeds': 'text-blue-600',
      'Medicine': 'text-purple-600',
      'Doctor': 'text-red-600',
      'Bill': 'text-yellow-600'
    };
    return colorMap[type] || 'text-gray-600';
  }

  getDisplayTitle(item: any): string {
    switch(item.expense_name) {
      case 'Feeds':
      case 'OtherFeeds':
        return item.feed_name || 'Feed Purchase';
      case 'Medicine':
        return item.reason || 'Medicine Expense';
      case 'Doctor':
        return item.reason || 'Doctor Visit';
      case 'Bill':
        return item.animal_type || 'Bill Payment';
      default:
        return item.expense_name || 'Expense';
    }
  }

  getDisplaySubtitle(item: any): string {
    switch(item.expense_name) {
      case 'Feeds':
      case 'OtherFeeds':
        return item.animal_name ? `For: ${item.animal_name}` : '';
      case 'Medicine':
      case 'Doctor':
        return item.animal_name || '';
      case 'Bill':
        return item.reason || '';
      default:
        return '';
    }
  }

  handleIconError(item: any, event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '../../../assets/DairryFarmImg/default-history.png';
  }

  formatDateDisplay(date: any): string {
    if (!date) return '';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  formatTime(date: any): string {
    if (!date) return '';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toLowerCase();
    } catch {
      return '';
    }
  }
}