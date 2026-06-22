import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

interface ShopUser {
  useR_ID: number;
  useR_NAME: string;
  pass: string;
  contact: string;
}

@Component({
  selector: 'app-shop-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './shop-users.component.html',
  styleUrl: './shop-users.component.css'
})
export class ShopUsersComponent implements OnInit {
  users: ShopUser[] = [];
  filteredUsers: ShopUser[] = [];
  searchQuery = '';
  private isBrowser: boolean;

  // Selected user for view/edit/delete
  selectedUser: ShopUser | null = null;

  // Modals state
  showAddModal = false;
  showEditModal = false;
  showDeleteConfirm = false;

  // Forms
  formData = {
    username: '',
    password: '',
    contact: ''
  };

  editFormData = {
    userId: 0,
    username: '',
    password: '',
    contact: ''
  };

  showPassword = false;
  showEditPassword = false;

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
    // Guard check: make sure user is logged in
    if (!this.auth.isShopLoggedIn()) {
      this.toastr.warning('Please login to manage shop users');
      this.router.navigate(['/shop/login']);
      return;
    }
    this.loadUsers();
  }

  loadUsers() {
    this.loader.show();
    this.api.get('ShopUser/GetAll').subscribe({
      next: (res: any) => {
        const rawUsers = Array.isArray(res) ? res : [];
        this.users = rawUsers.map((u: any) => this.normalizeUser(u));
        this.filteredUsers = [...this.users];
        this.loader.hide();
      },
      error: (err) => {
        console.error('Error loading shop users:', err);
        this.toastr.error('Failed to load shop users');
        this.loader.hide();
      }
    });
  }

  normalizeUser(user: any): ShopUser {
    return {
      useR_ID: user.useR_ID ?? user.useR_Id ?? user.useR_id ?? user.USER_ID ?? user.userId ?? 0,
      useR_NAME: user.useR_NAME ?? user.useR_Name ?? user.useR_name ?? user.USER_NAME ?? user.userName ?? '',
      pass: user.pass ?? user.PASS ?? user.Password ?? user.password ?? '',
      contact: user.contact ?? user.CONTACT ?? ''
    };
  }

  searchUsers() {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(u => 
        u.useR_NAME.toLowerCase().includes(query) ||
        u.contact.toLowerCase().includes(query)
      );
    }
  }

  // Add Modal Actions
  openAddModal() {
    this.showAddModal = true;
    this.formData = {
      username: '',
      password: '',
      contact: ''
    };
    this.showPassword = false;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  saveUser() {
    if (!this.formData.username.trim()) {
      this.toastr.error('Please enter a username');
      return;
    }
    if (!this.formData.password.trim()) {
      this.toastr.error('Please enter a password');
      return;
    }
    if (!this.formData.contact.trim()) {
      this.toastr.error('Please enter a contact number');
      return;
    }

    this.loader.show();
    const payload = {
      USER_NAME: this.formData.username.trim(),
      PASS: this.formData.password.trim(),
      CONTACT: this.formData.contact.trim()
    };

    this.api.post('ShopUser/Insert', payload).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.toastr.success('Shop user added successfully');
          this.closeAddModal();
          this.loadUsers();
        } else {
          this.toastr.error(res?.message || 'Failed to add shop user');
          this.loader.hide();
        }
      },
      error: (err) => {
        console.error('Insert error:', err);
        this.toastr.error('Error adding user');
        this.loader.hide();
      }
    });
  }

  // Edit Modal Actions
  openEditModal(user: ShopUser) {
    this.selectedUser = user;
    this.editFormData = {
      userId: user.useR_ID,
      username: user.useR_NAME,
      password: user.pass,
      contact: user.contact
    };
    this.showEditPassword = false;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  updateUser() {
    if (!this.editFormData.username.trim()) {
      this.toastr.error('Please enter a username');
      return;
    }
    if (!this.editFormData.password.trim()) {
      this.toastr.error('Please enter a password');
      return;
    }
    if (!this.editFormData.contact.trim()) {
      this.toastr.error('Please enter a contact number');
      return;
    }

    this.loader.show();
    const payload = {
      USER_ID: this.editFormData.userId,
      USER_NAME: this.editFormData.username.trim(),
      PASS: this.editFormData.password.trim(),
      CONTACT: this.editFormData.contact.trim()
    };

    this.api.put('ShopUser/Update', payload).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.toastr.success('Shop user updated successfully');
          this.closeEditModal();
          this.loadUsers();
        } else {
          this.toastr.error(res?.message || 'Failed to update shop user');
          this.loader.hide();
        }
      },
      error: (err) => {
        console.error('Update error:', err);
        this.toastr.error('Error updating user');
        this.loader.hide();
      }
    });
  }

  // Delete Actions
  openDeleteConfirm(user: ShopUser) {
    this.selectedUser = user;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.selectedUser = null;
  }

  confirmDelete() {
    if (!this.selectedUser) return;

    this.loader.show();
    this.api.delete('ShopUser/Delete', { userId: this.selectedUser.useR_ID }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.toastr.success('Shop user deleted successfully');
          this.closeDeleteConfirm();
          this.loadUsers();
        } else {
          this.toastr.error(res?.message || 'Failed to delete shop user');
          this.loader.hide();
        }
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.toastr.error('Error deleting user');
        this.loader.hide();
      }
    });
  }
}
