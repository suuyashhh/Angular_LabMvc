import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SidebarService } from '../../shared/sidebar.service';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

declare const L: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  sidebarService = inject(SidebarService);
  apiService = inject(ApiService);
  toastr = inject(ToastrService);
  loader = inject(LoaderService);
  route = inject(ActivatedRoute);

  searchQuery: string = '';
  isDirectionsMode: boolean = false;
  routeInfo: { distance: string, duration: string } | null = null;
  
  private map: any;
  private userMarker: any = null;
  private destinationMarker: any = null;
  private routeLayer: any = null;
  private defaultParkingIcon: any;
  private userLocation: { lat: number, lng: number } | null = null;
  private parkingMarkers: any[] = [];
  parkingLocations: any[] = [];

  private bikeIcon: any;
  private carIcon: any;
  private defaultIcon: any;

  showLocationModal: boolean = false;
  pendingCoords: { lat: number, lng: number } | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['destLat'] && params['destLng']) {
        this.pendingCoords = {
          lat: parseFloat(params['destLat']),
          lng: parseFloat(params['destLng'])
        };
        this.isDirectionsMode = true;
      }
    });
    this.loadParkingLocations();
    this.checkLocationPermissionStatus();
  }

  checkLocationPermissionStatus() {
    const status = sessionStorage.getItem('locationRequested');
    if (!status) {
      this.showLocationModal = true;
    }
  }

  ngAfterViewInit() {
    this.initMap();
    if (this.pendingCoords) {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          this.handleDirectionParams();
        }
      }, 500);
    }

    // Listen for directions button clicks from markers
    window.addEventListener('getDirections', (e: any) => {
      const { lat, lng, address } = e.detail;
      this.handleDirectionsFromPopup(lat, lng, address);
    });
  }

  handleDirectionsFromPopup(lat: number, lng: number, address: string) {
    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
    }

    this.destinationMarker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(address || 'Destination')
      .openPopup();

    this.getDirections(true);
  }

  handleDirectionParams() {
    if (!this.pendingCoords || !this.map) return;

    if (this.destinationMarker) {
      this.map.removeLayer(this.destinationMarker);
    }

    this.destinationMarker = L.marker([this.pendingCoords.lat, this.pendingCoords.lng])
      .addTo(this.map)
      .bindPopup('Target Parking Spot')
      .openPopup();

    this.map.flyTo([this.pendingCoords.lat, this.pendingCoords.lng], 15);
    
    // Check if user location is already available
    if (this.userLocation) {
      this.getDirections(true);
    }
  }

  initMap() {
    // Default center on India
    this.map = L.map('map').setView([20.5937, 78.9629], 5);
    
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.carIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3710/3710267.png',
      iconSize: [45, 45],
      iconAnchor: [22, 45],
      popupAnchor: [0, -45]
    });

    this.bikeIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3710/3710271.png',
      iconSize: [45, 45],
      iconAnchor: [22, 45],
      popupAnchor: [0, -45]
    });

    this.defaultIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776000.png', // Red pin with 'P'
      iconSize: [45, 45],
      iconAnchor: [22, 45],
      popupAnchor: [0, -45]
    });

    this.displayParkingMarkers();
    
    // Only auto-locate if permission was already handled in this session
    if (sessionStorage.getItem('locationRequested') === 'granted') {
      this.getCurrentLocation();
    }
  }

  loadParkingLocations() {
    this.apiService.get('ParkingProvider/GetAllParkingLocations').subscribe({
      next: (data: any) => {
        this.parkingLocations = data;
        if (this.map) {
          this.displayParkingMarkers();
        }
      },
      error: (err: any) => {
        console.error("Error loading parking locations", err);
        this.toastr.error("Failed to load parking locations");
      }
    });
  }

  displayParkingMarkers() {
    if (!this.map || !this.parkingLocations || !this.parkingLocations.length) return;

    // Clear existing parking markers
    this.parkingMarkers.forEach(m => this.map.removeLayer(m));
    this.parkingMarkers = [];

    const group = L.featureGroup();

    this.parkingLocations.forEach(loc => {
      // Handle both camelCase and PascalCase from API response
      const latLngStr = loc.latitudeLangitude || loc.LatitudeLangitude;
      const fullAddress = loc.fullAddress || loc.FullAddress || 'Parking Spot';
      const price = loc.price || loc.Price || 'N/A';
      const vehicalType = String(loc.vehicalType || loc.VehicalType || '');
      const contact = loc.contact || loc.Contact || 'N/A';

      if (latLngStr) {
        const coords = latLngStr.split(',');
        if (coords.length === 2) {
          const lat = parseFloat(coords[0].trim());
          const lng = parseFloat(coords[1].trim());

          if (!isNaN(lat) && !isNaN(lng)) {
            // Determine icon based on vehicle type
            let customIcon = this.defaultIcon;
            if (vehicalType === '2') customIcon = this.bikeIcon;
            else if (vehicalType === '4') customIcon = this.carIcon;

            const marker = L.marker([lat, lng], { icon: customIcon })
              .addTo(this.map)
              .bindPopup(`
                <div class="custom-popup">
                  <h6 style="margin: 0 0 5px; color: #1a73e8;">${fullAddress}</h6>
                  <p style="margin: 0 5px; font-size: 13px;">
                    <b>Price:</b> ₹${price}/hr<br>
                    <b>Vehicle:</b> ${vehicalType === '2' ? '2-Wheeler' : vehicalType === '4' ? '4-Wheeler' : vehicalType}<br>
                    <b>Contact:</b> ${contact}
                  </p>
                  <button class="btn btn-sm btn-primary w-100 mt-2" 
                    onclick="window.dispatchEvent(new CustomEvent('getDirections', {detail: {lat: ${lat}, lng: ${lng}, address: '${fullAddress.replace(/'/g, "\\'")}'}}))">
                    Get Directions
                  </button>
                </div>
              `);
            this.parkingMarkers.push(marker);
            group.addLayer(marker);
          }
        }
      }
    });

    // Zoom to fit all markers if there are any
    if (this.parkingMarkers.length > 0) {
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  onSearch() {
    if (this.isDirectionsMode) {
      this.stopDirections();
    }
    
    if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
        this.routeLayer = null;
    }

    if (!this.searchQuery.trim()) return;

    this.loader.withLoader(
      this.apiService.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(this.searchQuery)}&format=json`)
    ).subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          this.map.flyTo([lat, lon], 15);
          
          if (this.destinationMarker) {
            this.map.removeLayer(this.destinationMarker);
          }
          this.destinationMarker = L.marker([lat, lon]).addTo(this.map).bindPopup(data[0].display_name).openPopup();
        } else {
          this.toastr.warning("Location not found.");
        }
      },
      error: (e: any) => {
        console.error("Search error", e);
        this.toastr.error("Failed to search location.");
      }
    });
  }

  getDirections(fitBounds: boolean = true) {
      if (!this.destinationMarker) {
         this.toastr.warning("Please search for a destination first!");
         return;
      }
      if (!this.userLocation) {
         this.toastr.warning("Your live location is not available. Please allow location access or click the 'My Location' button.");
         return;
      }

      this.isDirectionsMode = true;

      const destLat = this.destinationMarker.getLatLng().lat;
      const destLon = this.destinationMarker.getLatLng().lng;
      
      const startLat = this.userLocation.lat;
      const startLon = this.userLocation.lng;

      this.apiService.get(`https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${destLon},${destLat}?overview=full&geometries=geojson`).subscribe({
        next: (data: any) => {
            if (this.routeLayer) {
              this.map.removeLayer(this.routeLayer);
            }
            if (data.routes && data.routes.length > 0) {
               const route = data.routes[0];
               this.routeLayer = L.geoJSON(route.geometry, {
                  style: { color: '#1a73e8', weight: 5, opacity: 0.8 }
               }).addTo(this.map);

               if (fitBounds) {
                   this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });
               }

               const distKm = (route.distance / 1000).toFixed(1);
               const durMin = Math.ceil(route.duration / 60);
               this.routeInfo = {
                   distance: `${distKm} km`,
                   duration: `${durMin} min`
               };
            }
        },
        error: (err: any) => {
          console.error("OSRM Route Error", err);
          this.toastr.error("Failed to calculate route.");
        }
      });
  }

  stopDirections() {
      this.isDirectionsMode = false;
      this.routeInfo = null;
      this.pendingCoords = null; // Clear pending state
      if (this.routeLayer) {
          this.map.removeLayer(this.routeLayer);
          this.routeLayer = null;
      }
      if (this.userLocation) {
          this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
      }
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.toastr.error("Geolocation is not supported by this browser.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const userIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/7133/7133312.png',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.userLocation = { lat, lng };

        if (!this.userMarker) {
          this.userMarker = L.marker([lat, lng], { icon: userIcon })
            .addTo(this.map)
            .bindPopup('<b>You are here</b>');
        } else {
          this.userMarker.setLatLng([lat, lng]);
        }

        this.map.flyTo([lat, lng], 16);

        // Auto-start directions if coming from Seeker component and route not yet calculated
        if (this.pendingCoords && !this.routeInfo) {
          this.getDirections(true);
        }

        // Live update route actively if moving towards destination
        if (this.isDirectionsMode && this.destinationMarker) {
          this.getDirections(false);
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            this.toastr.error("Permission denied. Please enable location in your device settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            this.toastr.error("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            this.toastr.error("Location request timed out.");
            break;
          default:
            this.toastr.error("An unknown error occurred while getting location.");
            break;
        }
      },
      options
    );
  }

  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }

  allowLocation() {
    this.showLocationModal = false;
    sessionStorage.setItem('locationRequested', 'granted');
    this.getCurrentLocation();
  }

  dismissLocation() {
    this.showLocationModal = false;
    sessionStorage.setItem('locationRequested', 'denied');
  }
}

