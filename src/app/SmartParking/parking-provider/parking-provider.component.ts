import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-parking-provider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parking-provider.component.html',
  styleUrl: './parking-provider.component.css'
})
export class ParkingProviderComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  toastr = inject(ToastrService);
  loader = inject(LoaderService);
  isModalOpen = false;

  parkingData: any = {
    Unique_Id: 0,
    latitude: '',
    longitude: '',
    rate: null,
    contactNumber: '',
    address: '',
    vehicleType: '2'
  };

  imagePreviews: string[] = [];
  selectedFiles: File[] = [];
  existingImages: string[] = []; // ← NEW: tracks server-side image paths
  parkingList: any[] = [];

  getSpotImage(path: string | null) {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const root = this.apiService.baseUrl.replace(/\/api\/?$/, '');
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    return root + normalizedPath.replace(/\\/g, '/');
  }

  ngOnInit() {
    this.authService.validateParkingSession(true).subscribe({
      next: () => {
        this.getLocation();
        this.loadParkingLocations();
      },
      error: () => {}
    });
  }

  loadParkingLocations() {
    const user = this.authService.getCurrentUser();
    const userId = user?.userId ?? user?.userid ?? user?.USERID;
    if (userId) {
      this.loader.withLoader(
        this.apiService.get('ParkingProvider/GetParkingLocations')
      ).subscribe({
        next: (res: any) => { this.parkingList = res; },
        error: (err) => {
          if (this.handleParkingAuthError(err)) {
            return;
          }
          console.error('Error loading spots', err);
          this.toastr.error('Failed to load parking locations');
        }
      });
    }
  }

 viewDetails(spot: any) {
    const id = spot.unique_Id || spot.Unique_Id || spot.uniqueId || spot.UniqueId || spot.id || spot.ID || 0;

    this.parkingData = {
      Unique_Id: id,
      address: spot.fullAddress || spot.FullAddress || '',
      rate: spot.price || spot.Price || null,
      contactNumber: spot.contact || spot.Contact || '',
      vehicleType: (spot.vehicalType || spot.VehicalType || '2').toString(),
      latitude: (spot.latitudeLangitude || spot.LatitudeLangitude)?.split(',')[0] || '',
      longitude: (spot.latitudeLangitude || spot.LatitudeLangitude)?.split(',')[1] || ''
    };

    const rawImages = [
      spot.img1 || spot.Img1,
      spot.img2 || spot.Img2,
      spot.img3 || spot.Img3,
      spot.img4 || spot.Img4
    ].filter(Boolean);

    // API returns full URLs already — use them directly for preview
    // But store RELATIVE paths for FormData submission
    this.imagePreviews = rawImages; // already full URLs from API
    this.existingImages = rawImages.map(url => this.extractRelativePath(url)); // convert back to /ParkingImages/xxx.jpg
    this.selectedFiles = [];

    this.isModalOpen = true;
  }

  // NEW helper: extract relative path from full URL
  extractRelativePath(url: string): string {
    if (!url) return '';
    // If already relative, return as-is
    if (!url.startsWith('http')) return url;
    try {
      const parsed = new URL(url);
      return parsed.pathname; // returns /ParkingImages/filename.jpg
    } catch {
      return url;
    }
  }

  openModal() {
    this.resetForm();
    this.isModalOpen = true;
    if (!this.parkingData.latitude || !this.parkingData.longitude) {
      this.getLocation();
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm() {
    const user = this.authService.getCurrentUser();
    this.parkingData = {
      Unique_Id: 0,
      latitude: '',
      longitude: '',
      rate: null,
      contactNumber: user?.phone || '',
      address: '',
      vehicleType: '2'
    };
    this.imagePreviews = [];
    this.selectedFiles = [];
    this.existingImages = []; // ← NEW
  }

  getLocation() {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.parkingData.latitude = position.coords.latitude.toString();
          this.parkingData.longitude = position.coords.longitude.toString();
          this.getAddress(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location', error);
          this.toastr.error('Failed to get location. Please ensure location permissions are granted.');
        },
        options
      );
    } else {
      this.toastr.error('Geolocation is not supported by this browser.');
    }
  }

  getAddress(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    this.loader.withLoader(this.apiService.get(url)).subscribe({
      next: (res: any) => {
        if (res && res.display_name) {
          this.parkingData.address = res.display_name;
        }
      },
      error: (err) => {
        console.error('Error fetching address', err);
      }
    });
  }

  onImageUpload(event: any) {
    const files = event.target.files;
    if (files) {
      const totalUsed = this.existingImages.length + this.selectedFiles.length;
      const remainingSlots = 4 - totalUsed;
      const filesToProcess = Math.min(files.length, remainingSlots);

      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        this.selectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => { this.imagePreviews.push(e.target.result); };
        reader.readAsDataURL(file);
      }
    }
  }

  // ← FIXED: correctly removes from existingImages OR selectedFiles
  removeImage(index: number) {
    const existingCount = this.existingImages.length;

    if (index < existingCount) {
      // Removing an existing server image
      this.existingImages.splice(index, 1);
    } else {
      // Removing a newly selected file
      const newFileIndex = index - existingCount;
      this.selectedFiles.splice(newFileIndex, 1);
    }

    this.imagePreviews.splice(index, 1);
  }

  deleteSpot(id: any) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this parking location?')) {
      this.loader.withLoader(
        this.apiService.delete(`ParkingProvider/DeleteParkingLocation?uniqueId=${id}`)
      ).subscribe({
        next: () => {
          this.toastr.success('Parking location deleted successfully!');
          this.closeModal();
          this.loadParkingLocations();
        },
        error: (err) => {
          if (this.handleParkingAuthError(err)) {
            return;
          }
          console.error('Error deleting spot', err);
          this.toastr.error('Failed to delete spot: ' + this.apiService.extractErrorMessage(err));
        }
      });
    }
  }

 submitForm() {
    const user = this.authService.getCurrentUser();
    if (!user) { this.toastr.warning('Please login first'); return; }
    const userId = user?.userId ?? user?.userid ?? user?.USERID;
    if (!userId) { this.toastr.warning('Please login first'); return; }

    const formData = new FormData();

    if (this.parkingData.Unique_Id && this.parkingData.Unique_Id > 0) {
      formData.append('Unique_Id', this.parkingData.Unique_Id.toString());
    }

    formData.append('UserId', userId.toString());
    formData.append('VehicalType', this.parkingData.vehicleType);
    formData.append('LatitudeLangitude', `${this.parkingData.latitude},${this.parkingData.longitude}`);
    formData.append('FullAddress', this.parkingData.address);
    formData.append('price', (this.parkingData.rate || 0).toString());
    formData.append('contact', this.parkingData.contactNumber);

    // ✅ Send existing images as img1..img4 so backend ISNULL() keeps them
    // existingImages are relative paths like /ParkingImages/abc.jpg
    const imgFields = ['img1', 'img2', 'img3', 'img4'];
    this.existingImages.forEach((path, i) => {
      if (path && i < 4) {
        formData.append(imgFields[i], path);
      }
    });

    // New uploaded files go into 'images' — backend saves these and fills remaining img slots
    this.selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    this.loader.withLoader(
      this.apiService.postFormData('ParkingProvider/SaveParkingLocation', formData)
    ).subscribe({
      next: () => {
        this.toastr.success(this.parkingData.Unique_Id > 0 ? 'Updated successfully!' : 'Saved successfully!');
        this.closeModal();
        this.loadParkingLocations();
      },
      error: (err) => {
        if (this.handleParkingAuthError(err)) {
          return;
        }
        console.error('Error:', err);
        this.toastr.error('Failed: ' + this.apiService.extractErrorMessage(err));
      }
    });
  }

  private handleParkingAuthError(err: any): boolean {
    if (err?.status === 401 || err?.status === 403) {
      this.authService.handleParkingSessionExpired(
        'the user loged in other device',
        true
      );
      return true;
    }

    return false;
  }
}
