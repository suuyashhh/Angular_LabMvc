import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

interface ShopExpenseType {
  eX_ID: number;
  name: string;
}

@Component({
  selector: 'app-ex-entrytype',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ex-entrytype.component.html',
  styleUrl: './ex-entrytype.component.css'
})
export class ExEntrytypeComponent implements OnInit {
  expenseTypes: ShopExpenseType[] = [];
  filteredExpenseTypes: ShopExpenseType[] = [];
  searchQuery = '';
  private isBrowser: boolean;

  // Selected item for edit/delete
  selectedType: ShopExpenseType | null = null;

  // Drawer and Modal State
  isDrawerOpen = false;
  editMode = false;
  isDeleteModalOpen = false;
  isSaving = false;

  // Form Data
  formData = {
    exId: 0,
    name: ''
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastr: ToastrService,
    public loader: LoaderService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.auth.isShopLoggedIn()) {
      this.toastr.warning('Please login to manage expense types');
      this.router.navigate(['/shop/login']);
      return;
    }
    this.loadExpenseTypes();
  }

  loadExpenseTypes() {
    this.loader.show();
    this.api.get('ShopExpenseType/GetAll').subscribe({
      next: (res: any) => {
        const rawTypes = Array.isArray(res) ? res : [];
        this.expenseTypes = rawTypes.map((t: any) => this.normalizeType(t));
        this.filteredExpenseTypes = [...this.expenseTypes];
        this.loader.hide();
      },
      error: (err) => {
        console.error('Error loading expense types:', err);
        this.toastr.error('Failed to load expense types');
        this.loader.hide();
      }
    });
  }

  normalizeType(item: any): ShopExpenseType {
    return {
      eX_ID: item.eX_ID ?? item.ex_ID ?? item.ex_id ?? item.EX_ID ?? item.exId ?? 0,
      name: item.name ?? item.NAME ?? ''
    };
  }

  searchTypes() {
    if (!this.searchQuery.trim()) {
      this.filteredExpenseTypes = [...this.expenseTypes];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredExpenseTypes = this.expenseTypes.filter(t => 
        t.name.toLowerCase().includes(query)
      );
    }
  }

  // Drawer Actions
  openAddDrawer() {
    this.editMode = false;
    this.formData = {
      exId: 0,
      name: ''
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(item: ShopExpenseType) {
    this.editMode = true;
    this.selectedType = item;
    this.formData = {
      exId: item.eX_ID,
      name: item.name
    };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedType = null;
    this.formData = { exId: 0, name: '' };
  }

  saveExpenseType() {
    if (!this.formData.name.trim()) {
      this.toastr.error('Please enter a name');
      return;
    }

    this.isSaving = true;

    if (this.editMode) {
      // Update
      const payload = {
        EX_ID: this.formData.exId,
        NAME: this.formData.name.trim()
      };

      this.api.put('ShopExpenseType/Update', payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && res.success) {
            this.toastr.success('Expense type updated successfully');
            this.closeDrawer();
            this.loadExpenseTypes();
          } else {
            this.toastr.error(res?.message || 'Failed to update expense type');
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Update error:', err);
          this.toastr.error('Error updating expense type');
        }
      });
    } else {
      // Insert
      const payload = {
        NAME: this.formData.name.trim()
      };

      this.api.post('ShopExpenseType/Insert', payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && res.success) {
            this.toastr.success('Expense type added successfully');
            this.closeDrawer();
            this.loadExpenseTypes();
          } else {
            this.toastr.error(res?.message || 'Failed to add expense type');
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Insert error:', err);
          this.toastr.error('Error adding expense type');
        }
      });
    }
  }

  // Delete Actions
  confirmDelete(id: number) {
    this.selectedType = this.expenseTypes.find(t => t.eX_ID === id) || null;
    if (this.selectedType) {
      this.isDeleteModalOpen = true;
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.selectedType = null;
  }

  confirmDeleteAction() {
    if (!this.selectedType) return;

    this.loader.show();
    this.api.delete('ShopExpenseType/Delete', { exId: this.selectedType.eX_ID }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.toastr.success('Expense type deleted successfully');
          this.closeDeleteModal();
          this.loadExpenseTypes();
        } else {
          this.toastr.error(res?.message || 'Failed to delete expense type');
          this.loader.hide();
        }
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.toastr.error('Error deleting expense type');
        this.loader.hide();
      }
    });
  }
}
