import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-fab-admin-history-all',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fab-admin-history-all.component.html',
  styleUrls: ['./fab-admin-history-all.component.css']
})
export class FabAdminHistoryAllComponent implements OnInit {
  historyRecords: any[] = [];
  filteredGroups: any[] = [];
  searchTerm: string = '';

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private loader: LoaderService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.fetchHistory();
  }

  fetchHistory() {
    this.loader.show();
    this.http.get<any[]>(`${this.api.baseurl}Fab/HistoryAll`).subscribe({
      next: (res) => {
        this.historyRecords = res || [];
        this.filterAndGroupHistory();
        this.loader.hide();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to load history logs', 'Error');
        this.loader.hide();
      }
    });
  }

  filterAndGroupHistory() {
    let filtered = this.historyRecords;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = this.historyRecords.filter(item => {
        const name = (item.record_name || '').toLowerCase();
        const type = (item.record_type || '').toLowerCase();
        const price = String(item.price);
        const dateStr = item.record_date ? new Date(item.record_date).toLocaleDateString() : '';
        return name.includes(term) || type.includes(term) || price.includes(term) || dateStr.toLowerCase().includes(term);
      });
    }

    this.filteredGroups = this.groupHistoryByMonth(filtered);
  }

  groupHistoryByMonth(items: any[]): any[] {
    const groups: any[] = [];
    const seenMonths = new Set<string>();

    items.forEach(item => {
      if (!item.record_date) return;
      const date = new Date(item.record_date);
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
    return groups;
  }

  getItemImage(recordType: string): string {
    switch (recordType) {
      case 'FabProfit':
        return 'assets/img/Fabrication/Profit.png';
      case 'GoodExpanse':
        return 'assets/img/Fabrication/Expanse.png';
      case 'TransportPlace':
        return 'assets/img/Fabrication/TransportList.png';
      case 'Advance':
        return 'assets/img/Fabrication/AdvanceMoney.png';
      case 'SalarySlip':
        return 'assets/img/Fabrication/AdminCreateSalaySlip.png';
      default:
        return 'assets/img/Fabrication/Expanse.png';
    }
  }

  getRecordTypeLabel(recordType: string): string {
    switch (recordType) {
      case 'FabProfit':
        return 'Revenue / Bill';
      case 'GoodExpanse':
        return 'Workshop Expense';
      case 'TransportPlace':
        return 'Transport Expense';
      case 'Advance':
        return 'Helper Advance';
      case 'SalarySlip':
        return 'Salary Slip Paid';
      default:
        return 'Other';
    }
  }

  getBadgeClass(recordType: string): string {
    switch (recordType) {
      case 'FabProfit':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'GoodExpanse':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'TransportPlace':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Advance':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SalarySlip':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
}
