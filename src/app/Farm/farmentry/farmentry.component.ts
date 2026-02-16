import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';
import { ImageCompressionService } from '../../shared/Imagecompression.service';

interface FarmEntry {
  farM_ENTRY_ID: number;
  entrY_TYPE: string;
  reason: string;
  price: number;
  farM_ID: number;
  useR_ID: number;
  imagE1?: string;
  imagE2?: string;
  imagE3?: string;
  imagE4?: string;
  date: string;
}

@Component({
  selector: 'app-farmentry',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './farmentry.component.html',
  styleUrl: './farmentry.component.css'
})
export class FarmentryComponent implements OnInit, OnDestroy {
  // Farm data
  farmId: number | null = null;
  farmName: string = '';
  farmImage: string = '';
  userId: string = '';

  // Entry type data
  entryTypeId: number | null = null;
  entryTypeName: string = '';
  entryTypeImage: string = '';
  entryTypeRoute: string = '';

  // UI state
  showMenu = false;
  showModal = false;
  showViewModal = false;
  showEditModal = false;
  searchQuery = '';
  showDeleteEntryConfirm = false;
  
  // Entries data
  entries: FarmEntry[] = [];
  filteredEntries: FarmEntry[] = [];
  groupedEntries: { date: string; count: number; entries: FarmEntry[] }[] = [];
  
  // Selected entry for view/edit
  selectedEntry: FarmEntry | null = null;
  viewImages: string[] = [];
  
  // Form data for adding
  formData = {
    reason: '',
    price: 0,
    date: new Date().toISOString().split('T')[0]
  };
  
  // Form data for editing
  editFormData = {
    reason: '',
    price: 0,
    date: ''
  };
  
  // Add modal files
  selectedFiles: File[] = [];
  previewImages: string[] = [];
  
  // Edit modal files
  selectedEditFiles: File[] = [];
  editPreviewImages: string[] = [];
  existingImages: string[] = [];
  
  // Image preview
  showImagePreview = false;
  previewImageUrl: string = '';
  currentImageIndex = 0;
  
  totalAmount = 0;
  
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private toastr: ToastrService,
    public loader: LoaderService,
    private imageCompression: ImageCompressionService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.loadFarmEntryData();
    this.loadEntries();
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  private loadFarmEntryData() {
    // Priority 1: Try to get from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const farmEntryData = navigation.extras.state['farmEntryData'];
      if (farmEntryData) {
        this.setFarmEntryData(farmEntryData);
        return;
      }
    }

    // Priority 2: Try to get from sessionStorage
    const savedData = sessionStorage.getItem('currentFarmEntry');
    if (savedData) {
      try {
        const farmEntryData = JSON.parse(savedData);
        this.setFarmEntryData(farmEntryData);
        return;
      } catch (error) {
        console.error('Error parsing saved farm entry data:', error);
      }
    }

