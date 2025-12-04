import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { ApiService } from '../../shared/api.service';
import { ServicesService } from '../../shared/services.service';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [HttpClientModule, ReactiveFormsModule, CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './masters.component.html',
  styleUrls: ['./masters.component.css']
})
export class MastersComponent implements OnInit {
  // Forms
  animalForm!: FormGroup;
  feedForm!: FormGroup;

  // Data lists
  animals: any[] = [];
  feeds: any[] = [];

  // editing ids
  ANIMAL_ID: number = 0;
  FEED_ID: number = 0;

  // Action types for modals
  btnAnimal: string = ''; // '', 'E', 'D'
  btnFeed: string = '';   // '', 'E', 'D'

  // Delete reasons
  animalDeleteReason: string = '';
  feedDeleteReason: string = '';

  // Loading states
  loadingAnimals: boolean = false;
  loadingFeeds: boolean = false;

  // paging
  pageAnimal = 1;
  pageFeed = 1;
  readonly pageSize = 10;

  // search
  searchTerm: string = '';

  // misc
  ComId: number = 0;
  submittedAnimal = false;
  submittedFeed = false;

  // current dairy user id (from cookie)
  dairyUserId: number = 0;

  // Image properties
  animalImageFile: File | null = null;
  animalImagePreview: string | null = null;
  animalImageError: string = '';
  
  feedImageFile: File | null = null;
  feedImagePreview: string | null = null;
  feedImageError: string = '';

  // Current selected items for edit
  currentAnimal: any = null;
  currentFeed: any = null;

  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private service: ServicesService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // redirect to dairy login if not logged in to dairy
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    // read dairy user id from cookie
    this.dairyUserId = this.getDairyUserId();

    // init COM_ID if you need (keeps parity with your other components)
    this.ComId = parseInt(localStorage.getItem('COM_ID') || '0');

