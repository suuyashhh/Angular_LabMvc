import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotels.component.html',
  styleUrl: './hotels.component.css'
})
export class HotelsComponent implements OnInit {
  hotels: any[] = [];
  searchQuery = '';

  // Drawer states
  isDrawerOpen = false;
  editMode = false;
  isSaving = false;
  
  formData: any = {
    id: 0,
    hotelName: '',
    address: '',
    contactNumber: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadHotels();
  }

  loadHotels() {
    this.apiService.getHotels().subscribe({
      next: (data) => this.hotels = data,
      error: (err) => console.error(err)
    });
  }

  get filteredHotels() {
    return this.hotels.filter(h => 
      !this.searchQuery || h.hotelName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openAddDrawer() {
    this.editMode = false;
    this.formData = {
      id: 0,
      hotelName: '',
      address: '',
      contactNumber: ''
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(hotel: any) {
    this.editMode = true;
    this.formData = { ...hotel };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  saveHotel() {
    if (!this.formData.hotelName) return;

    this.isSaving = true;
    if (this.editMode) {
      this.apiService.updateHotel(this.formData.id, this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadHotels();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to update hotel');
        }
      });
    } else {
      this.apiService.createHotel(this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadHotels();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to add hotel');
        }
      });
    }
  }

  confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this hotel? All associated purchases will be deleted.')) {
      this.apiService.deleteHotel(id).subscribe({
        next: () => this.loadHotels(),
        error: (err) => alert(err.error?.message || 'Failed to delete hotel')
      });
    }
  }
}