    // Priority 3: Try to get from query parameters (partial data)
    this.route.queryParams.subscribe(params => {
      if (params['farmId']) {
        this.farmId = Number(params['farmId']);
        this.entryTypeId = Number(params['entryTypeId']) || null;
        console.log('Loaded partial data from query params');
      }
    });
  }

  private setFarmEntryData(data: any) {
    // Farm data
    this.farmId = data.farmId;
    this.farmName = data.farmName;
    this.farmImage = data.farmImage || '';
    this.userId = data.userId || '';

    // Entry type data
    this.entryTypeId = data.entryTypeId;
    this.entryTypeName = data.entryTypeName;
    this.entryTypeImage = data.entryTypeImage || '';
    this.entryTypeRoute = data.entryTypeRoute || '';

    console.log('Farm Entry Data Loaded:', {
      farmId: this.farmId,
      farmName: this.farmName,
      entryTypeId: this.entryTypeId,
      entryTypeName: this.entryTypeName
    });
  }

  loadEntries() {
    if (!this.farmId || !this.userId) {
      console.warn('Farm ID or User ID not available');
      return;
    }

    this.loader.show();
    
    this.api.get('FarmEntry/GetAll', { 
      farmId: this.farmId, 
      userId: this.userId, 
      entryTypeName: this.entryTypeName
    }).subscribe({
      next: (res: any) => {
        this.entries = Array.isArray(res) ? res : [];
        this.filteredEntries = [...this.entries];
        this.groupEntriesByDate();
        this.calculateTotal();
        this.loader.hide();
      },
      error: (err) => {
        console.error('Error loading entries:', err);
        this.toastr.error('Failed to load entries');
        this.loader.hide();
      }
    });
  }

  groupEntriesByDate() {
    const grouped = new Map<string, FarmEntry[]>();
    
    this.filteredEntries.forEach(entry => {
      const dateKey = this.formatDate(entry.date);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    });

    this.groupedEntries = Array.from(grouped.entries()).map(([date, entries]) => ({
      date,
      count: entries.length,
      entries
    }));
  }

  calculateTotal() {
    this.totalAmount = this.filteredEntries.reduce((sum, entry) => sum + entry.price, 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  searchEntries() {
    if (!this.searchQuery.trim()) {
      this.filteredEntries = [...this.entries];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredEntries = this.entries.filter(entry => 
        entry.reason.toLowerCase().includes(query) ||
        entry.entrY_TYPE.toLowerCase().includes(query)
      );
    }
    this.groupEntriesByDate();
    this.calculateTotal();
  }

  // ============= ADD MODAL =============
  openAddModal() {
    this.showModal = true;
    this.resetForm();
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      reason: '',
      price: 0,
      date: new Date().toISOString().split('T')[0]
    };
    this.selectedFiles = [];
    this.previewImages = [];
    
    if (this.isBrowser) {
      const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  async onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    if (this.selectedFiles.length + files.length > 4) {
      this.toastr.warning('Maximum 4 images allowed');
      return;
    }

    // Show loading indicator
    this.toastr.info('Compressing images...', '', { timeOut: 2000 });

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.toastr.error(`${file.name} is not an image file`);
        continue;
      }

      try {
        // Show original size
        const originalSizeKB = this.imageCompression.getFileSizeKB(file);
        console.log(`Original size of ${file.name}: ${originalSizeKB.toFixed(2)} KB`);

        // Compress the image to 50KB
        const compressedFile = await this.imageCompression.compressImage(file, 50);
        
        // Show compressed size
        const compressedSizeKB = this.imageCompression.getFileSizeKB(compressedFile);
        console.log(`Compressed size of ${file.name}: ${compressedSizeKB.toFixed(2)} KB`);

        this.selectedFiles.push(compressedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewImages.push(e.target.result);
        };
        reader.readAsDataURL(compressedFile);

        // Show success message
        this.toastr.success(
          `${file.name} compressed from ${originalSizeKB.toFixed(1)}KB to ${compressedSizeKB.toFixed(1)}KB`,
          'Image Compressed',
          { timeOut: 3000 }
        );
        
      } catch (error) {
        console.error('Compression error:', error);
        this.toastr.error(`Failed to compress ${file.name}`);
      }
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewImages.splice(index, 1);
  }

  async saveEntry() {
    if (!this.formData.reason.trim()) {
      this.toastr.error('Please enter a reason');
      return;
    }

    if (this.formData.price <= 0) {
      this.toastr.error('Please enter a valid price');
      return;
    }

    try {
      this.loader.show();
      
      let imagePaths = ['', '', '', ''];
      
      // Upload images
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const formData = new FormData();
        formData.append('file', this.selectedFiles[i]);
        
        const uploadResult: any = await this.api.upload('FileUpload/Upload', formData).toPromise();
        
        if (uploadResult && uploadResult.success) {
          imagePaths[i] = uploadResult.filePath;
        }
      }
      
      // Save entry
      const payload = {
        entrY_TYPE: this.entryTypeName,
        reason: this.formData.reason.trim(),
        price: this.formData.price,
        farM_ID: this.farmId,
        useR_ID: Number(this.userId),
        image1: imagePaths[0],
        image2: imagePaths[1],
        image3: imagePaths[2],
        image4: imagePaths[3],
        date: this.formData.date
      };
      
      const result: any = await this.api.post('FarmEntry/Insert', payload).toPromise();
      
      if (result.success) {
        this.toastr.success('Entry added successfully');
        this.closeModal();
        this.loadEntries();
      } else {
        this.toastr.error(result.message || 'Failed to add entry');
        this.loader.hide();
      }
      
    } catch (error: any) {
      console.error('Save error:', error);
      this.toastr.error(error?.error?.message || error?.message || 'Error saving entry');
      this.loader.hide();
    }
  }

  // ============= VIEW MODAL =============
  viewEntry(entry: FarmEntry) {
    this.selectedEntry = entry;
    this.loadViewImages();
    this.showViewModal = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedEntry = null;
    this.viewImages = [];
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  private loadViewImages() {
    if (!this.selectedEntry) return;
    
    const img1 = this.selectedEntry.imagE1 || '';
    const img2 = this.selectedEntry.imagE2 || '';
    const img3 = this.selectedEntry.imagE3 || '';
    const img4 = this.selectedEntry.imagE4 || '';
    
    this.viewImages = [img1, img2, img3, img4].filter(img => img && img.trim() !== '');
  }

  openEditFromView() {
    if (!this.selectedEntry) return;
    
    this.editFormData = {
      reason: this.selectedEntry.reason,
      price: this.selectedEntry.price,
      date: this.selectedEntry.date.split('T')[0]
    };
    
    this.existingImages = [...this.viewImages];
    this.selectedEditFiles = [];
    this.editPreviewImages = [];
    
    this.showViewModal = false;
    this.showEditModal = true;
  }

  deleteEntryFromView() {
  if (!this.selectedEntry) return;
  
  // Show the custom modal instead of browser confirm
  this.showDeleteEntryConfirm = true;
}

cancelDeleteEntry() {
  this.showDeleteEntryConfirm = false;
}

confirmDeleteEntry() {
  if (!this.selectedEntry) return;
  
  this.showDeleteEntryConfirm = false;
  this.loader.show();

  this.api.delete('FarmEntry/Delete', {
    farmEntryId: this.selectedEntry.farM_ENTRY_ID,
    farmId: this.selectedEntry.farM_ID,
    userId: this.selectedEntry.useR_ID
  }).subscribe({
    next: (result: any) => {
      if (result && result.success) {
        this.toastr.success('Entry deleted successfully');
        this.closeViewModal();
        this.loadEntries();
      } else {
        this.toastr.error(result?.message || 'Failed to delete entry');
        this.loader.hide();
      }
    },
    error: (err) => {
      console.error('Delete error:', err);
      this.toastr.error(err.error?.message || 'Failed to delete entry');
      this.loader.hide();
    }
  });
}

  // ============= EDIT MODAL =============
  closeEditModal() {
    this.showEditModal = false;
    this.resetEditForm();
  }

  resetEditForm() {
    this.selectedEditFiles = [];
    this.editPreviewImages = [];
    this.existingImages = [];
    
    if (this.isBrowser) {
      const fileInput = document.getElementById('editFileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  async onEditFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    const totalImages = this.existingImages.length + this.selectedEditFiles.length + files.length;
    if (totalImages > 4) {
      this.toastr.warning('Maximum 4 images allowed in total');
      return;
    }

    // Show loading indicator
    this.toastr.info('Compressing images...', '', { timeOut: 2000 });

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.toastr.error(`${file.name} is not an image file`);
        continue;
      }

      try {
        // Show original size
        const originalSizeKB = this.imageCompression.getFileSizeKB(file);
        console.log(`Original size of ${file.name}: ${originalSizeKB.toFixed(2)} KB`);

        // Compress the image to 50KB
        const compressedFile = await this.imageCompression.compressImage(file, 50);
        
        // Show compressed size
        const compressedSizeKB = this.imageCompression.getFileSizeKB(compressedFile);
        console.log(`Compressed size of ${file.name}: ${compressedSizeKB.toFixed(2)} KB`);

        this.selectedEditFiles.push(compressedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.editPreviewImages.push(e.target.result);
        };
        reader.readAsDataURL(compressedFile);

        // Show success message
        this.toastr.success(
          `${file.name} compressed from ${originalSizeKB.toFixed(1)}KB to ${compressedSizeKB.toFixed(1)}KB`,
          'Image Compressed',
          { timeOut: 3000 }
        );
        
      } catch (error) {
        console.error('Compression error:', error);
        this.toastr.error(`Failed to compress ${file.name}`);
      }
    }
  }

  removeEditImage(index: number) {
    this.selectedEditFiles.splice(index, 1);
    this.editPreviewImages.splice(index, 1);
  }

  removeExistingImage(index: number) {
    this.existingImages.splice(index, 1);
    this.toastr.info('Image removed');
  }

  getRemainingSlots(): number {
    return 4 - (this.existingImages.length + this.selectedEditFiles.length);
  }

  async updateEntry() {
    if (!this.selectedEntry) return;

    if (!this.editFormData.reason.trim()) {
      this.toastr.error('Please enter a reason');
      return;
    }

    if (this.editFormData.price <= 0) {
      this.toastr.error('Please enter a valid price');
      return;
    }

    try {
      this.loader.show();
      
      // Prepare image paths array
      let imagePaths = ['', '', '', ''];
      
      // Keep existing images (extract relative paths)
      for (let i = 0; i < this.existingImages.length; i++) {
        const img = this.existingImages[i];
        if (img) {
          // If it's a full URL, extract the path part
          if (img.includes('/FarmImgs/')) {
            const parts = img.split('/FarmImgs/');
            imagePaths[i] = '/FarmImgs/' + parts[parts.length - 1];
          } else {
            imagePaths[i] = img;
          }
        }
      }
      
      // Upload new images
      let currentIndex = this.existingImages.length;
      for (let i = 0; i < this.selectedEditFiles.length && currentIndex < 4; i++) {
        const formData = new FormData();
        formData.append('file', this.selectedEditFiles[i]);
        
        const uploadResult: any = await this.api.upload('FileUpload/Upload', formData).toPromise();
        
        if (uploadResult && uploadResult.success) {
          imagePaths[currentIndex] = uploadResult.filePath;
          currentIndex++;
        }
      }
      
      // Update entry
      const payload = {
        farM_ENTRY_ID: this.selectedEntry.farM_ENTRY_ID,
        entrY_TYPE: this.selectedEntry.entrY_TYPE,
        reason: this.editFormData.reason.trim(),
        price: this.editFormData.price,
        farM_ID: this.selectedEntry.farM_ID,
        useR_ID: this.selectedEntry.useR_ID,
        image1: imagePaths[0],
        image2: imagePaths[1],
        image3: imagePaths[2],
        image4: imagePaths[3],
        date: this.editFormData.date
      };
      
      console.log('Update payload:', payload);
      
      const result: any = await this.api.put('FarmEntry/Update', payload).toPromise();
      
      if (result.success) {
        this.toastr.success('Entry updated successfully');
        this.closeEditModal();
        this.selectedEntry = null;
        this.loadEntries();
      } else {
        this.toastr.error(result.message || 'Failed to update entry');
        this.loader.hide();
      }
      
    } catch (error: any) {
      console.error('Update error:', error);
      this.toastr.error(error?.error?.message || error?.message || 'Error updating entry');
      this.loader.hide();
    }
  }

  // ============= IMAGE PREVIEW =============
  openImagePreview(imageUrl: string, index: number) {
    this.previewImageUrl = imageUrl;
    this.currentImageIndex = index;
    this.showImagePreview = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImageUrl = '';
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.viewImages.length - 1) {
      this.currentImageIndex++;
      this.previewImageUrl = this.viewImages[this.currentImageIndex];
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.previewImageUrl = this.viewImages[this.currentImageIndex];
    }
  }

  // ============= NAVIGATION =============
  navigateBack() {
    this.router.navigate(['/SF/farmentrytypes']);
  }

  navigateToHome() {
    this.router.navigate(['/SF/home']);
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }

  // ============= FILE INPUT TRIGGERS =============
  triggerFileInput() {
    if (this.isBrowser) {
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }

  triggerEditFileInput() {
    if (this.isBrowser) {
      const fileInput = document.getElementById('editFileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }
  
  isIncomeEntry(): boolean {
    const incomTypes = ['self work', 'farm profit'];
    return incomTypes.includes(this.entryTypeName.toLowerCase());
  }
}