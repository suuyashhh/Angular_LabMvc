import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-vegetables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vegetables.component.html',
  styleUrl: './vegetables.component.css'
})
export class VegetablesComponent implements OnInit {
  vegetables: any[] = [];
  searchQuery = '';

  isDrawerOpen = false;
  editMode = false;
  isSaving = false;

  formData: any = {
    id: 0,
    vegetableName: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadVegetables();
  }

  loadVegetables() {
    this.apiService.getVegetables().subscribe({
      next: (data) => this.vegetables = data,
      error: (err) => console.error(err)
    });
  }

  get filteredVegetables() {
    return this.vegetables.filter(v => 
      !this.searchQuery || v.vegetableName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  openAddDrawer() {
    this.editMode = false;
    this.formData = {
      id: 0,
      vegetableName: ''
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(veg: any) {
    this.editMode = true;
    this.formData = { ...veg };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  saveVegetable() {
    if (!this.formData.vegetableName) return;

    this.isSaving = true;
    if (this.editMode) {
      this.apiService.updateVegetable(this.formData.id, this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadVegetables();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to update vegetable');
        }
      });
    } else {
      this.apiService.createVegetable(this.formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.isDrawerOpen = false;
          this.loadVegetables();
        },
        error: (err) => {
          this.isSaving = false;
          alert(err.error?.message || 'Failed to add vegetable');
        }
      });
    }
  }

  confirmDelete(id: number) {
    if (confirm('Are you sure you want to delete this vegetable?')) {
      this.apiService.deleteVegetable(id).subscribe({
        next: () => this.loadVegetables(),
        error: (err) => alert(err.error?.message || 'Failed to delete vegetable')
      });
    }
  }
}
