import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
export class HistoryDairyComponent implements OnInit {
  @ViewChild('viewModal') viewModal!: ElementRef;

  // Data
  history: any[] = [];
  filteredHistory: any[] = [];
  groupedHistory: Map<string, any[]> = new Map();
  typeCounts: { [key: string]: number } = {};
  
  // Selected Item
  selectedHistory: any = null;
  viewImageUrl: string = '';

  // Search & Filter
  searchTerm: string = '';
  selectedType: string = '';

  // Loading
  isLoading: boolean = false;
  dairyUserId: number = 0;

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

  // ==================== VIEW MODAL ====================
openViewModal(item: any): void {
  this.selectedHistory = item;

  this.api
    .get(`HistoryDairy/GetHistoryImage/${item.expense_id}/${item.expense_name}`)
    .subscribe({
      next: (response: any) => {
        this.viewImageUrl = response?.Image
          ? response.Image
          : '../assets/DairryFarmImg/default-history.png';
        this.showViewModal();
      },
      error: (error) => {
        console.error('Failed to load image:', error);
        this.viewImageUrl = '../assets/DairryFarmImg/default-history.png';
        this.showViewModal();
      }
    });
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
    
    this.selectedHistory = null;
    this.viewImageUrl = '';
  }

  showViewModal(): void {
    const modalElement = this.viewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
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