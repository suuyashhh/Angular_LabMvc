import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
  selector: 'app-dairy-bill',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dairy-bill.component.html',
  styleUrl: './dairy-bill.component.css'
})
export class DairyBillComponent implements OnInit, OnDestroy {
  @ViewChild('billModal') billModal!: ElementRef;
  @ViewChild('viewModal') viewModal!: ElementRef;
  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Form
  billForm!: FormGroup;

  // Data
  bills: any[] = [];
  filteredBills: any[] = [];
  groupedBills: { date: string; items: any[] }[] = [];

  // Modal
  modalMode: 'add' | 'edit' | 'delete' = 'add';
  selectedBill: any = null;
  deleteReason: string = '';

  // View Modal
  selectedBillView: any = null;
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
    this.loadBills();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  initForm(): void {
    this.billForm = new FormGroup({
      animal_type: new FormControl('', [Validators.required]),
      price: new FormControl('', [Validators.required, Validators.min(1)]),
      date: new FormControl(this.getTodayDate(), [Validators.required]),
      BillImage: new FormControl('')
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
    this.billForm.patchValue({ BillImage: '' });

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      return this.billForm.get('BillImage')?.value || '';
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
    const imageUrl = this.billForm.get('BillImage')?.value || this.imagePreview;
    this.previewImageUrl = imageUrl || '../../../assets/DairryFarmImg/bill_1052856.png';
    this.isImagePreviewOpen = true;
    this.showImagePreviewModal();
  }

  previewCardImage(bill: any): void {
    this.previewImageUrl = bill.BillImage || '../../../assets/DairryFarmImg/bill_1052856.png';
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

  handleCardImageError(bill: any): void {
    bill.BillImage = '../../../assets/DairryFarmImg/bill_1052856.png';
  }

  // ==================== VIEW MODAL METHODS ====================
  openViewModal(bill: any): void {

    // ✅ KEEP ORIGINAL OBJECT (has bill_id)
    this.selectedBill = bill;

    // copy only for UI
    this.selectedBillView = { ...bill };

    this.isLoadingImage = true;
    this.viewImageUrl = '../../../assets/DairryFarmImg/bill_1052856.png';

    this.showViewModal();

    this.loadBillImageForView(bill);
  }


  loadBillImageForView(bill: any): void {
    const billId = bill.bill_id;

    if (!billId) {
      console.error('No bill_id found for bill:', bill);
      this.isLoadingImage = false;
      return;
    }

    this.api.get(`BillDairy/GetBillImageById/${billId}`).subscribe({
      next: (response: any) => {
        // Try different possible property names for the image
        const image = response?.BillImage || response?.billImage || response?.BillImageUrl || response?.imageUrl;

        if (image && image.trim() !== '') {
          // Update the view image URL with the actual image from API
          this.viewImageUrl = image;

          // Also update the selected bill objects for consistency
          if (this.selectedBillView) {
            this.selectedBillView.BillImage = image;
          }
          if (this.selectedBill) {
            this.selectedBill.BillImage = image;
          }
        } else {
          console.warn('No image found for bill ID:', billId);
          // Keep the default image
        }
        this.isLoadingImage = false;
      },
      error: (error: any) => {
        console.error('Failed to load bill image:', error);
        this.toastr.error("Failed to load bill image");
        this.isLoadingImage = false;
      }
    });
  }

  handleViewImageError(): void {
    // If the image fails to load, show default image
    this.viewImageUrl = '../../../assets/DairryFarmImg/bill_1052856.png';
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
    this.selectedBillView = null;
    this.viewImageUrl = '';
    this.isLoadingImage = false;

    // ✅ DO NOT reset selectedBill here
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
    this.selectedBill = null;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.billForm.reset();
    this.billForm.patchValue({
      date: this.getTodayDate(),
      animal_type: '',
      price: '',
      BillImage: ''
    });

    this.showModal();
  }

  openEditModal(bill: any): void {
    this.modalMode = 'edit';
    this.selectedBill = bill;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const billId = bill.bill_id;

    if (!billId) {
      this.toastr.error('Invalid bill data');
      return;
    }

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.billForm.patchValue({
      animal_type: bill.animal_type || '',
      price: bill.price,
      date: this.formatDateForInput(bill.date),
      BillImage: bill.BillImage || ''
    });

    this.loader.show();

    this.api.get(`BillDairy/GetBillImageById/${billId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.BillImage || res?.billImage || bill.BillImage;
          if (image) {
            this.billForm.patchValue({ BillImage: image });
          }
          this.showModal();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error("Failed to load bill image");
          this.showModal();
        }
      });
  }

  openDeleteModal(bill: any): void {
    this.modalMode = 'delete';
    this.selectedBill = bill;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const billId = bill.bill_id;

    if (!billId) {
      this.toastr.error('Invalid bill data');
      return;
    }

    this.selectedFile = null;
    this.imagePreview = null;

    this.billForm.patchValue({
      animal_type: bill.animal_type || '',
      price: bill.price,
      date: this.formatDateForInput(bill.date),
      BillImage: bill.BillImage || ''
    });

    this.loader.show();

    this.api.get(`BillDairy/GetBillImageById/${billId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.BillImage || res?.billImage || bill.BillImage;
          if (image) {
            this.billForm.patchValue({ BillImage: image });
          }
          this.showModal();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error("Failed to load bill image");
          this.showModal();
        }
      });
  }

  closeModal(): void {
    const modalElement = this.billModal?.nativeElement;
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
    const modalElement = this.billModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // ==================== GROUP BILLS BY DATE ====================
  groupBillsByDate(): void {
    this.groupedBills = [];

    if (!this.filteredBills || this.filteredBills.length === 0) return;

    const map = new Map<string, any[]>();

    for (const bill of this.filteredBills) {
      const dateStr = this.getDateString(bill.date);

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(bill);
    }

    this.groupedBills = Array.from(map.entries()).map(([date, items]) => ({
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
  loadBills(): void {
    if (!this.dairyUserId) {
      this.toastr.warning('Please login to Dairy Farm');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    this.api.get(`BillDairy/History/${this.dairyUserId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.bills = Array.isArray(response) ? response : [];
          this.filteredBills = [...this.bills];
          this.groupBillsByDate();
        },
        error: (error: any) => {
          console.error('Failed to load bills:', error);
          this.toastr.error('Failed to load bills');
          this.bills = [];
          this.filteredBills = [];
          this.groupedBills = [];
        }
      });
  }

  async submitBill(): Promise<void> {
    this.submitted = true;

    if (this.modalMode === 'delete') {
      if (!this.deleteReason.trim()) {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteBill();
      return;
    }

    if (this.billForm.invalid) {
      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    try {
      // Use the compressed preview image if available
      if (this.imagePreview) {
        this.billForm.patchValue({ BillImage: this.imagePreview });
      } else if (this.selectedFile) {
        // Fallback to regular upload if no preview
        const base64Image = await this.uploadImage();
        this.billForm.patchValue({ BillImage: base64Image });
      }

      if (this.modalMode === 'add') {
        await this.addBill();
      } else if (this.modalMode === 'edit') {
        await this.updateBill();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      this.toastr.error('Failed to upload image');
    }
  }

  async addBill(): Promise<void> {
    this.isSaving = true;

    const payload = {
      user_id: this.dairyUserId,
      animal_type: this.billForm.value.animal_type,
      price: Number(this.billForm.value.price),
      date: this.formatDateForAPI(this.billForm.value.date),
      BillImage: this.billForm.value.BillImage || ''
    };

    this.loader.show();

    this.api.post('BillDairy/Save', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isSaving = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Bill saved successfully');
          this.closeModal();
          this.loadBills();
        },
        error: (error: any) => {
          console.error('Save error:', error);
          this.toastr.error('Failed to save bill');
        }
      });
  }

  async updateBill(): Promise<void> {
    if (!this.selectedBill?.bill_id) {
      this.toastr.error('Invalid bill data');
      return;
    }

    this.isUpdating = true;

    const payload = {
      bill_id: this.selectedBill.bill_id,
      user_id: this.dairyUserId,
      animal_type: this.billForm.value.animal_type,
      price: Number(this.billForm.value.price),
      date: this.formatDateForAPI(this.billForm.value.date),
      BillImage: this.billForm.value.BillImage || ''
    };

    this.loader.show();

    this.api.put('BillDairy/Edit', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isUpdating = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Bill updated successfully');
          this.closeModal();
          this.loadBills();
        },
        error: (error: any) => {
          console.error('Update error:', error);
          this.toastr.error('Failed to update bill');
        }
      });
  }

  deleteBill(): void {
    if (!this.selectedBill?.bill_id) {
      this.toastr.error('Invalid bill data');
      return;
    }

    this.isDeleting = true;

    this.loader.show();

    this.api.delete(`BillDairy/${this.selectedBill.bill_id}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isDeleting = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Bill deleted successfully');
          this.closeModal();
          this.loadBills();
        },
        error: (error: any) => {
          console.error('Delete error:', error);
          this.toastr.error('Failed to delete bill');
        }
      });
  }

  getBillId(bill: any): number {
    return bill.bill_id ?? 0;
  }

  // ==================== SEARCH & FILTER ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();

    if (!search) {
      this.filteredBills = [...this.bills];
      this.groupBillsByDate();
      return;
    }

    const dateMatch = this.tryParseDate(search);
    if (dateMatch) {
      this.filteredBills = this.bills.filter(bill => {
        const billDate = this.formatDateDisplay(bill.date).toLowerCase();
        return billDate.includes(dateMatch);
      });
    } else {
      this.filteredBills = this.bills.filter(bill =>
        bill.animal_type?.toLowerCase().includes(search)
      );
    }

    // Regroup after filtering
    this.groupBillsByDate();
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
    if (!this.selectedBill) {
      this.toastr.error('No bill data available');
      return;
    }

    console.log('Editing bill from view modal:', this.selectedBill);

    // Close the view modal
    this.closeViewModal();

    // Open edit modal with the selected bill
    setTimeout(() => {
      this.openEditModal(this.selectedBill);
    }, 300);
  }

  deleteFromViewModal(): void {
    if (!this.selectedBill) {
      this.toastr.error('No bill data available');
      return;
    }

    console.log('Deleting bill from view modal:', this.selectedBill);

    // Close the view modal
    this.closeViewModal();

    // Open delete modal with the selected bill
    setTimeout(() => {
      this.openDeleteModal(this.selectedBill);
    }, 300);
  }

}