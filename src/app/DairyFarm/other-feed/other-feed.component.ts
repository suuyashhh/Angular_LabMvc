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
  selector: 'app-other-feed',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './other-feed.component.html',
  styleUrl: './other-feed.component.css'
})
export class OtherFeedComponent implements OnInit, OnDestroy {
  @ViewChild('feedModal') feedModal!: ElementRef;
  @ViewChild('viewModal') viewModal!: ElementRef;
  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Form
  feedForm!: FormGroup;

  // Data
  feeds: any[] = [];
  filteredFeeds: any[] = [];
  groupedFeeds: { date: string; items: any[] }[] = [];

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

  // Image Upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploadingImage: boolean = false;
  imageError: string = '';
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
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  initForm(): void {
    this.feedForm = new FormGroup({
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

  // ==================== IMAGE UPLOAD METHODS ====================
  onImageSelected(event: any): void {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      this.imageError = 'Image size should be less than 1MB';
      this.selectedFile = null;
      this.imagePreview = null;
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.imageError = 'Only JPG, PNG, and GIF images are allowed';
      this.selectedFile = null;
      this.imagePreview = null;
      return;
    }

    this.imageError = '';
    this.selectedFile = file;

    // Create preview and compress if needed
    this.compressAndPreviewImage(file);
  }

  compressAndPreviewImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          this.createBasicPreview(file);
          return;
        }

        // Set maximum dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Get compressed base64 with quality 0.7 (70% quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        this.imagePreview = compressedBase64;
      };

