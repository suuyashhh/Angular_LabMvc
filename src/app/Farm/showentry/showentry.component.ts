import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

interface EntryDetail {
  farM_ENTRY_ID: number;
  entrY_TYPE: string;
  reason: string;
  price: number;
  farM_ID: number;
  useR_ID: number;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  date: string;
  farmName?: string;
  farmImage?: string;
  entryTypeName?: string;
  entryTypeImage?: string;
}

@Component({
  selector: 'app-showentry',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './showentry.component.html',
  styleUrl: './showentry.component.css'
})
export class ShowentryComponent implements OnInit {
  entry: EntryDetail | null = null;
  images: string[] = [];
  showImagePreview = false;
  previewImageUrl: string = '';
  currentImageIndex = 0;
  
  // Update modal
  showUpdateModal = false;
  formData = {
    reason: '',
    price: 0,
    date: ''
  };
  selectedFiles: File[] = [];
  previewImages: string[] = [];
  existingImages: string[] = [];
  
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private toastr: ToastrService,
    public loader: LoaderService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.loadEntryData();
  }

  private loadEntryData() {
    // Try to get from navigation state first
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const entryData = navigation.extras.state['entryData'];
      if (entryData) {
        this.entry = entryData;
        this.loadImages();
        return;
      }
    }

    // Try to get from sessionStorage
    const savedData = sessionStorage.getItem('currentEntryDetail');
    if (savedData) {
      try {
        this.entry = JSON.parse(savedData);
        this.loadImages();
        return;
      } catch (error) {
        console.error('Error parsing saved entry data:', error);
      }
    }

    // Fallback: Fetch from API using query params
    this.route.queryParams.subscribe(params => {
      if (params['farmEntryId'] && params['farmId']) {
        this.fetchEntryById(
          Number(params['farmEntryId']),
          Number(params['farmId'])
        );
      }
    });
  }

  private fetchEntryById(farmEntryId: number, farmId: number) {
    this.loader.show();
    
    // Get userId from sessionStorage or other source
    const farmData = sessionStorage.getItem('currentFarmEntry');
    let userId = 0;
    
    if (farmData) {
      try {
        const data = JSON.parse(farmData);
        userId = data.userId;
      } catch (e) {
        console.error('Error parsing farm data:', e);
      }
    }

    this.api.get('FarmEntry/GetById', {
      farmEntryId,
      farmId,
      userId
    }).subscribe({
      next: (res: any) => {
        console.log('API Response:', res); // Debug log
        this.entry = res;
        this.loadImages();
        this.loader.hide();
      },
      error: (err) => {
        console.error('Error loading entry:', err);
        this.toastr.error('Failed to load entry details');
        this.loader.hide();
        this.navigateBack();
      }
    });
  }

  private loadImages() {
    if (!this.entry) return;
    
    console.log('Entry object:', this.entry); // Debug log
    console.log('Image1:', this.entry.image1); // Debug log
    console.log('Image2:', this.entry.image2); // Debug log
    
    // Try both uppercase and lowercase property names
    const img1 = this.entry.image1 || (this.entry as any).IMAGE1 || '';
    const img2 = this.entry.image2 || (this.entry as any).IMAGE2 || '';
    const img3 = this.entry.image3 || (this.entry as any).IMAGE3 || '';
    const img4 = this.entry.image4 || (this.entry as any).IMAGE4 || '';
    
    this.images = [img1, img2, img3, img4].filter(img => img && img.trim() !== '');
    
    console.log('Loaded images:', this.images); // Debug log
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

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
    if (this.currentImageIndex < this.images.length - 1) {
      this.currentImageIndex++;
      this.previewImageUrl = this.images[this.currentImageIndex];
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.previewImageUrl = this.images[this.currentImageIndex];
    }
  }

  // Update functionality
  openUpdateModal() {
    if (!this.entry) return;
    
    this.formData = {
      reason: this.entry.reason,
      price: this.entry.price,
      date: this.entry.date.split('T')[0] // Format date for input
    };
    
    this.existingImages = [...this.images];
    this.selectedFiles = [];
    this.previewImages = [];
    this.showUpdateModal = true;
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
    this.resetUpdateForm();
  }

  resetUpdateForm() {
    this.selectedFiles = [];
    this.previewImages = [];
    this.existingImages = [];
    
    if (this.isBrowser) {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    const totalImages = this.existingImages.length + this.selectedFiles.length + files.length;
    if (totalImages > 4) {
      this.toastr.warning('Maximum 4 images allowed in total');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Only image files are allowed');
        return;
      }

      this.selectedFiles.push(file);
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeNewImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewImages.splice(index, 1);
  }

  removeExistingImage(index: number) {
    this.existingImages.splice(index, 1);
  }

  async updateEntry() {
    if (!this.entry) return;

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
      
      // Prepare image paths array
      let imagePaths = ['', '', '', ''];
      
      // Keep existing images
      for (let i = 0; i < this.existingImages.length; i++) {
        // Extract relative path from full URL
        const img = this.existingImages[i];
        if (img) {
          // If it's a full URL, extract the path
          if (img.includes('/FarmImgs/')) {
            const parts = img.split('/FarmImgs/');
            imagePaths[i] = '/FarmImgs/' + parts[1];
          } else {
            imagePaths[i] = img;
          }
        }
      }
      
      // Upload new images
      let currentIndex = this.existingImages.length;
      for (let i = 0; i < this.selectedFiles.length && currentIndex < 4; i++) {
        const formData = new FormData();
        formData.append('file', this.selectedFiles[i]);
        
        const uploadResult: any = await this.api.upload('FileUpload/Upload', formData).toPromise();
        
        if (uploadResult && uploadResult.success) {
          imagePaths[currentIndex] = uploadResult.filePath;
          currentIndex++;
        }
      }
      
      // Update entry
      const payload = {
        farM_ENTRY_ID: this.entry.farM_ENTRY_ID,
        entrY_TYPE: this.entry.entrY_TYPE,
        reason: this.formData.reason.trim(),
        price: this.formData.price,
        farM_ID: this.entry.farM_ID,
        useR_ID: this.entry.useR_ID,
        image1: imagePaths[0],
        image2: imagePaths[1],
        image3: imagePaths[2],
        image4: imagePaths[3],
        date: this.formData.date
      };
      
      const result: any = await this.api.put('FarmEntry/Update', payload).toPromise();
      
      if (result.success) {
        this.toastr.success('Entry updated successfully');
        this.closeUpdateModal();
        // Reload entry data
        if (this.entry) {
          this.fetchEntryById(this.entry.farM_ENTRY_ID, this.entry.farM_ID);
        }
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

  navigateBack() {
    this.router.navigate(['/SF/farmentry']);
  }

  deleteEntry() {
    if (!this.entry) return;

    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    this.loader.show();

    this.api.delete('FarmEntry/Delete', {
      farmEntryId: this.entry.farM_ENTRY_ID,
      farmId: this.entry.farM_ID,
      userId: this.entry.useR_ID
    }).subscribe({
      next: (result: any) => {
        if (result && result.success) {
          this.toastr.success('Entry deleted successfully');
          this.navigateBack();
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
}