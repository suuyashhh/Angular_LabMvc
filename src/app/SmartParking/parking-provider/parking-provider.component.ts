import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';

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
  isModalOpen = false;

  parkingData: any = {
    latitude: '',
    longitude: '',
    rate: null,
    contactNumber: '',
    address: '',
    vehicleType: '2' // '2' for 2-wheeler, '4' for 4-wheeler
  };

  imagePreviews: string[] = [];
  selectedFiles: File[] = [];
  parkingList: any[] = [];
  selectedParking: any = null;

  getSpotImage(path: string | null) {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    // Remove '/api/' from the end of baseUrl
    const root = this.apiService.baseUrl.replace(/\/api\/?$/, '');
    // Ensure path starts with a single slash
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    
    return root + normalizedPath.replace(/\\/g, '/');
  }

  ngOnInit() {
    this.getLocation();
    this.loadParkingLocations();
  }

  loadParkingLocations() {
    const user = this.authService.getCurrentUser();
    if (user && user.userid) {
      this.apiService.get(`ParkingProvider/GetParkingLocations?userId=${user.userid}`).subscribe({
        next: (res: any) => {
          this.parkingList = res;
        },
        error: (err) => console.error('Error loading spots', err)
      });
    }
  }

  viewDetails(spot: any) {
    // Robustly find the ID regardless of naming convention (Unique_Id, unique_Id, uniqueId, etc.)
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
    
    // Set previews for existing images
    this.imagePreviews = [];
    const images = [
      spot.img1 || spot.Img1,
      spot.img2 || spot.Img2,
      spot.img3 || spot.Img3,
      spot.img4 || spot.Img4
    ];

    images.forEach(img => {
      if (img) {
        const fullPath = this.getSpotImage(img);
        if (fullPath) this.imagePreviews.push(fullPath);
      }
    });

    this.isModalOpen = true;
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
    this.parkingData = {
        Unique_Id: 0,
        latitude: '',
        longitude: '',
        rate: null,
        contactNumber: '',
        address: '',
        vehicleType: '2'
    };
    this.imagePreviews = [];
    this.selectedFiles = [];
  }

  getLocation() {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.parkingData.latitude = position.coords.latitude.toString();
          this.parkingData.longitude = position.coords.longitude.toString();
        },
        (error) => {
          console.error('Error getting location', error);
        },
        options
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  onImageUpload(event: any) {
    const files = event.target.files;
    if (files) {
      const remainingSlots = 4 - this.selectedFiles.length;
      const filesToProcess = Math.min(files.length, remainingSlots);
      
      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        this.selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.imagePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  deleteSpot(id: any) {
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this parking location?')) {
      this.apiService.delete(`ParkingProvider/DeleteParkingLocation?uniqueId=${id}`).subscribe({
        next: (res: any) => {
          alert('Parking location deleted successfully!');
          this.closeModal();
          this.loadParkingLocations();
        },
        error: (err) => {
          console.error('Error deleting spot', err);
          alert('Failed to delete spot: ' + this.apiService.extractErrorMessage(err));
        }
      });
    }
  }

  submitForm() {
    const user = this.authService.getCurrentUser();
    if (!user) {
        alert('Please login first');
        return;
    }

    const formData = new FormData();
    if (this.parkingData.Unique_Id) {
        formData.append('Unique_Id', this.parkingData.Unique_Id.toString());
    }
    formData.append('UserId', (user.userid || 0).toString());
    formData.append('VehicalType', this.parkingData.vehicleType);
    formData.append('LatitudeLangitude', `${this.parkingData.latitude},${this.parkingData.longitude}`);
    formData.append('FullAddress', this.parkingData.address);
    formData.append('price', (this.parkingData.rate || 0).toString());
    formData.append('contact', this.parkingData.contactNumber);

    // Append images
    this.selectedFiles.forEach((file) => {
        formData.append('images', file);
    });

    this.apiService.postFormData('ParkingProvider/SaveParkingLocation', formData).subscribe({
        next: (res) => {
            console.log('Success:', res);
            alert(this.parkingData.Unique_Id ? 'Parking location updated successfully!' : 'Parking location saved successfully!');
            this.closeModal();
            this.loadParkingLocations(); // Refresh the list
        },
        error: (err) => {
            console.error('Error:', err);
            alert('Failed to save parking location: ' + this.apiService.extractErrorMessage(err));
        }
    });
  }
}

