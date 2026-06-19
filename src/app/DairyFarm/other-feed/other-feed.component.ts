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

  // Image Upload with Compression
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploadingImage: boolean = false;
  imageError: string = '';
  previewImageUrl: string = '';
  imageSize: string = '';
  compressingImage: boolean = false;

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

  // ==================== IMAGE UPLOAD METHODS WITH COMPRESSION ====================
  async onImageSelected(event: any): Promise<void> {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    this.compressingImage = true;
    this.imageSize = this.formatFileSize(file.size);

    // Check file type
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
      this.imageError = 'Only JPG, JPEG, and PNG images are allowed';
      this.compressingImage = false;
      return;
    }

    // Check initial size (allow up to 10MB for compression)
    if (file.size > 10 * 1024 * 1024) {
      this.imageError = 'File size must be less than 10MB';
      this.compressingImage = false;
      return;
    }

    try {
      // Show compressing message
      this.imageError = 'Compressing image...';

      // Compress the image
      const compressedFile = await this.compressImageTo1MB(file);

      if (!compressedFile) {
        throw new Error('Compression failed');
      }

      // Read the compressed file
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.imageError = '';
        this.compressingImage = false;

        // Show compressed size
        const compressedSize = this.formatFileSize(compressedFile.size);
        this.imageSize = `${this.formatFileSize(file.size)} → ${compressedSize} (compressed)`;

        // Store the FULL Base64 data URL (with prefix) in the form
        this.feedForm.patchValue({
          feedImage: e.target.result
        });
      };

      reader.onerror = () => {
        this.imageError = 'Failed to read compressed image';
        this.compressingImage = false;
      };

      reader.readAsDataURL(compressedFile);

    } catch (error: any) {
      console.error('Image compression error:', error);
      this.imageError = error.message || 'Failed to compress image';
      this.compressingImage = false;

      // Fallback: use original image if compression fails but size is small
      if (file.size <= 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreview = e.target.result;
          this.imageError = 'Using original image (already under 1MB)';
          // Store the FULL Base64 data URL (with prefix) in the form
          this.feedForm.patchValue({
            feedImage: e.target.result
          });
        };
        reader.readAsDataURL(file);
        this.compressingImage = false;
      }
    }
  }

  // Main compression function - optimized for reliability
  compressImageTo1MB(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e: any) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set maximum dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image with higher quality for resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Function to compress with quality adjustment
        const compressWithQuality = (quality: number): Promise<File> => {
          return new Promise((resolveQuality, rejectQuality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  rejectQuality(new Error('Failed to create blob'));
                  return;
                }

                // Check if size is under 1MB
                if (blob.size <= 1024 * 1024) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolveQuality(compressedFile);
                } else if (quality > 0.3) {
                  // Reduce quality and try again
                  compressWithQuality(quality - 0.1).then(resolveQuality).catch(rejectQuality);
                } else {
                  // If still too large, resize more aggressively
                  if (width > 400 || height > 400) {
                    width = Math.round(width * 0.8);
                    height = Math.round(height * 0.8);
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    compressWithQuality(0.7).then(resolveQuality).catch(rejectQuality);
                  } else {
                    // Last resort: use the smallest possible
                    const finalFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    resolveQuality(finalFile);
                  }
                }
              },
              'image/jpeg',
              quality
            );
          });
        };

        // Start compression with 0.9 quality
        compressWithQuality(0.9).then(resolve).catch(reject);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageSize = '';
    this.imageError = '';
    this.feedForm.patchValue({ feedImage: '' });

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ==================== IMAGE PREVIEW METHODS ====================
  openImagePreviewWithUrl(imageUrl: string | null): void {
    this.previewImageUrl = imageUrl || '../../../assets/DairryFarmImg/Dryfeed_9137270.png';
    this.showImagePreviewModal();
  }

  closeImagePreview(): void {
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
    this.selectedFeed = feed;
    this.selectedFeedView = { ...feed };

    this.isLoadingImage = true;
    this.viewImageUrl = '../../../assets/DairryFarmImg/Dryfeed_9137270.png';

    this.showViewModal();

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
          const image = response?.feedImage || response?.FeedImage || response?.feedImageUrl || response?.imageUrl;

          if (image && image.trim() !== '') {
            this.viewImageUrl = image;

            if (this.selectedFeedView) {
              this.selectedFeedView.feedImage = image;
            }
            if (this.selectedFeed) {
              this.selectedFeed.feedImage = image;
            }
          } else {
            console.warn('No image found for feed ID:', expenseId);
          }
        },
        error: (error: any) => {
          console.error('Failed to load feed image:', error);
          this.toastr.error("Failed to load feed image");
        }
      });
  }

  handleViewImageError(): void {
    this.viewImageUrl = '../../../assets/DairryFarmImg/Dryfeed_9137270.png';
    this.isLoadingImage = false;
  }

  closeViewModal(resetSelection: boolean = true): void {
    const modalElement = this.viewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');

      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }

    this.selectedFeedView = null;
    this.viewImageUrl = '';
    this.isLoadingImage = false;

    if (resetSelection) {
      this.selectedFeed = null;
    }
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
    this.imageSize = '';
    this.compressingImage = false;

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
    this.imageSize = '';
    this.compressingImage = false;

    this.feedForm.patchValue({
      feed_name: feed.feed_name || '',
      price: feed.price,
      quantity: feed.quantity,
      date: this.formatDateForInput(feed.date),
      feedImage: feed.feedImage || ''
    });

    this.loader.show();

    this.api.get(`OtherFeeds/GetFeedImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.feedImage || res?.FeedImage || feed.feedImage;
          if (image) {
            this.feedForm.patchValue({ feedImage: image });
            this.imagePreview = image;
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

    this.loader.show();

    this.api.get(`OtherFeeds/GetFeedImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.feedImage || res?.FeedImage || feed.feedImage;
          if (image) {
            this.feedForm.patchValue({ feedImage: image });
            this.imagePreview = image;
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

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';
    this.imageSize = '';
    this.compressingImage = false;
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

      return `${day}-${month}-${year}`;
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

    // Image is already compressed and stored in form
    const feedImageBase64 = this.feedForm.value.feedImage;

    if (this.modalMode === 'add') {
      this.addFeed(feedImageBase64);
    } else if (this.modalMode === 'edit') {
      this.updateFeed(feedImageBase64);
    }
  }

  addFeed(imageBase64: string | null): void {
    this.isSaving = true;

    const payload = {
      user_id: this.dairyUserId,
      feed_id: 0,
      expense_name: 'OtherFeeds',
      feed_name: this.feedForm.value.feed_name,
      price: Number(this.feedForm.value.price),
      quantity: this.feedForm.value.quantity,
      date: this.formatDateForAPI(this.feedForm.value.date),
      feedImage: imageBase64 || ''
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

  updateFeed(imageBase64: string | null): void {
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
      feedImage: imageBase64 || ''
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

    const feed = this.selectedFeed;

    this.closeViewModal(false);

    setTimeout(() => {
      this.openEditModal(feed);
    }, 300);
  }

  deleteFromViewModal(): void {
    if (!this.selectedFeed) {
      this.toastr.error('No feed data available');
      return;
    }

    const feed = this.selectedFeed;

    this.closeViewModal(false);

    setTimeout(() => {
      this.openDeleteModal(feed);
    }, 300);
  }
}