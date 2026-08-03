import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-admin-helper-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fab-admin-helper-history.component.html',
  styleUrls: ['./fab-admin-helper-history.component.css']
})
export class FabAdminHelperHistoryComponent implements OnInit {
  helpersList: any[] = [];
  filteredHelpersList: any[] = [];
  selectedHelper: any = null;
  searchTerm: string = '';
  advanceRecords: any[] = [];
  groupedAdvances: any[] = [];

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchHelpers();
  }

  fetchHelpers() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Helpers`).subscribe({
      next: (res) => {
        this.helpersList = res || [];
        this.filterHelpers();
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load helpers list', 'Error');
        this.loader.hide();
      }
    });
  }

  filterHelpers() {
    if (!this.searchTerm.trim()) {
      this.filteredHelpersList = this.helpersList;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredHelpersList = this.helpersList.filter(h =>
        (h.user_name || '').toLowerCase().includes(term)
      );
    }
  }

  selectHelper(helper: any) {
    this.selectedHelper = helper;
    this.fetchHelperAdvances(helper.user_id);
  }

  deselectHelper() {
    this.selectedHelper = null;
    this.advanceRecords = [];
    this.groupedAdvances = [];
  }

  fetchHelperAdvances(userId: number) {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/Helper/Advances/${userId}`).subscribe({
      next: (res) => {
        this.advanceRecords = res || [];
        this.groupAdvances();
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load advance history for helper', 'Error');
        this.loader.hide();
      }
    });
  }

  groupAdvances() {
    const groups: any[] = [];
    const seenMonths = new Set<string>();

    this.advanceRecords.forEach(item => {
      if (!item.date) return;
      const date = new Date(item.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!seenMonths.has(monthYear)) {
        seenMonths.add(monthYear);
        groups.push({ key: monthYear, value: [] });
      }
      const group = groups.find(g => g.key === monthYear);
      if (group) {
        group.value.push(item);
      }
    });

    this.groupedAdvances = groups;
  }
}
