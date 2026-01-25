import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './feeds.component.html',
  styleUrls: ['./feeds.component.css']
})
export class FeedsComponent implements OnInit, OnDestroy {
  @ViewChild('feedModal') feedModal!: ElementRef;
  @ViewChild('viewModal') viewModal!: ElementRef;
  @ViewChild('feedInput') feedInput!: ElementRef;
  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;

  // Form
  feedForm!: FormGroup;

  // Data
  feeds: any[] = [];
  filteredFeeds: any[] = [];
  groupedFeeds: { date: string; items: any[] }[] = [];

  // Feed dropdown
  feedOptions: any[] = [];
  selectedFeedId: number = 0;
  selectedFeedName: string = '';
  feedSearchTerm: string = '';
  showFeedDropdown: boolean = false;
  loadingFeedOptions: boolean = false;
  feedSearchTimeout: any;

  // Modal
  modalMode: 'add' | 'edit' | 'delete' = 'add';
  selectedFeed: any = null;
  deleteReason: string = '';

  // View Modal
  selectedFeedView: any = null;
  viewImageUrl: string = '';
  isLoadingImage: boolean = false;

  // Search
  searchTerm: string = '';

  // Misc
  submitted: boolean = false;
  dairyUserId: number = 0;
  isLoading: boolean = false;

  // Image Preview
  previewImageUrl: string = '';
  isImagePreviewOpen: boolean = false;

  // Button loading states
  isSaving: boolean = false;
  isUpdating: boolean = false;
  isDeleting: boolean = false;

  constructor(
    private http: HttpClient,
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
    this.initForm();
    this.loadFeeds();
    this.loadFeedOptions();
  }

  ngOnDestroy(): void {
    if (this.feedSearchTimeout) {
      clearTimeout(this.feedSearchTimeout);
    }
  }

