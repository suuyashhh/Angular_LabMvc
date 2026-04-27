import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  searchQuery: string = '';
  isDirectionsMode: boolean = false;
  routeInfo: { distance: string, duration: string } | null = null;
  
  private map: any;
  private userMarker: any = null;
  private destinationMarker: any = null;
  private routeLayer: any = null;
  private defaultParkingIcon: any;
  private userLocation: { lat: number, lng: number } | null = null;

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initMap();
  }

  initMap() {
    this.map = L.map('map').setView([18.5204, 73.8567], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.defaultParkingIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3005/3005355.png', 
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38]
    });

    L.marker([18.5204, 73.8567], { icon: this.defaultParkingIcon })
      .addTo(this.map)
      .bindPopup('<b>Parking Slot A1</b><br>Available: Yes');

    this.getCurrentLocation();
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
      if (this.routeLayer) {
          this.map.removeLayer(this.routeLayer);
          this.routeLayer = null;
      }
      if (this.userLocation) {
          this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
      }
  }

  getCurrentLocation() {
    this.map.locate({ setView: true, maxZoom: 16, watch: true });

    const userIcon = L.icon({
       iconUrl: 'https://cdn-icons-png.flaticon.com/512/7133/7133312.png',
       iconSize: [40, 40],
       iconAnchor: [20, 20]
    });

    this.map.on('locationfound', (e: any) => {
        this.userLocation = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (!this.userMarker) {
            this.userMarker = L.marker(e.latlng, { icon: userIcon })
               .addTo(this.map)
               .bindPopup('<b>You are here</b>');
        } else {
            this.userMarker.setLatLng(e.latlng);
        }
        
        // Live update route actively if moving towards destination
        if (this.isDirectionsMode && this.destinationMarker) {
            this.getDirections(false);
        }
    });

    this.map.on('locationerror', (e: any) => {
      console.warn("Could not find location", e.message);
    });
  }

  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }
}

