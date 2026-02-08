import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/auth.service';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../services/loader.service';

interface Farm {
  farM_ID: number;
  farM_NAME: string;
  useR_ID: string;
  image: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  items: Farm[] = [];
  showModal = false;
  editMode = false;
  menuIndex: number | null = null;
  formName = '';
  selectedFile: File | null = null;
  previewImage: string | null = null;
  editId: number | null = null;
  userId: string = '';
  userName: string | null = null;
  showLogoutConfirm = false;
  existingImagePath: string | null = null;
  existingFileName: string | null = null;
  
  // Image preview modal
  showImagePreview = false;
  previewImageUrl: string | null = null;
  previewImageName: string = '';
  
  private subscriptions = new Subscription();
  private isBrowser: boolean;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService,
    public loader: LoaderService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.initializeUser();
    this.getAll();
    
    if (this.isBrowser) {
      document.addEventListener('click', this.closeDropdown.bind(this));
      document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    
    if (this.isBrowser) {
      document.removeEventListener('click', this.closeDropdown.bind(this));
      document.removeEventListener('keydown', this.handleKeyPress.bind(this));
    }
  }

  initializeUser() {
    const userDetails = this.auth.getFarmUserDetailsFromCookie();
    this.userId = userDetails?.useR_ID?.toString() || '';
    this.userName = userDetails?.useR_NAME || 'User';
    
    if (!this.userId) {
      this.toastr.error('User not authenticated');
    }
  }

  getAll() {
    this.loader.show();
    
    const sub = this.api.get('HomeFarm/GetAll', { userId: this.userId })
      .subscribe({
        next: (res: any) => {
          this.items = Array.isArray(res) ? res : [];
          this.loader.hide();
        },
        error: (err) => {
          console.error('Error loading farms:', err);
          this.toastr.error('Failed to load farms');
          this.loader.hide();
        }
      });
    
    this.subscriptions.add(sub);
  }

  openModal() {
    this.showModal = true;
    this.editMode = false;
    this.resetForm();
    this.menuIndex = null;
  }

  closeModal() {
    this.showModal = false;
    this.editMode = false;
    this.resetForm();
  }