      img.onerror = () => {
        this.createBasicPreview(file);
      };
    };

    reader.onerror = () => {
      this.imageError = 'Failed to read image file';
      this.selectedFile = null;
      this.imagePreview = null;
    };

    reader.readAsDataURL(file);
  }

  createBasicPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.feedForm.patchValue({ feedImage: '' });

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      return this.feedForm.get('feedImage')?.value || '';
    }

    this.isUploadingImage = true;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64Image = reader.result as string;
        this.isUploadingImage = false;
        resolve(base64Image);
      };

      reader.onerror = () => {
        this.isUploadingImage = false;
        reject('Failed to read image file');
      };

      reader.readAsDataURL(this.selectedFile!);
    });
  }

  // ==================== IMAGE PREVIEW METHODS ====================
  openImagePreview(): void {
    const imageUrl = this.feedForm.get('feedImage')?.value || this.imagePreview;
    this.previewImageUrl = imageUrl || '../../../assets/DairryFarmImg/Dryfeed_9137270.png';
    this.isImagePreviewOpen = true;
    this.showImagePreviewModal();
  }

  previewCardImage(feed: any): void {
    this.previewImageUrl = feed.feedImage || '../../../assets/DairryFarmImg/Dryfeed_9137270.png';
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
    feed.feedImage = '../../../assets/DairryFarmImg/Dryfeed_9137270.png';
  }

  // ==================== VIEW MODAL METHODS ====================
  async openViewModal(feed: any): Promise<void> {
    this.selectedFeedView = feed;

    // Reset loading state
    this.isLoadingImage = true;

    // Initially show default image
    this.viewImageUrl = '../../../assets/DairryFarmImg/Dryfeed_9137270.png';

    // Show the modal immediately
    this.showViewModal();

    // Now fetch the actual image from API
    await this.loadFeedImageForView(feed);
  }

  loadFeedImageForView(feed: any): void {
    const expenseId = feed.expense_id;

    if (!expenseId) {
      console.error('No expense_id found for feed:', feed);
      this.isLoadingImage = false;
      return;
    }

    this.loader.show();

    this.api.get(`OtherFeeds/GetFeedImageById/${expenseId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoadingImage = false;
      }))
      .subscribe({
        next: (response: any) => {
          // Try different possible property names for the image
          const image = response?.feedImage || response?.FeedImage || response?.feedImageUrl || response?.imageUrl;

          if (image && image.trim() !== '') {
            // Update the view image URL with the actual image from API
            this.viewImageUrl = image;

            // Also update the selected feed object for consistency
            if (this.selectedFeedView) {
              this.selectedFeedView.feedImage = image;
            }
          } else {
            console.warn('No image found for feed ID:', expenseId);
            // Keep the default image
          }
        },
        error: (error: any) => {
          console.error('Failed to load feed image:', error);
          this.toastr.error("Failed to load feed image");
        }
      });
  }

  handleViewImageError(): void {
    // If the image fails to load, show default image
    this.viewImageUrl = '../../../assets/DairryFarmImg/Dryfeed_9137270.png';
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

    // Reset view modal data
    this.selectedFeedView = null;
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

  // ==================== MODAL METHODS ====================
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedFeed = null;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.feedForm.reset();
    this.feedForm.patchValue({
      date: this.getTodayDate(),
      feed_name: '',
      price: '',
      quantity: '',
      feedImage: ''
    });

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

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.feedForm.patchValue({
      feed_name: feed.feed_name || '',
      price: feed.price,
      quantity: feed.quantity,
      date: this.formatDateForInput(feed.date),
      feedImage: feed.feedImage || ''
    });

    // Show loader before API call to get image
    this.loader.show();

    // Call API to get the image by ID
    this.api.get(`OtherFeeds/GetFeedImageById/${expenseId}`)
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

    this.selectedFile = null;
    this.imagePreview = null;

    this.feedForm.patchValue({
      feed_name: feed.feed_name || '',
      price: feed.price,
      quantity: feed.quantity,
      date: this.formatDateForInput(feed.date),
      feedImage: feed.feedImage || ''
    });

    // Show loader before API call to get image
    this.loader.show();

    // Call API to get the image by ID
    this.api.get(`OtherFeeds/GetFeedImageById/${expenseId}`)
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

    // Reset image upload state
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';
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
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();

      return `${day}/${month}/${year}`;
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

    this.api.get(`OtherFeeds/History/${this.dairyUserId}`)
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

  async submitFeed(): Promise<void> {
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

    try {
      // Use the compressed preview image if available
      if (this.imagePreview) {
        this.feedForm.patchValue({ feedImage: this.imagePreview });
      } else if (this.selectedFile) {
        // Fallback to regular upload if no preview
        const base64Image = await this.uploadImage();
        this.feedForm.patchValue({ feedImage: base64Image });
      }

      if (this.modalMode === 'add') {
        await this.addFeed();
      } else if (this.modalMode === 'edit') {
        await this.updateFeed();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      this.toastr.error('Failed to upload image');
    }
  }

  async addFeed(): Promise<void> {
    this.isSaving = true;

    const payload = {
      user_id: this.dairyUserId,
      feed_id: 0,
      expense_name: 'OtherFeeds',
      feed_name: this.feedForm.value.feed_name,
      price: Number(this.feedForm.value.price),
      quantity: this.feedForm.value.quantity,
      date: this.formatDateForAPI(this.feedForm.value.date),
      feedImage: this.feedForm.value.feedImage || ''
    };

    this.loader.show();

    this.api.post('OtherFeeds/Save', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isSaving = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Other Feed saved successfully');
          this.closeModal();
          this.loadFeeds();
        },
        error: (error: any) => {
          console.error('Save error:', error);
          this.toastr.error('Failed to save other feed');
        }
      });
  }

  async updateFeed(): Promise<void> {
    if (!this.selectedFeed?.expense_id) {
      this.toastr.error('Invalid feed data');
      return;
    }

    this.isUpdating = true;

    const payload = {
      expense_id: this.selectedFeed.expense_id,
      user_id: this.dairyUserId,
      feed_id: 0,
      expense_name: 'OtherFeeds',
      feed_name: this.feedForm.value.feed_name,
      price: Number(this.feedForm.value.price),
      quantity: this.feedForm.value.quantity,
      date: this.formatDateForAPI(this.feedForm.value.date),
      feedImage: this.feedForm.value.feedImage || ''
    };

    this.loader.show();

    this.api.put('OtherFeeds/Edit', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isUpdating = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Other Feed updated successfully');
          this.closeModal();
          this.loadFeeds();
        },
        error: (error: any) => {
          console.error('Update error:', error);
          this.toastr.error('Failed to update other feed');
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

    this.api.delete(`OtherFeeds/${this.selectedFeed.expense_id}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isDeleting = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Other Feed deleted successfully');
          this.closeModal();
          this.loadFeeds();
        },
        error: (error: any) => {
          console.error('Delete error:', error);
          this.toastr.error('Failed to delete other feed');
        }
      });
  }

  getFeedId(feed: any): number {
    return feed.expense_id ?? 0;
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
}