    this.initForms();
    this.loadAnimals();
    this.loadFeeds();
  }

  initForms() {
    this.animalForm = new FormGroup({
      ANIMAL_NAME: new FormControl('', Validators.required),
      ANIMAL_IMAGE: new FormControl('')
    });

    this.feedForm = new FormGroup({
      FEED_NAME: new FormControl('', Validators.required),
      FEED_IMAGE: new FormControl('')
    });
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  // ----------------- Animal Image Methods -----------------
  onAnimalImageSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.animalImageError = 'Image size should not exceed 5MB';
      return;
    }

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|bmp|webp)/)) {
      this.animalImageError = 'Only image files are allowed (JPEG, JPG, PNG, GIF, BMP, WEBP)';
      return;
    }

    this.animalImageFile = file;
    this.animalImageError = '';

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.animalImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeAnimalImage(): void {
    this.animalImageFile = null;
    this.animalImagePreview = null;
    this.animalImageError = '';
    // Clear the file input
    const fileInput = document.getElementById('animalImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // ----------------- Feed Image Methods -----------------
  onFeedImageSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.feedImageError = 'Image size should not exceed 5MB';
      return;
    }

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|bmp|webp)/)) {
      this.feedImageError = 'Only image files are allowed (JPEG, JPG, PNG, GIF, BMP, WEBP)';
      return;
    }

    this.feedImageFile = file;
    this.feedImageError = '';

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.feedImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeFeedImage(): void {
    this.feedImageFile = null;
    this.feedImagePreview = null;
    this.feedImageError = '';
    // Clear the file input
    const fileInput = document.getElementById('feedImage') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // ----------------- Modal Methods for Animals -----------------
  clearAnimalData() {
    this.ANIMAL_ID = 0;
    this.btnAnimal = '';
    this.animalForm.reset();
    this.animalDeleteReason = '';
    this.submittedAnimal = false;
    this.animalImageFile = null;
    this.animalImagePreview = null;
    this.animalImageError = '';
    this.currentAnimal = null;
  }

  getAnimalById(id: number, action: string) {
    this.ANIMAL_ID = id;
    this.btnAnimal = action;
    
    // Find the animal by ID
    this.currentAnimal = this.animals.find(a => this.getAnimalId(a) === id);
    if (this.currentAnimal) {
      this.animalForm.patchValue({
        ANIMAL_NAME: this.getAnimalName(this.currentAnimal)
      });
      // Clear any existing image preview when editing
      this.animalImageFile = null;
      this.animalImagePreview = null;
    }
  }

  async submitAnimal() {
    this.submittedAnimal = true;

    if (this.btnAnimal === 'D') {
      // Delete logic
      if (this.animalDeleteReason.trim() === '') {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteAnimal();
    } else {
      // Add/Edit logic
      if (this.animalForm.invalid) {
        this.toastr.error('Please fill animal name');
        return;
      }

      // Convert image to base64 if new image is selected
      let animalImageBase64 = null;
      if (this.animalImageFile) {
        animalImageBase64 = await this.convertFileToBase64(this.animalImageFile);
      } else if (this.currentAnimal && !this.animalImagePreview) {
        // Keep existing image if not changed during edit
        animalImageBase64 = this.getAnimalImage(this.currentAnimal);
      }
      
      if (this.ANIMAL_ID === 0) {
        this.addAnimal(animalImageBase64);
      } else {
        this.updateAnimal(animalImageBase64);
      }
    }
  }

  // ----------------- Animals CRUD -----------------
  loadAnimals() {
    if (!this.dairyUserId) {
      this.animals = [];
      this.toastr.warning('Dairy user not found. Please login to Dairy Farm.');
      return;
    }

    this.loadingAnimals = true;
    this.api.get(`DairyMasters/Animals/${this.dairyUserId}`).subscribe({
      next: (res: any) => { 
        this.animals = res || []; 
        this.loadingAnimals = false;
      },
      error: (err) => {
        console.error('loadAnimals', err);
        this.toastr.error('Failed to load animal list');
        this.animals = [];
        this.loadingAnimals = false;
      }
    });
  }

  addAnimal(imageBase64: string | null) {
    const payload: any = {
      AnimalName: this.animalForm.value.ANIMAL_NAME.trim(),
      UserId: this.dairyUserId,
      AnimalImage: imageBase64
    };

    this.api.post('DairyMasters/Animal', payload).subscribe({
      next: () => {
        this.loadAnimals();
        this.closeModal('cattleFormModal');
        setTimeout(() => {
          this.toastr.success('Cattle saved successfully');
          this.clearAnimalData();
        }, 200);
      },
      error: (err) => {
        console.error('submitAnimal (create)', err);
        this.toastr.error('Failed to save cattle');
      }
    });
  }

  updateAnimal(imageBase64: string | null) {
    const payload: any = {
      AnimalName: this.animalForm.value.ANIMAL_NAME.trim(),
      UserId: this.dairyUserId,
      AnimalImage: imageBase64
    };

    this.api.put(`DairyMasters/Animal/${this.ANIMAL_ID}`, payload).subscribe({
      next: () => {
        this.loadAnimals();
        this.closeModal('cattleFormModal');
        setTimeout(() => {
          this.toastr.success('Cattle updated successfully');
          this.clearAnimalData();
        }, 200);
      },
      error: (err) => {
        console.error('submitAnimal (update)', err);
        this.toastr.error('Failed to update cattle');
      }
    });
  }

  deleteAnimal() {
    this.api.delete(`DairyMasters/Animal/${this.ANIMAL_ID}`).subscribe({
      next: () => {
        this.loadAnimals();
        this.closeModal('cattleFormModal');
        setTimeout(() => {
          this.toastr.success('Cattle deleted successfully');
          this.clearAnimalData();
        }, 200);
      },
      error: (err) => {
        console.error('deleteAnimal', err);
        this.toastr.error('Failed to delete cattle');
      }
    });
  }

  // ----------------- Modal Methods for Feeds -----------------
  clearFeedData() {
    this.FEED_ID = 0;
    this.btnFeed = '';
    this.feedForm.reset();
    this.feedDeleteReason = '';
    this.submittedFeed = false;
    this.feedImageFile = null;
    this.feedImagePreview = null;
    this.feedImageError = '';
    this.currentFeed = null;
  }

  getFeedById(id: number, action: string) {
    this.FEED_ID = id;
    this.btnFeed = action;
    
    this.currentFeed = this.feeds.find(f => this.getFeedId(f) === id);
    if (this.currentFeed) {
      this.feedForm.patchValue({
        FEED_NAME: this.getFeedName(this.currentFeed)
      });
      // Clear any existing image preview when editing
      this.feedImageFile = null;
      this.feedImagePreview = null;
    }
  }

  async submitFeed() {
    this.submittedFeed = true;

    if (this.btnFeed === 'D') {
      // Delete logic
      if (this.feedDeleteReason.trim() === '') {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteFeed();
    } else {
      // Add/Edit logic
      if (this.feedForm.invalid) {
        this.toastr.error('Please fill feed name');
        return;
      }

      // Convert image to base64 if new image is selected
      let feedImageBase64 = null;
      if (this.feedImageFile) {
        feedImageBase64 = await this.convertFileToBase64(this.feedImageFile);
      } else if (this.currentFeed && !this.feedImagePreview) {
        // Keep existing image if not changed during edit
        feedImageBase64 = this.getFeedImage(this.currentFeed);
      }
      
      if (this.FEED_ID === 0) {
        this.addFeed(feedImageBase64);
      } else {
        this.updateFeed(feedImageBase64);
      }
    }
  }

  // ----------------- Feeds CRUD -----------------
  loadFeeds() {
    if (!this.dairyUserId) {
      this.feeds = [];
      return;
    }

    this.loadingFeeds = true;
    this.api.get(`DairyMasters/Feeds/${this.dairyUserId}`).subscribe({
      next: (res: any) => { 
        this.feeds = res || []; 
        this.loadingFeeds = false;
      },
      error: (err) => {
        console.error('loadFeeds', err);
        this.toastr.error('Failed to load feeds');
        this.feeds = [];
        this.loadingFeeds = false;
      }
    });
  }

  addFeed(imageBase64: string | null) {
    const payload: any = {
      FeedName: this.feedForm.value.FEED_NAME.trim(),
      UserId: this.dairyUserId,
      FeedImage: imageBase64
    };

    this.api.post('DairyMasters/Feed', payload).subscribe({
      next: () => {
        this.loadFeeds();
        this.closeModal('feedFormModal');
        setTimeout(() => {
          this.toastr.success('Feed saved successfully');
          this.clearFeedData();
        }, 200);
      },
      error: (err) => {
        console.error('submitFeed (create)', err);
        this.toastr.error('Failed to save feed');
      }
    });
  }

  updateFeed(imageBase64: string | null) {
    const payload: any = {
      FeedName: this.feedForm.value.FEED_NAME.trim(),
      UserId: this.dairyUserId,
      FeedImage: imageBase64
    };

    this.api.put(`DairyMasters/Feed/${this.FEED_ID}`, payload).subscribe({
      next: () => {
        this.loadFeeds();
        this.closeModal('feedFormModal');
        setTimeout(() => {
          this.toastr.success('Feed updated successfully');
          this.clearFeedData();
        }, 200);
      },
      error: (err) => {
        console.error('submitFeed (update)', err);
        this.toastr.error('Failed to update feed');
      }
    });
  }

  deleteFeed() {
    this.api.delete(`DairyMasters/Feed/${this.FEED_ID}`).subscribe({
      next: () => {
        this.loadFeeds();
        this.closeModal('feedFormModal');
        setTimeout(() => {
          this.toastr.success('Feed deleted successfully');
          this.clearFeedData();
        }, 200);
      },
      error: (err) => {
        console.error('deleteFeed', err);
        this.toastr.error('Failed to delete feed');
      }
    });
  }

  // ----------------- Common Methods -----------------
  onSearch() {
    // Search functionality - reset pagination
    this.pageAnimal = 1;
    this.pageFeed = 1;
  }

  filteredAnimals() {
    if (!this.searchTerm) return this.animals;
    return this.animals.filter(animal => {
      const name = this.getAnimalName(animal);
      return name.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  filteredFeeds() {
    if (!this.searchTerm) return this.feeds;
    return this.feeds.filter(feed => {
      const name = this.getFeedName(feed);
      return name.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  closeModal(modalId: string) {
    // Use the ApiService modalClose method like in your reference
    this.api.modalClose(modalId);
  }

  // Helper method to convert file to base64
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Helper methods for getting data from objects
  getAnimalId(animal: any): number {
    return animal.AnimalId ?? animal.animal_id ?? animal.animalId ?? animal.id ?? 0;
  }

  getFeedId(feed: any): number {
    return feed.FeedId ?? feed.feed_id ?? feed.feedId ?? feed.id ?? 0;
  }

  getAnimalName(animal: any): string {
    return animal.AnimalName ?? animal.animal_name ?? animal.animalName ?? animal.name ?? '';
  }

  getFeedName(feed: any): string {
    return feed.FeedName ?? feed.feed_name ?? feed.feedName ?? feed.name ?? '';
  }

  getAnimalImage(animal: any): string {
    // Return the image or a default placeholder
    const image = animal.AnimalImage ?? animal.animal_image ?? animal.animalImage ?? animal.image;
    if (image && image.startsWith('data:image')) {
      return image;
    }
    return ''; // Return empty if no image
  }

  getFeedImage(feed: any): string {
    // Return the image or a default placeholder
    const image = feed.FeedImage ?? feed.feed_image ?? feed.feedImage ?? feed.image;
    if (image && image.startsWith('data:image')) {
      return image;
    }
    return ''; // Return empty if no image
  }
}