  initForm(): void {
    this.feedForm = new FormGroup({
      feed_id: new FormControl('', [Validators.required]),
      feed_name: new FormControl('', [Validators.required]),
      price: new FormControl('', [Validators.required, Validators.min(1)]),
      quantity: new FormControl('', [Validators.required, Validators.min(1)]),
      date: new FormControl(this.getTodayDate(), [Validators.required]),
      feedImage: new FormControl('')
    });
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  // ==================== IMAGE PREVIEW METHODS ====================
  openImagePreview(): void {
    const imageUrl = this.feedForm.get('feedImage')?.value;
    this.previewImageUrl = imageUrl || '../../../assets/DairryFarmImg/seed-bag_12627079.png';

    this.isImagePreviewOpen = true;
    this.showImagePreviewModal();
  }

  closeImagePreview(): void {
    this.isImagePreviewOpen = false;
    this.hideImagePreviewModal();
  }

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

  hideImagePreviewModal(): void {
    const modalElement = this.imagePreviewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');

      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  }

  handleCardImageError(feed: any): void {
    feed.feedImage = '../../../assets/DairryFarmImg/seed-bag_12627079.png';
  }

  // ==================== VIEW MODAL METHODS ====================
  openViewModal(feed: any): void {
    // ✅ Store the original object for Edit/Delete actions
    this.selectedFeed = feed;          // <-- IMPORTANT: Store original object
    this.selectedFeedView = { ...feed }; // copy for display

    // Reset loading state
    this.isLoadingImage = true;

    // Initially show default image
    this.viewImageUrl = '../../../assets/DairryFarmImg/seed-bag_12627079.png';

    // Show the modal immediately
    this.showViewModal();

    // Now fetch the actual image from API
    this.loadFeedImageForView(feed);
  }

  loadFeedImageForView(feed: any): void {
    const expenseId = feed.expense_id;

    if (!expenseId) {
      console.error('No expense_id found for feed:', feed);
      this.isLoadingImage = false;
      return;
    }

    this.api.get(`Feeds/GetFeedImageById/${expenseId}`).subscribe({
      next: (response: any) => {
        // Try different possible property names for the image
        const image = response?.feedImage || response?.FeedImage || response?.feedImageUrl || response?.imageUrl;

        if (image && image.trim() !== '') {
          // Update the view image URL with the actual image from API
          this.viewImageUrl = image;

          // Also update the selected feed objects for consistency
          if (this.selectedFeedView) {
            this.selectedFeedView.feedImage = image;
          }
          if (this.selectedFeed) {
            this.selectedFeed.feedImage = image;
          }
        } else {
          console.warn('No image found for feed ID:', expenseId);
          // Keep the default image
        }
        this.isLoadingImage = false;
      },
      error: (error: any) => {
        console.error('Failed to load feed image:', error);
        this.toastr.error("Failed to load feed image");
        this.isLoadingImage = false;
      }
    });
  }

  handleViewImageError(): void {
    // If the image fails to load, show default image
    this.viewImageUrl = '../../../assets/DairryFarmImg/seed-bag_12627079.png';
    this.isLoadingImage = false;
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

    // reset only view data
    this.selectedFeedView = null;
    this.viewImageUrl = '';
    this.isLoadingImage = false;

    // ✅ DO NOT clear selectedFeed here
  }

  closeViewModalAndReset(): void {
    this.closeViewModal();
    this.selectedFeed = null; // only when fully closing
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

  // ==================== FEED DROPDOWN METHODS ====================
  loadFeedOptions(searchTerm: string = ''): void {
    if (!this.dairyUserId) return;

    this.loadingFeedOptions = true;

    this.api.get(`DairyMasters/Feeds/${this.dairyUserId}`).subscribe({
      next: (response: any) => {
        let feeds = Array.isArray(response) ? response : [];

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          feeds = feeds.filter(feed =>
            feed.feedName?.toLowerCase().includes(term)
          );
        }

        this.feedOptions = feeds;
        this.loadingFeedOptions = false;
      },
      error: (error: any) => {
        console.error('Failed to load feed options:', error);
        this.feedOptions = [];
        this.loadingFeedOptions = false;
      }
    });
  }

  onFeedSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.feedSearchTerm = input.value;

    if (this.feedSearchTimeout) {
      clearTimeout(this.feedSearchTimeout);
    }

    this.feedSearchTimeout = setTimeout(() => {
      this.loadFeedOptions(this.feedSearchTerm);
    }, 300);
  }

  selectFeed(feed: any): void {
    this.selectedFeedId = feed.feedId;
    this.selectedFeedName = feed.feedName;
    this.showFeedDropdown = false;

    this.feedForm.patchValue({
      feed_id: feed.feedId,
      feed_name: feed.feedName
    });
  }

  toggleFeedDropdown(): void {
    this.showFeedDropdown = !this.showFeedDropdown;
    if (this.showFeedDropdown && this.feedOptions.length === 0) {
      this.loadFeedOptions();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showFeedDropdown) return;

    const target = event.target as HTMLElement;
    const isClickInside = this.feedInput?.nativeElement?.contains(target);

    if (!isClickInside) {
      this.showFeedDropdown = false;
    }
  }

  // ==================== MODAL METHODS ====================
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedFeed = null;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    this.selectedFeedId = 0;
    this.selectedFeedName = '';
    this.feedSearchTerm = '';

    this.feedForm.reset();
    this.feedForm.patchValue({
      date: this.getTodayDate(),
      feed_id: '',
      feed_name: '',
      feedImage: ''
    });

