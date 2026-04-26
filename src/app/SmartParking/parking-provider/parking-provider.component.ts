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
    // Remove '/api/' from the end of baseUrl and fix path slashes
    const root = this.apiService.baseUrl.replace(/\/api\/$/, '/');
    return root + path.replace(/\\/g, '/');
  }

  ngOnInit() {
    this.getLocation();
    this.loadParkingLocations();
  }

  loadParkingLocations() {
    const user = this.authService.getCurrentUser();
    if (user && user.userid) {
      this.apiService.get(`ParkingProvoder/GetParkingLocations?userId=${user.userid}`).subscribe({
        next: (res: any) => {
          this.parkingList = res;
        },
        error: (err) => console.error('Error loading spots', err)
      });
    }
  }

  viewDetails(spot: any) {
    // Repurpose: Path data into parkingData and open edit modal
    this.parkingData = {
      ...this.parkingData,
      SpotId: spot.spotId || spot.id, // Assuming there's an ID
      address: spot.fullAddress,
      rate: spot.price,
      contactNumber: spot.contact,
      vehicleType: spot.vehicalType,
      latitude: spot.latitudeLangitude?.split(',')[0] || '',
      longitude: spot.latitudeLangitude?.split(',')[1] || ''
    };
    
    // Set previews for existing images
    this.imagePreviews = [];
    if (spot.img1) this.imagePreviews.push(this.getSpotImage(spot.img1)!);
    if (spot.img2) this.imagePreviews.push(this.getSpotImage(spot.img2)!);
    if (spot.img3) this.imagePreviews.push(this.getSpotImage(spot.img3)!);
    if (spot.img4) this.imagePreviews.push(this.getSpotImage(spot.img4)!);

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

  submitForm() {
    const user = this.authService.getCurrentUser();
    if (!user) {
        alert('Please login first');
        return;
    }

    const formData = new FormData();
    if (this.parkingData.SpotId) {
        formData.append('SpotId', this.parkingData.SpotId.toString());
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

    this.apiService.postFormData('ParkingProvoder/SaveParkingLocation', formData).subscribe({
        next: (res) => {
            console.log('Success:', res);
            alert('Parking location saved successfully!');
            this.closeModal();
            this.loadParkingLocations(); // Refresh the list

            // Reset form
            this.parkingData = {
                latitude: '',
                longitude: '',
                rate: null,
                contactNumber: '',
                address: '',
                vehicleType: '2'
            };
            this.imagePreviews = [];
            this.selectedFiles = [];
        },
        error: (err) => {
            console.error('Error:', err);
            alert('Failed to save parking location: ' + this.apiService.extractErrorMessage(err));
        }
    });
  }
}

