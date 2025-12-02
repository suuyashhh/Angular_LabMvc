import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { ApiService } from '../../shared/api.service';
import { ServicesService } from '../../shared/services.service';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxPaginationModule],
  templateUrl: './feeds.component.html',
  styleUrls: ['./feeds.component.css']
})
export class FeedsComponent implements OnInit {
  // Form
  feedForm!: FormGroup;

  // Data
  feeds: any[] = [];

  // editing id and action
  FEED_ID = 0;
  btnFeed = ''; // '', 'E', 'D'

  // delete reason
  feedDeleteReason = '';

  // loading
  loadingFeeds = false;

  // paging
  pageFeed = 1;
  readonly pageSize = 10;

  // search
  searchTerm = '';

  // misc
  ComId = 0;
  submittedFeed = false;
  dairyUserId = 0;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private toastr: ToastrService,
    private service: ServicesService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    this.dairyUserId = this.getDairyUserId();
    this.ComId = parseInt(localStorage.getItem('COM_ID') || '0', 10) || 0;

    this.initForms();
    this.loadFeeds();
  }

  initForms() {
    // Default DATE to today's IST date (YYYY-MM-DD)
    this.feedForm = new FormGroup({
      FEED_NAME: new FormControl('', Validators.required),
      PRICE: new FormControl('', Validators.required),
      QUANTITY: new FormControl('', Validators.required),
      DATE: new FormControl(this.getTodayInIST(), Validators.required)
    });
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  // ----------------- Modal Methods -----------------
  clearFeedData() {
    this.FEED_ID = 0;
    this.btnFeed = '';
    this.feedForm.reset();
    this.feedForm.patchValue({ DATE: this.getTodayInIST() });
    this.feedDeleteReason = '';
    this.submittedFeed = false;
  }

  getFeedById(id: number, action: string) {
    this.FEED_ID = id;
    this.btnFeed = action;

    const feed = this.feeds.find(f => this.getFeedId(f) === id);
    if (feed) {
      this.feedForm.patchValue({
        FEED_NAME: this.getFeedName(feed),
        PRICE: feed.price,
        QUANTITY: feed.quantity,
        DATE: this.formatDateForInput(feed.date)
      });
    }
  }

  submitFeed() {
    this.submittedFeed = true;

    if (this.btnFeed === 'D') {
      if (this.feedDeleteReason.trim() === '') {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteFeed();
      return;
    }

    if (this.feedForm.invalid) {
      this.toastr.error('Please fill required feed fields');
      return;
    }

    if (this.FEED_ID === 0) {
      this.addFeed();
    } else {
      this.updateFeed();
    }
  }

  // ----------------- CRUD -----------------
  loadFeeds() {
    if (!this.dairyUserId) {
      this.feeds = [];
      this.toastr.warning('Dairy user not found. Please login to Dairy Farm.');
      return;
    }

    this.loadingFeeds = true;

    // Debug direct request (bypass ApiService) to ensure URL/CORS correctness
    const testUrl = `/api/Feeds/History/${this.dairyUserId}`;
    console.log('loadFeeds: dairyUserId=', this.dairyUserId, ' testUrl=', testUrl);

    this.http.get(testUrl, { observe: 'response' }).subscribe({
      next: (resp: any) => {
        console.log('Direct HTTP response status', resp.status, 'body', resp.body);
        this.feeds = (resp.body as any) || [];
        this.loadingFeeds = false;
      },
      error: (err: any) => {
        console.error('Direct HTTP error', err);
        this.loadingFeeds = false;
        // fallback to ApiService.get for comparison (ApiService may prepend base)
        this.tryApiServiceLoad();
      }
    });
  }

  private tryApiServiceLoad() {
    this.api.get(`Feeds/History/${this.dairyUserId}`).subscribe({
      next: (res: any) => {
        console.log('api.get success', res);
        this.feeds = res || [];
        this.loadingFeeds = false;
      },
      error: (err: any) => {
        console.error('api.get error', err);
        this.toastr.error('Failed to load feeds: ' + (err?.message || JSON.stringify(err)));
        this.feeds = [];
        this.loadingFeeds = false;
      }
    });
  }

  addFeed() {
    const payload: any = {
      expense_name: 'Feeds',
      feed_name: this.feedForm.value.FEED_NAME.trim(),
      price: Number(this.feedForm.value.PRICE),
      quantity: Number(this.feedForm.value.QUANTITY),
      date: this.formatDate(this.feedForm.value.DATE),
      user_id: this.dairyUserId
    };

    this.api.post('Feeds/Save', payload).subscribe({
      next: () => {
        this.loadFeeds();
        this.closeModal('feedFormModal');
        setTimeout(() => {
          this.toastr.success('Feed saved successfully');
          this.clearFeedData();
        }, 200);
      },
      error: (err: any) => {
        console.error('addFeed', err);
        this.toastr.error('Failed to save feed');
      }
    });
  }

  updateFeed() {
    const payload: any = {
      expense_id: this.FEED_ID,
      expense_name: 'Feeds',
      feed_name: this.feedForm.value.FEED_NAME.trim(),
      price: Number(this.feedForm.value.PRICE),
      quantity: Number(this.feedForm.value.QUANTITY),
      date: this.formatDate(this.feedForm.value.DATE),
      user_id: this.dairyUserId
    };

    this.api.put('Feeds/Edit', payload).subscribe({
      next: () => {
        this.loadFeeds();
        this.closeModal('feedFormModal');
        setTimeout(() => {
          this.toastr.success('Feed updated successfully');
          this.clearFeedData();
        }, 200);
      },
      error: (err: any) => {
        console.error('updateFeed', err);
        this.toastr.error('Failed to update feed');
      }
    });
  }

  deleteFeed() {
    this.api.delete(`Feeds/${this.FEED_ID}`).subscribe({
      next: () => {
        this.loadFeeds();
        this.closeModal('feedFormModal');
        setTimeout(() => {
          this.toastr.success('Feed deleted successfully');
          this.clearFeedData();
        }, 200);
      },
      error: (err: any) => {
        console.error('deleteFeed', err);
        this.toastr.error('Failed to delete feed');
      }
    });
  }

  // ----------------- Helpers -----------------
  onSearch() {
    // reset pagination when searching
    this.pageFeed = 1;
  }

 
  filteredFeeds() {
    const st = (this.searchTerm || '').trim().toLowerCase();
    if (!st) return this.feeds;

    const parsedInputDate = this.parseDateToYYYYMMDD(st); // 'yyyy-mm-dd' or null
    if (parsedInputDate) {
      return this.feeds.filter(f => {
        const normalized = this.normalizeFeedDate(f.date); // 'yyyy-mm-dd' or null
        return normalized === parsedInputDate;
      });
    }

    // fallback: search by name
    return this.feeds.filter(feed => {
      const name = this.getFeedName(feed).toLowerCase();
      return name.includes(st);
    });
  }

  closeModal(modalId: string) {
    this.api.modalClose(modalId);
  }

  getFeedId(feed: any): number {
    return feed.expense_id ?? feed.expenseId ?? feed.id ?? 0;
  }

  getFeedName(feed: any): string {
    return feed.feed_name ?? feed.FeedName ?? feed.feedName ?? feed.name ?? '';
  }

  // Format helpers
  formatDate(d: any): string {
    // If value empty, use today's IST date
    if (!d) return this.getTodayInIST();
    const dateObj = new Date(d);
    return dateObj.toISOString().slice(0, 10);
  }

  formatDateForInput(d: any): string {
    if (!d) return '';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const normalized = this.normalizeFeedDate(d);
    return normalized || '';
  }

  formatDateDisplay(d: any): string {
    if (!d) return '';
    const normalized = this.normalizeFeedDate(d);
    if (!normalized) return '';
    // Display using Indian locale
    const dt = new Date(normalized);
    return dt.toLocaleDateString('en-IN');
  }

  private getTodayInIST(): string {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const ist = new Date(utc.getTime() + 330 * 60000);
    return ist.toISOString().slice(0, 10);
  }

 
  private normalizeFeedDate(raw: any): string | null {
    if (raw === null || raw === undefined) return null;

    // Date object
    if (raw instanceof Date) {
      return raw.toISOString().slice(0, 10);
    }

    // number epoch (seconds or ms)
    if (typeof raw === 'number') {
      const ms = raw < 1e12 ? raw * 1000 : raw;
      const dt = new Date(ms);
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }

    if (typeof raw === 'string') {
      const s = raw.trim();

      // Microsoft JSON /Date(163...)/
      const mJson = s.match(/\/Date\((\-?\d+)(?:[+-]\d+)?\)\//);
      if (mJson) {
        const ms = parseInt(mJson[1], 10);
        const dt = new Date(ms);
        if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
      }

      // already yyyy-mm-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

      // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
      const m = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
      if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        const yyyy = m[3];
        const candidate = `${yyyy}-${mm}-${dd}`;
        const dt = new Date(candidate);
        if (!isNaN(dt.getTime())) return candidate;
      }

      // fallback parse
      const fallback = new Date(s);
      if (!isNaN(fallback.getTime())) return fallback.toISOString().slice(0, 10);
    }

    return null;
  }

  private parseDateToYYYYMMDD(input: string): string | null {
    if (!input) return null;
    input = input.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

    const m = input.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
    if (m) {
      const dd = m[1].padStart(2, '0');
      const mm = m[2].padStart(2, '0');
      const yyyy = m[3];
      const maybe = `${yyyy}-${mm}-${dd}`;
      if (!isNaN(new Date(maybe).getTime())) return maybe;
      return null;
    }

    const dt = new Date(input);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);

    return null;
  }
}