    this.loadFeedOptions();
    this.showModal();
  }

  openEditModal(feed: any): void {
    this.modalMode = 'edit';
    this.selectedFeed = feed;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const expenseId = feed.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid feed data');
      return;
    }

    this.selectedFeedId = feed.feed_id || feed.feedId || 0;
    this.selectedFeedName = feed.feed_name || feed.feedName || '';

    this.feedForm.patchValue({
      feed_id: this.selectedFeedId,
      feed_name: this.selectedFeedName,
      price: feed.price,
      quantity: feed.quantity,
      date: this.formatDateForInput(feed.date),
      feedImage: feed.feedImage || ''
    });

    this.loader.show();

    this.api.get(`Feeds/GetFeedImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.feedImage || res?.FeedImage || feed.feedImage;
          if (image) {
            this.feedForm.patchValue({ feedImage: image });
          }
          this.showModal();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error("Failed to load feed image");
          this.showModal();
        }
      });
  }

  openDeleteModal(feed: any): void {
    this.modalMode = 'delete';
    this.selectedFeed = feed;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const expenseId = feed.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid feed data');
      return;
    }

    this.selectedFeedId = feed.feed_id || feed.feedId || 0;
    this.selectedFeedName = feed.feed_name || feed.feedName || '';

    this.feedForm.patchValue({
      feed_id: this.selectedFeedId,
      feed_name: this.selectedFeedName,
      price: feed.price,
      quantity: feed.quantity,
      date: this.formatDateForInput(feed.date),
      feedImage: feed.feedImage || ''
    });

    this.loader.show();

    this.api.get(`Feeds/GetFeedImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.feedImage || res?.FeedImage || feed.feedImage;
          if (image) {
            this.feedForm.patchValue({ feedImage: image });
          }
          this.showModal();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error("Failed to load feed image");
          this.showModal();
        }
      });
  }

  closeModal(): void {
    const modalElement = this.feedModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  }

  showModal(): void {
    const modalElement = this.feedModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // ==================== GROUP FEEDS BY DATE ====================
  groupFeedsByDate(): void {
    this.groupedFeeds = [];

    if (!this.filteredFeeds || this.filteredFeeds.length === 0) return;

    const map = new Map<string, any[]>();

    for (const feed of this.filteredFeeds) {
      const dateStr = this.getDateString(feed.date);

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(feed);
    }

    this.groupedFeeds = Array.from(map.entries()).map(([date, items]) => ({
      date,
      items
    }));
  }

getDateString(date: any): string {
  if (!date) return 'Unknown Date';

  try {
    const d = new Date(date);

    const day = d.getDate().toString().padStart(2, '0');

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;   // ✅ 17-Jan-2026
  } catch {
    return 'Unknown Date';
  }
}


  // ==================== CRUD OPERATIONS ====================
  loadFeeds(): void {
    if (!this.dairyUserId) {
      this.toastr.warning('Please login to Dairy Farm');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    this.api.get(`Feeds/History/${this.dairyUserId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.feeds = Array.isArray(response) ? response : [];
          this.filteredFeeds = [...this.feeds];
          this.groupFeedsByDate();
        },
        error: (error: any) => {
          console.error('Failed to load feeds:', error);
          this.toastr.error('Failed to load feeds');
          this.feeds = [];
          this.filteredFeeds = [];
          this.groupedFeeds = [];
        }
      });
  }

  submitFeed(): void {
    this.submitted = true;

    if (this.modalMode === 'delete') {
      if (!this.deleteReason.trim()) {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteFeed();
      return;
    }

    if (this.feedForm.invalid) {
      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    if (!this.selectedFeedId) {
      this.toastr.error('Please select a feed from the dropdown');
      return;
    }

    if (this.modalMode === 'add') {
      this.addFeed();
    } else if (this.modalMode === 'edit') {
      this.updateFeed();
    }
  }

  addFeed(): void {
    this.isSaving = true;

    const payload = {
      user_id: this.dairyUserId,
      feed_id: this.selectedFeedId,
      expense_name: 'Feeds',
      feed_name: this.selectedFeedName,
      price: Number(this.feedForm.value.price),
      quantity: Number(this.feedForm.value.quantity),
      date: this.formatDateForAPI(this.feedForm.value.date),
      feedImage: this.feedForm.value.feedImage || ''
    };

    this.loader.show();

    this.api.post('Feeds/Save', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isSaving = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Feed saved successfully');
          this.closeModal();
          this.loadFeeds();
        },
        error: (error: any) => {
          console.error('Save error:', error);
          this.toastr.error('Failed to save feed');
        }
      });
  }

  updateFeed(): void {
    if (!this.selectedFeed?.expense_id) {
      this.toastr.error('Invalid feed data');
      return;
    }

    this.isUpdating = true;

    const payload = {
      expense_id: this.selectedFeed.expense_id,
      user_id: this.dairyUserId,
      feed_id: this.selectedFeedId,
      expense_name: 'Feeds',
      feed_name: this.selectedFeedName,
      price: Number(this.feedForm.value.price),
      quantity: Number(this.feedForm.value.quantity),
      date: this.formatDateForAPI(this.feedForm.value.date),
      feedImage: this.feedForm.value.feedImage || ''
    };

    this.loader.show();

    this.api.put('Feeds/Edit', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isUpdating = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Feed updated successfully');
          this.closeModal();
          this.loadFeeds();
        },
        error: (error: any) => {
          console.error('Update error:', error);
          this.toastr.error('Failed to update feed');
        }
      });
  }

  deleteFeed(): void {
    if (!this.selectedFeed?.expense_id) {
      this.toastr.error('Invalid feed data');
      return;
    }

    this.isDeleting = true;

    this.loader.show();

    this.api.delete(`Feeds/${this.selectedFeed.expense_id}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isDeleting = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Feed deleted successfully');
          this.closeModal();
          this.loadFeeds();
        },
        error: (error: any) => {
          console.error('Delete error:', error);
          this.toastr.error('Failed to delete feed');
        }
      });
  }

  getFeedId(feed: any): number {
    return feed.FeedId ?? feed.feed_id ?? feed.feedId ?? feed.id ?? 0;
  }

  // ==================== SEARCH & FILTER ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();

    if (!search) {
      this.filteredFeeds = [...this.feeds];
      this.groupFeedsByDate();
      return;
    }

    const dateMatch = this.tryParseDate(search);
    if (dateMatch) {
      this.filteredFeeds = this.feeds.filter(feed => {
        const feedDate = this.formatDateDisplay(feed.date).toLowerCase();
        return feedDate.includes(dateMatch);
      });
    } else {
      this.filteredFeeds = this.feeds.filter(feed =>
        feed.feed_name?.toLowerCase().includes(search)
      );
    }

    // Regroup after filtering
    this.groupFeedsByDate();
  }

  // ==================== HELPER METHODS ====================
  private getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  formatDateForInput(date: any): string {
    if (!date) return '';

    if (typeof date === 'string') {
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date;
    }

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    return '';
  }

  formatDateForAPI(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    return new Date(dateStr).toISOString();
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

  formatDateForView(date: any): string {
    if (!date) return '';

    try {
      const d = new Date(date);

      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }

  private tryParseDate(search: string): string | null {
    const formats = [
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/
    ];

    for (const format of formats) {
      if (format.test(search)) {
        return search;
      }
    }

    return null;
  }

  // ==================== VIEW MODAL ACTION METHODS ====================
  editFromViewModal(): void {
    if (!this.selectedFeed) {
      this.toastr.error('No feed data available');
      return;
    }

    const feed = this.selectedFeed; // ✅ store first

    this.closeViewModal(); // does NOT clear selectedFeed now

    setTimeout(() => {
      this.openEditModal(feed);
    }, 300);
  }


  deleteFromViewModal(): void {
    if (!this.selectedFeed) {
      this.toastr.error('No feed data available');
      return;
    }

    const feed = this.selectedFeed; // ✅ store first

    this.closeViewModal();

    setTimeout(() => {
      this.openDeleteModal(feed);
    }, 300);
  }



}