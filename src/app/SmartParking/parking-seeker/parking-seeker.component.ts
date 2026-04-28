import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-parking-seeker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parking-seeker.component.html',
  styleUrl: './parking-seeker.component.css'
})
export class ParkingSeekerComponent implements OnInit {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  toastr = inject(ToastrService);
  loader = inject(LoaderService);

  userLat: number | null = null;
  userLng: number | null = null;
  parkingList: any[] = [];
  originalParkingList: any[] = [];
  isLoading = false;
  activeFilter = 'all';

  // Modal & Slider State
  selectedSpot: any = null;
  isDetailModalOpen = false;
  currentImageIndex = 0;
  spotImages: string[] = [];

  ngOnInit() {
    this.getCurrentLocation();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      this.isLoading = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLat = position.coords.latitude;
          this.userLng = position.coords.longitude;
          this.loadAllParkingLocations();
        },
        (error) => {
          console.error('Error getting location', error);
          this.loadAllParkingLocations();
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation not supported');
      this.loadAllParkingLocations();
    }
  }

  loadAllParkingLocations() {
    this.isLoading = true;
    this.loader.withLoader(
      this.apiService.get('ParkingProvider/GetAllParkingLocations')
    ).subscribe({
      next: (res: any) => {
        this.originalParkingList = res.map((spot: any) => {
          const coords = spot.latitudeLangitude?.split(',') || [];
          const spotLat = parseFloat(coords[0]);
          const spotLng = parseFloat(coords[1]);
          
          let distance = null;
          if (this.userLat !== null && this.userLng !== null && !isNaN(spotLat) && !isNaN(spotLng)) {
            distance = this.calculateDistance(this.userLat, this.userLng, spotLat, spotLng);
          }

          return {
            ...spot,
            distance: distance
          };
        });

        // Default sort by distance
        this.originalParkingList.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading parking locations', err);
        this.toastr.error('Failed to load parking locations');
      }
    });
  }

  applyFilter(type: string) {
    this.activeFilter = type;
    let filtered = [...this.originalParkingList];

    if (type === '2-wheeler') {
      filtered = filtered.filter(s => s.vehicalType === '2' || s.VehicalType === '2');
    } else if (type === '4-wheeler') {
      filtered = filtered.filter(s => s.vehicalType === '4' || s.VehicalType === '4');
    } else if (type === 'distance') {
      filtered = filtered.filter(s => s.distance !== null && s.distance < 1);
    } else if (type === 'budget') {
      filtered = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    this.parkingList = filtered;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getSpotImage(path: string | null) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const root = this.apiService.baseUrl.replace(/\/api\/?$/, '');
    return root + cleanPath.replace(/\\/g, '/');
  }

  formatDistance(dist: number | null): string {
    if (dist === null) return 'Distance unknown';
    if (dist < 1) return `${(dist * 1000).toFixed(0)} m away`;
    return `${dist} km away`;
  }

  openDetailModal(spot: any) {
    this.selectedSpot = spot;
    this.spotImages = [];
    
    const rawImages = [
      spot.img1 || spot.Img1,
      spot.img2 || spot.Img2,
      spot.img3 || spot.Img3,
      spot.img4 || spot.Img4
    ];

    this.spotImages = rawImages
      .filter(img => img && img.trim() !== '')
      .map(img => this.getSpotImage(img)!);
    
    this.currentImageIndex = 0;
    this.isDetailModalOpen = true;
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedSpot = null;
  }

  nextImage() {
    if (this.currentImageIndex < this.spotImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.spotImages.length - 1;
    }
  }
}

