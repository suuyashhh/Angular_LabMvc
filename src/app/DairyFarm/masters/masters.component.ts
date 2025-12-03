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
      ANIMAL_NAME: new FormControl('', Validators.required)
    });

    this.feedForm = new FormGroup({
      FEED_NAME: new FormControl('', Validators.required)
    });
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  // ----------------- Modal Methods for Animals -----------------
  clearAnimalData() {
    this.ANIMAL_ID = 0;
    this.btnAnimal = '';
    this.animalForm.reset();
    this.animalDeleteReason = '';
    this.submittedAnimal = false;
  }

  getAnimalById(id: number, action: string) {
    this.ANIMAL_ID = id;
    this.btnAnimal = action;
    
    // Find the animal by ID - using the correct property names from API
    const animal = this.animals.find(a => this.getAnimalId(a) === id);
    if (animal) {
      this.animalForm.patchValue({
        ANIMAL_NAME: this.getAnimalName(animal)
      });
    }
  }

  submitAnimal() {
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
      
      if (this.ANIMAL_ID === 0) {
        this.addAnimal();
      } else {
        this.updateAnimal();
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
        console.log('Animals API Response:', res); // Debug log
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

  addAnimal() {
    const payload: any = {
      AnimalName: this.animalForm.value.ANIMAL_NAME.trim(),
      UserId: this.dairyUserId
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

  updateAnimal() {
    const payload: any = {
      AnimalName: this.animalForm.value.ANIMAL_NAME.trim(),
      UserId: this.dairyUserId
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
  }

  getFeedById(id: number, action: string) {
    this.FEED_ID = id;
    this.btnFeed = action;
    
    const feed = this.feeds.find(f => this.getFeedId(f) === id);
    if (feed) {
      this.feedForm.patchValue({
        FEED_NAME: this.getFeedName(feed)
      });
    }
  }

  submitFeed() {
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
      
      if (this.FEED_ID === 0) {
        this.addFeed();
      } else {
        this.updateFeed();
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
        console.log('Feeds API Response:', res); // Debug log
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

  addFeed() {
    const payload: any = {
      FeedName: this.feedForm.value.FEED_NAME.trim(),
      UserId: this.dairyUserId
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

  updateFeed() {
    const payload: any = {
      FeedName: this.feedForm.value.FEED_NAME.trim(),
      UserId: this.dairyUserId
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

  // Helper method to get animal ID from any object structure
  getAnimalId(animal: any): number {
    return animal.AnimalId ?? animal.animal_id ?? animal.animalId ?? animal.id ?? 0;
  }

  // Helper method to get feed ID from any object structure
  getFeedId(feed: any): number {
    return feed.FeedId ?? feed.feed_id ?? feed.feedId ?? feed.id ?? 0;
  }

  // Helper method to get animal name from any object structure
  getAnimalName(animal: any): string {
    return animal.AnimalName ?? animal.animal_name ?? animal.animalName ?? animal.name ?? '';
  }

  // Helper method to get feed name from any object structure
  getFeedName(feed: any): string {
    return feed.FeedName ?? feed.feed_name ?? feed.feedName ?? feed.name ?? '';
  }
}