  resetForm() {
    this.formName = '';
    this.selectedFile = null;
    this.previewImage = null;
    this.editId = null;
    this.existingImagePath = null;
    this.existingFileName = null;
    
    // Reset file input
    if (this.isBrowser) {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toastr.error('File size should be less than 5MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      return;
    }
    
    this.selectedFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImage = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedFile = null;
    this.previewImage = null;
    this.existingImagePath = null;
    this.existingFileName = null;
    
    // Reset file input
    if (this.isBrowser) {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  async saveItem() {
    if (!this.formName.trim()) {
      this.toastr.error('Please enter a farm name');
      return;
    }

    try {
      this.loader.show();
      
      let imagePath = this.existingImagePath || '';
      let uploadedFileName = this.existingFileName || '';
      
      // Upload new image if selected
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        const uploadResult: any = await this.api.upload('FileUpload/Upload', formData).toPromise();
        
        if (uploadResult && uploadResult.success) {
          imagePath = uploadResult.filePath;
          uploadedFileName = uploadResult.fileName;
          
          // Delete old image if updating and it's a different file
          if (this.editMode && this.existingFileName && this.existingFileName !== uploadedFileName) {
            try {
              await this.api.deleteFile('FileUpload/Delete', { 
                fileName: this.existingFileName 
              }).toPromise();
              console.log('Old image deleted:', this.existingFileName);
            } catch (error) {
              console.warn('Could not delete old image:', error);
              // Continue anyway - don't fail the whole operation
            }
          }
        } else {
          this.toastr.error(uploadResult?.message || 'Failed to upload image');
          this.loader.hide();
          return;
        }
      }
      
      if (this.editMode) {
        await this.updateFarm(imagePath);
      } else {
        await this.insertFarm(imagePath);
      }
      
    } catch (error: any) {
      console.error('Save error:', error);
      this.toastr.error(error?.error?.message || error?.message || 'Error saving farm');
      this.loader.hide();
    }
  }

  async insertFarm(imagePath: string) {
    const payload = {
      farM_NAME: this.formName.trim(),
      useR_ID: this.userId,
      image: imagePath || ''
    };
    
    try {
      const result: any = await this.api.post('HomeFarm/Insert', payload).toPromise();
      
      if (result.success) {
        this.toastr.success('Farm added successfully');
        this.closeModal();
        this.getAll();
      } else {
        this.toastr.error(result.message || 'Failed to add farm');
        this.loader.hide();
      }
    } catch (error: any) {
      this.toastr.error(error?.error?.message || error?.message || 'Failed to add farm');
      this.loader.hide();
      throw error;
    }
  }

  async updateFarm(imagePath: string) {
    if (!this.editId) {
      this.toastr.error('Invalid farm ID');
      this.loader.hide();
      return;
    }
    
    const payload = {
      farM_ID: this.editId,
      farM_NAME: this.formName.trim(),
      useR_ID: this.userId,
      image: imagePath || ''
    };
    
    try {
      const result: any = await this.api.put('HomeFarm/Update', payload).toPromise();
      
      if (result.success) {
        this.toastr.success('Farm updated successfully');
        this.closeModal();
        this.getAll();
      } else {
        this.toastr.error(result.message || 'Failed to update farm');
        this.loader.hide();
      }
    } catch (error: any) {
      this.toastr.error(error?.error?.message || error?.message || 'Failed to update farm');
      this.loader.hide();
      throw error;
    }
  }

  editItem(item: Farm) {
    this.editMode = true;
    this.showModal = true;
    this.formName = item.farM_NAME;
    this.editId = item.farM_ID;
    this.menuIndex = null;
    
    // Store existing image details
    if (item.image && item.image.trim() !== '') {
      this.previewImage = item.image;
      
      // Extract filename from URL or path
      this.extractImageDetails(item.image);
    } else {
      this.previewImage = null;
      this.existingImagePath = null;
      this.existingFileName = null;
    }
    
    this.selectedFile = null;
  }

  private extractImageDetails(imageUrl: string) {
    try {
      // Remove query parameters if any
      const cleanUrl = imageUrl.split('?')[0];
      
      // Extract filename from URL
      const parts = cleanUrl.split('/');
      const fileName = parts[parts.length - 1];
      
      if (fileName && fileName.includes('.')) {
        this.existingFileName = fileName;
        // Store as relative path
        this.existingImagePath = `/FarmImgs/${fileName}`;
      } else {
        this.existingFileName = null;
        this.existingImagePath = null;
      }
    } catch (error) {
      console.warn('Could not extract image details:', error);
      this.existingFileName = null;
      this.existingImagePath = null;
    }
  }

  deleteItem(item: Farm) {
    if (!confirm(`Are you sure you want to delete "${item.farM_NAME}"? This action cannot be undone.`)) {
      return;
    }
    
    this.loader.show();
    
    const sub = this.api.delete('HomeFarm/Delete', { 
      farmId: item.farM_ID,
      userId: this.userId 
    })
    .subscribe({
      next: (result: any) => {
        if (result && result.success) {
          this.toastr.success('Farm deleted successfully');
          this.getAll();
        } else {
          this.toastr.error(result?.message || 'Failed to delete farm');
          this.loader.hide();
        }
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.toastr.error(err.error?.message || err.message || 'Failed to delete farm');
        this.loader.hide();
      }
    });
    
    this.subscriptions.add(sub);
  }

  toggleMenu(index: number) {
    this.menuIndex = this.menuIndex === index ? null : index;
  }

  closeDropdown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isMenuButton = target.closest('button')?.querySelector('.ri-more-2-fill');
    const isMenu = target.closest('div[class*="absolute right-3 top-12"]');
    
    if (!isMenuButton && !isMenu && this.menuIndex !== null) {
      this.menuIndex = null;
    }
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showImagePreview) {
        this.closeImagePreview();
      } else if (this.showModal) {
        this.closeModal();
      }
    }
  }

  openImagePreview(item: Farm) {
    if (!item.image) {
      this.toastr.info('No image available for this farm');
      return;
    }
    
    this.previewImageUrl = item.image;
    this.previewImageName = item.farM_NAME;
    this.showImagePreview = true;
    
    // Prevent body scrolling
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImageUrl = null;
    this.previewImageName = '';
    
    // Restore body scrolling
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  downloadImage() {
    if (!this.previewImageUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = this.previewImageUrl;
      
      // Extract extension from URL
      const urlParts = this.previewImageUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';
      
      link.download = `${this.previewImageName || 'farm-image'}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.toastr.info('Image download started');
    } catch (error) {
      console.error('Download error:', error);
      this.toastr.error('Failed to download image');
    }
  }

  confirmLogout(): void {
    this.showLogoutConfirm = true;
  }

  logoutConfirmed(): void {
    this.showLogoutConfirm = false;
    this.FarmLogout();
  }

  FarmLogout(): void {
    try { 
      this.loader.show(); 
    } catch (e) { 
      console.warn('Loader error:', e);
    }

    try {
      this.auth.farmLogout();
    } finally {
      setTimeout(() => {
        try { 
          this.loader.hide(); 
        } catch (e) {
          console.warn('Loader hide error:', e);
        }
      }, 200);
    }
  }

  // Image error handlers
  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }

  handlePreviewImageError() {
    this.previewImageUrl = null;
  }
}