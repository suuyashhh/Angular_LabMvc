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
  useR_IMG?: string;
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

  // Drawer and Modal State
  isDrawerOpen = false;
  editMode = false;
  isDeleteModalOpen = false;
  isSaving = false;
  showPassword = false;

  // Form Data
  formData = {
    userId: 0,
    username: '',
    password: '',
    contact: '',
    user_img: ''
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
      contact: user.contact ?? user.CONTACT ?? '',
      useR_IMG: user.useR_IMG ?? user.useR_Img ?? user.useR_img ?? user.USER_IMG ?? user.userImg ?? user.user_img ?? ''
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

  // Drawer Actions
  openAddDrawer() {
    this.editMode = false;
    this.showPassword = false;
    this.formData = {
      userId: 0,
      username: '',
      password: '',
      contact: '',
      user_img: ''
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(user: ShopUser) {
    this.editMode = true;
    this.selectedUser = user;
    this.showPassword = false;
    this.formData = {
      userId: user.useR_ID,
      username: user.useR_NAME,
      password: user.pass,
      contact: user.contact,
      user_img: user.useR_IMG || ''
    };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedUser = null;
    this.formData = { userId: 0, username: '', password: '', contact: '', user_img: '' };
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

    this.isSaving = true;

    if (this.editMode) {
      const payload = {
        USER_ID: this.formData.userId,
        USER_NAME: this.formData.username.trim(),
        PASS: this.formData.password.trim(),
        CONTACT: this.formData.contact.trim(),
        USER_IMG: this.formData.user_img
      };

      this.api.put('ShopUser/Update', payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && res.success) {
            this.toastr.success('Shop user updated successfully');
            this.closeDrawer();
            this.loadUsers();
          } else {
            this.toastr.error(res?.message || 'Failed to update shop user');
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Update error:', err);
          this.toastr.error('Error updating user');
        }
      });
    } else {
      const payload = {
        USER_NAME: this.formData.username.trim(),
        PASS: this.formData.password.trim(),
        CONTACT: this.formData.contact.trim(),
        USER_IMG: this.formData.user_img
      };

      this.api.post('ShopUser/Insert', payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && res.success) {
            this.toastr.success('Shop user added successfully');
            this.closeDrawer();
            this.loadUsers();
          } else {
            this.toastr.error(res?.message || 'Failed to add shop user');
          }
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Insert error:', err);
          this.toastr.error('Error adding user');
        }
      });
    }
  }

  // Delete Actions
  confirmDelete(id: number) {
    this.selectedUser = this.users.find(u => u.useR_ID === id) || null;
    if (this.selectedUser) {
      this.isDeleteModalOpen = true;
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.selectedUser = null;
  }

  confirmDeleteAction() {
    if (!this.selectedUser) return;
 
    this.loader.show();
    this.api.delete('ShopUser/Delete', { userId: this.selectedUser.useR_ID }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.toastr.success('Shop user deleted successfully');
          this.closeDeleteModal();
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        this.toastr.warning('Image size should not exceed 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData.user_img = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.formData.user_img = '';
  }
}
