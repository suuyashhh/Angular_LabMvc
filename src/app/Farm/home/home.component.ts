import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/auth.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
  isLoading = true;
  formName = '';
  selectedFile: File | null = null;
  previewImage: string | null = null;
  editId: number | null = null;
  userId: string = '';
  isSaving = false;
  
  // Image preview modal
  showImagePreview = false;
  previewImageUrl: string | null = null;
  previewImageName: string = '';
  
  private subscriptions = new Subscription();

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.initializeUser();
    this.getAll();
    document.addEventListener('click', this.closeDropdown.bind(this));
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    document.removeEventListener('click', this.closeDropdown.bind(this));
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  initializeUser() {
    const userDetails = this.auth.getFarmUserDetailsFromCookie();
    this.userId = userDetails?.useR_ID?.toString() || '';
    
    if (!this.userId) {
      this.toastr.error('User not authenticated');
      this.isLoading = false;
    }
  }

  getAll() {
    this.isLoading = true;
    
    const sub = this.api.get('HomeFarm/GetAll', { userId: this.userId })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          this.items = Array.isArray(res) ? res : [];
        },
        error: (err) => {
          this.toastr.error('Failed to load farms');
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
    if (this.isSaving) return;
    this.showModal = false;
    this.editMode = false;
    this.resetForm();
  }

  resetForm() {
    this.formName = '';
    this.selectedFile = null;
    this.previewImage = null;
    this.editId = null;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      this.toastr.error('File size should be less than 5MB');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Only image files are allowed');
      return;
    }
    
    this.selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewImage = e.target.result;
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.selectedFile = null;
    this.previewImage = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  saveItem() {
    if (!this.formName.trim()) {
      this.toastr.error('Please enter a farm name');
      return;
    }

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageBase64 = reader.result as string;
        this.editMode ? this.updateFarm(imageBase64) : this.insertFarm(imageBase64);
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.editMode ? this.updateFarm(this.previewImage) : this.insertFarm(this.previewImage);
    }
  }

  insertFarm(imageBase64: string | null) {
    this.isSaving = true;
    
    const payload = {
      farM_NAME: this.formName.trim(),
      useR_ID: this.userId,
      image: imageBase64 || ''
    };
    
    const sub = this.api.post('HomeFarm/Insert', payload)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.toastr.success('Farm added successfully');
          this.getAll();
          this.closeModal();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to add farm');
        }
      });
    
    this.subscriptions.add(sub);
  }

  updateFarm(imageBase64: string | null) {
    if (!this.editId) return;
    
    this.isSaving = true;
    
    const payload = {
      farM_ID: this.editId,
      farM_NAME: this.formName.trim(),
      useR_ID: this.userId,
      image: imageBase64 || ''
    };
    
    const sub = this.api.put('HomeFarm/Update', payload)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.toastr.success('Farm updated successfully');
          this.getAll();
          this.closeModal();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to update farm');
        }
      });
    
    this.subscriptions.add(sub);
  }

  editItem(item: Farm) {
    this.editMode = true;
    this.showModal = true;
    this.formName = item.farM_NAME;
    this.previewImage = item.image;
    this.editId = item.farM_ID;
    this.selectedFile = null;
    this.menuIndex = null;
  }

  deleteItem(item: Farm) {
    if (!confirm(`Are you sure you want to delete "${item.farM_NAME}"?`)) {
      return;
    }
    
    const sub = this.api.delete('HomeFarm/Delete', { 
      farmId: item.farM_ID,
      userId: this.userId 
    })
    .subscribe({
      next: () => {
        this.toastr.success('Farm deleted successfully');
        this.getAll();
        this.menuIndex = null;
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to delete farm');
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
    if (event.key === 'Escape' && this.showImagePreview) {
      this.closeImagePreview();
    }
  }

  // Image preview methods
  openImagePreview(item: Farm) {
    this.previewImageUrl = item.image;
    this.previewImageName = item.farM_NAME;
    this.showImagePreview = true;
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImageUrl = null;
    this.previewImageName = '';
  }

  downloadImage() {
    if (!this.previewImageUrl) return;
    
    const link = document.createElement('a');
    link.href = this.previewImageUrl;
    link.download = `${this.previewImageName || 'farm-image'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toastr.success('Image downloaded successfully');
  }
}