import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  items: any[] = [];
  showModal = false;
  editMode = false;
  menuIndex: number | null = null;

  formName = '';
  selectedFile: File | null = null;
  previewImage: string | null = null;
  editId: number | null = null;

  userId: string = '';
  
  // Button loading states
  isSaving: boolean = false;
  isUpdating: boolean = false;
  isDeleting: boolean = false;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const userDetails = this.auth.getFarmUserDetailsFromCookie();
    // Try different property names to get userId
    this.userId = userDetails.userId || userDetails.userID || userDetails.useR_ID || userDetails.UserId || '';
    
    if (!this.userId) {
      console.error('User details from cookie:', userDetails);
      this.toastr.error('User not authenticated - No userId found');
      return;
    }
    
    console.log('User ID:', this.userId); // Debug log
    this.getAll();
  }

  getAll() {
    // Send userId (lowercase) as required by backend
    // Remove empty comId parameter
    this.api.get('HomeFarm/GetAll', { userId: this.userId })
      .subscribe({
        next: (res: any) => {
          console.log('API Response:', res); // Debug log
          this.items = Array.isArray(res) ? res : [];
        },
        error: (err) => {
          console.error('Error fetching farms:', err);
          this.toastr.error('Failed to load farms: ' + (err.error?.message || err.message));
        }
      });
  }

  openModal() {
    this.showModal = true;
    this.editMode = false;
    this.formName = '';
    this.selectedFile = null;
    this.previewImage = null;
    this.editId = null;
    this.menuIndex = null;
  }

  closeModal() {
    this.showModal = false;
    this.editMode = false;
    this.formName = '';
    this.selectedFile = null;
    this.previewImage = null;
    this.editId = null;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.toastr.error('File size should be less than 5MB');
        event.target.value = '';
        return;
      }
      
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        this.toastr.error('Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)');
        event.target.value = '';
        return;
      }
      
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveItem() {
    if (!this.formName.trim()) {
      this.toastr.error('Please enter farm name');
      return;
    }

    // Convert image to base64 if file is selected
    const processImage = (callback: (imageBase64: string | null) => void) => {
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = () => {
          callback(reader.result as string);
        };
        reader.onerror = () => {
          callback(null);
          this.toastr.error('Failed to read image file');
        };
        reader.readAsDataURL(this.selectedFile);
      } else {
        callback(this.previewImage);
      }
    };

    processImage((imageBase64) => {
      if (this.editMode) {
        this.updateFarm(imageBase64);
      } else {
        this.insertFarm(imageBase64);
      }
    });
  }

  insertFarm(imageBase64: string | null) {
    this.isSaving = true;

    const payload = {
      farmName: this.formName.trim(), // Try lowercase first
      FARM_NAME: this.formName.trim(), // Keep uppercase as fallback
      userId: this.userId, // lowercase
      USER_ID: this.userId, // uppercase as fallback
      image: imageBase64 || '', // lowercase
      IMAGE: imageBase64 || '' // uppercase as fallback
    };

    console.log('Insert Payload:', payload); // Debug log

    this.api.post('HomeFarm/Insert', payload)
      .pipe(finalize(() => {
        this.isSaving = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.toastr.success('Farm added successfully');
          this.getAll();
          this.closeModal();
        },
        error: (err) => {
          console.error('Insert error:', err);
          this.toastr.error(err.error?.message || err.error?.title || 'Failed to add farm');
        }
      });
  }

  updateFarm(imageBase64: string | null) {
    if (!this.editId) {
      this.toastr.error('Invalid farm data');
      return;
    }

    this.isUpdating = true;

    const payload = {
      farmId: this.editId, // lowercase
      FARM_ID: this.editId, // uppercase
      farmName: this.formName.trim(),
      FARM_NAME: this.formName.trim(),
      userId: this.userId,
      USER_ID: this.userId,
      image: imageBase64 || '',
      IMAGE: imageBase64 || ''
    };

    console.log('Update Payload:', payload); // Debug log

    this.api.put('HomeFarm/Update', payload)
      .pipe(finalize(() => {
        this.isUpdating = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Farm updated successfully');
          this.getAll();
          this.closeModal();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.toastr.error(err.error?.message || err.error?.title || 'Failed to update farm');
        }
      });
  }

  editItem(item: any) {
    this.editMode = true;
    this.showModal = true;
    this.formName = item.FARM_NAME || item.farmName || '';
    this.previewImage = item.IMAGE || item.image || null;
    this.editId = item.FARM_ID || item.farmId || null;
    this.selectedFile = null;
    this.menuIndex = null;
    
    console.log('Editing item:', item); // Debug log
  }

  deleteItem(item: any) {
    const farmId = item.FARM_ID || item.farmId;
    
    if (!farmId) {
      this.toastr.error('Invalid farm data');
      return;
    }

    if (confirm('Are you sure you want to delete this farm? This action cannot be undone.')) {
      this.isDeleting = true;

      // Send both lowercase and uppercase parameters
      const params = {
        farmId: farmId,
        FARM_ID: farmId,
        userId: this.userId,
        USER_ID: this.userId
      };

      console.log('Delete params:', params); // Debug log

      this.api.delete('HomeFarm/Delete', params)
      .pipe(finalize(() => {
        this.isDeleting = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Farm deleted successfully');
          this.getAll();
          this.menuIndex = null;
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.toastr.error(err.error?.message || err.error?.title || 'Failed to delete farm');
        }
      });
    }
  }

  toggleMenu(index: number) {
    this.menuIndex = this.menuIndex === index ? null : index;
  }
}