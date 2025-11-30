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

  // paging
  pageAnimal = 1;
  pageFeed = 1;
  readonly pageSize = 10;

  // misc
  ComId: number = 0; // preserve parity with other components
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
    // try common keys returned by your backend (user_id, userId, user_id etc.)
    const id = dairy.user_id ?? dairy.userId ?? dairy.userId ?? dairy.userId;
    return Number(id) || 0;
  }

  // ----------------- Animals -----------------
  loadAnimals() {
    if (!this.dairyUserId) {
      this.animals = [];
      this.toastr.warning('Dairy user not found. Please login to Dairy Farm.');
      return;
    }

    // Controller expects userId in the route (Animals/{userId})
    this.api.get(`DairyMasters/Animals/${this.dairyUserId}`).subscribe({
      next: (res: any) => { this.animals = res || []; },
      error: (err) => {
        console.error('loadAnimals', err);
        this.toastr.error('Failed to load animal list');
        this.animals = [];
      }
    });
  }

  submitAnimal() {
    this.submittedAnimal = true;
    if (this.animalForm.invalid) {
      this.toastr.error('Please fill animal name');
      return;
    }

    const payload: any = {
      // backend CreateAnimal expects AnimalDto with AnimalName property
      AnimalName: this.animalForm.value.ANIMAL_NAME.trim()
      // DO NOT include UserId here: ApiService will inject UserId
    };

    if (this.ANIMAL_ID === 0) {
      // create (POST api/DairyMasters/Animal)
      this.api.post('DairyMasters/Animal', payload).subscribe({
        next: (res: any) => {
          this.loadAnimals();
          setTimeout(() => {
            this.toastr.success('Cattle saved successfully');
            this.animalForm.reset();
            this.submittedAnimal = false;
          }, 200);
        },
        error: (err) => {
          console.error('submitAnimal (create)', err);
          this.toastr.error('Failed to save cattle');
        }
      });
    } else {
      // update (PUT api/DairyMasters/Animal/{id})
      this.api.put(`DairyMasters/Animal/${this.ANIMAL_ID}`, payload).subscribe({
        next: () => {
          this.loadAnimals();
          setTimeout(() => {
            this.toastr.success('Cattle updated successfully');
            this.animalForm.reset();
            this.ANIMAL_ID = 0;
            this.submittedAnimal = false;
          }, 200);
        },
        error: (err) => {
          console.error('submitAnimal (update)', err);
          this.toastr.error('Failed to update cattle');
        }
      });
    }
  }

  editAnimal(item: any) {
    this.ANIMAL_ID = item.AnimalId ?? item.animal_id ?? item.animalId ?? 0;
    this.animalForm.patchValue({ ANIMAL_NAME: item.AnimalName ?? item.animal_name ?? item.animalName });
  }

  cancelEditAnimal() {
    this.ANIMAL_ID = 0;
    this.animalForm.reset();
    this.submittedAnimal = false;
  }

  deleteAnimal(id?: number) {
    if (!id) return;
    if (!confirm('Are you sure want to delete this cattle?')) return;

    // Controller's delete: DELETE api/DairyMasters/Animal/{id}
    this.api.delete(`DairyMasters/Animal/${id}`).subscribe({
      next: () => {
        this.loadAnimals();
        setTimeout(() => this.toastr.success('Cattle deleted successfully'), 200);
      },
      error: (err) => {
        console.error('deleteAnimal', err);
        this.toastr.error('Failed to delete cattle');
      }
    });
  }

  // ----------------- Feeds -----------------
  loadFeeds() {
    if (!this.dairyUserId) {
      this.feeds = [];
      return;
    }

    // Controller expects userId in the route (Feeds/{userId})
    this.api.get(`DairyMasters/Feeds/${this.dairyUserId}`).subscribe({
      next: (res: any) => { this.feeds = res || []; },
      error: (err) => {
        console.error('loadFeeds', err);
        this.toastr.error('Failed to load feeds');
        this.feeds = [];
      }
    });
  }

  submitFeed() {
    this.submittedFeed = true;
    if (this.feedForm.invalid) {
      this.toastr.error('Please fill feed name');
      return;
    }

    const payload: any = {
      // backend CreateFeed expects FeedDto with FeedName property
      FeedName: this.feedForm.value.FEED_NAME.trim()
      // DO NOT include UserId here — ApiService will inject it
    };

    if (this.FEED_ID === 0) {
      // create (POST api/DairyMasters/Feed)
      this.api.post('DairyMasters/Feed', payload).subscribe({
        next: () => {
          this.loadFeeds();
          setTimeout(() => {
            this.toastr.success('Feed saved successfully');
            this.feedForm.reset();
            this.submittedFeed = false;
          }, 200);
        },
        error: (err) => {
          console.error('submitFeed (create)', err);
          this.toastr.error('Failed to save feed');
        }
      });
    } else {
      // update (PUT api/DairyMasters/Feed/{id})
      this.api.put(`DairyMasters/Feed/${this.FEED_ID}`, payload).subscribe({
        next: () => {
          this.loadFeeds();
          setTimeout(() => {
            this.toastr.success('Feed updated successfully');
            this.feedForm.reset();
            this.FEED_ID = 0;
            this.submittedFeed = false;
          }, 200);
        },
        error: (err) => {
          console.error('submitFeed (update)', err);
          this.toastr.error('Failed to update feed');
        }
      });
    }
  }

  editFeed(item: any) {
    this.FEED_ID = item.FeedId ?? item.feed_id ?? item.feedId ?? 0;
    this.feedForm.patchValue({ FEED_NAME: item.FeedName ?? item.feed_name ?? item.feedName });
  }

  cancelEditFeed() {
    this.FEED_ID = 0;
    this.feedForm.reset();
    this.submittedFeed = false;
  }

  deleteFeed(id?: number) {
    if (!id) return;
    if (!confirm('Are you sure want to delete this feed?')) return;

    // Controller's delete: DELETE api/DairyMasters/Feed/{id}
    this.api.delete(`DairyMasters/Feed/${id}`).subscribe({
      next: () => {
        this.loadFeeds();
        setTimeout(() => this.toastr.success('Feed deleted successfully'), 200);
      },
      error: (err) => {
        console.error('deleteFeed', err);
        this.toastr.error('Failed to delete feed');
      }
    });
  }
}
