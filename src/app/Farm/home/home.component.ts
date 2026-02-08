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
  
  // Image compression settings
  private readonly TARGET_FILE_SIZE = 50 * 1024; // 50KB target
  private readonly MAX_ALLOWED_SIZE = 50 * 1024; // Maximum allowed size 50KB
  private readonly INITIAL_QUALITY = 0.8; // Start with 80% quality
  private readonly MIN_QUALITY = 0.1; // Minimum quality 10%
  private readonly MAX_WIDTH = 1024; // Maximum width for resizing
  private readonly MAX_HEIGHT = 768; // Maximum height for resizing
  
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

  async onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type only
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Only image files are allowed (JPEG, PNG, GIF, WebP, BMP, TIFF)');
      return;
    }
    
    try {
      this.loader.show();
      
      // Show original size info
      const originalSizeKB = Math.round(file.size / 1024);
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      console.log(`Original image: ${originalSizeKB}KB (${originalSizeMB}MB)`);
      
      // Compress the image
      const compressedFile = await this.compressImageToTargetSize(file);
      this.selectedFile = compressedFile;
      
      // Create preview from compressed file
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result;
        this.loader.hide();
        
        // Show compression info
        const compressedSizeKB = Math.round(compressedFile.size / 1024);
        const reductionPercentage = Math.round(((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100);
        
        if (compressedSizeKB <= this.MAX_ALLOWED_SIZE) {
          this.toastr.success(
            `Image compressed from ${originalSizeKB}KB to ${compressedSizeKB}KB (${reductionPercentage}% reduction)`,
            '',
            { timeOut: 3000 }
          );
        } else {
          this.toastr.warning(
            `Image compressed from ${originalSizeKB}KB to ${compressedSizeKB}KB (Minimum quality reached)`,
            '',
            { timeOut: 3000 }
          );
        }
      };
      reader.readAsDataURL(compressedFile);
      
    } catch (error: any) {
      console.error('Image compression error:', error);
      this.toastr.error(`Failed to process image: ${error.message}`);
      this.loader.hide();
    }
  }

  private async compressImageToTargetSize(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        img.src = e.target.result;
        
        img.onload = () => {
          // Calculate optimal dimensions for compression
          const dimensions = this.calculateOptimalDimensions(img.width, img.height);
          
          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Set canvas background to white for transparent PNGs
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw image with new dimensions
          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
          
          // Convert all images to JPEG for maximum compression
          const mimeType = 'image/jpeg';
          
          // Use progressive compression to reach target size
          this.compressWithProgressiveQuality(canvas, mimeType, this.INITIAL_QUALITY)
            .then(blob => {
              const compressedFile = new File([blob], this.generateFileName(file), {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            })
            .catch(reject);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for compression'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  private calculateOptimalDimensions(originalWidth: number, originalHeight: number): { width: number, height: number } {
    let width = originalWidth;
    let height = originalHeight;
    
    // If image is very large, scale down aggressively
    const maxPixels = this.MAX_WIDTH * this.MAX_HEIGHT;
    const currentPixels = width * height;
    
    if (currentPixels > maxPixels * 4) {
      // For very large images (4x max pixels), scale down more aggressively
      const scale = Math.sqrt((maxPixels * 2) / currentPixels);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    } else if (currentPixels > maxPixels) {
      // Scale down to fit within max dimensions while maintaining aspect ratio
      const ratio = Math.min(this.MAX_WIDTH / width, this.MAX_HEIGHT / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    // Ensure minimum dimensions for very small images
    width = Math.max(width, 100);
    height = Math.max(height, 100);
    
    return { width, height };
  }

  private async compressWithProgressiveQuality(
    canvas: HTMLCanvasElement, 
    mimeType: string, 
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }
          
          const currentSize = blob.size;
          
          // Check if we've reached the target size or minimum quality
          if (currentSize <= this.TARGET_FILE_SIZE || quality <= this.MIN_QUALITY) {
            resolve(blob);
            return;
          }
          
          // Calculate next quality level (reduce by 15% each iteration)
          const nextQuality = Math.max(this.MIN_QUALITY, quality - 0.15);
          
          // Recursively compress with lower quality
          this.compressWithProgressiveQuality(canvas, mimeType, nextQuality)
            .then(resolve)
            .catch(reject);
        },
        mimeType,
        quality
      );
    });
  }

  private generateFileName(originalFile: File): string {
    const originalName = originalFile.name;
    const extensionIndex = originalName.lastIndexOf('.');
    const nameWithoutExt = extensionIndex > 0 ? originalName.substring(0, extensionIndex) : originalName;
    const timestamp = Date.now();
    return `${nameWithoutExt}_compressed_${timestamp}.jpg`;
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
        
        // Show final file size info
        const fileSizeKB = Math.round(this.selectedFile.size / 1024);
        console.log(`Uploading compressed image: ${fileSizeKB}KB`);
        
        const uploadResult: any = await this.api.upload('FileUpload/Upload', formData).toPromise();
        
        if (uploadResult && uploadResult.success) {
          imagePath = uploadResult.filePath;
          uploadedFileName = uploadResult.fileName;
          
          // Show upload success message
          this.toastr.success(`Compressed image uploaded (${fileSizeKB}KB)`);
          
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