import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../shared/api.service';
import { AuthService } from '../../../shared/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../../services/loader.service';
import { TejasShopService } from '../../services/tejas-shop.service';

interface TejasUser {
  useR_ID: number;
  useR_NAME: string;
  pass: string;
  contact: string;
  useR_IMG?: string;
  role?: string;
  tejaS_SHOPES_ID?: number;
  shoP_NAME?: string;
}

@Component({
  selector: 'app-Tejas-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './Tejas-users.component.html',
  styleUrl: './Tejas-users.component.css'
})
export class TejasUsersComponent implements OnInit, OnDestroy {
  users: TejasUser[] = [];
  filteredUsers: TejasUser[] = [];
  searchQuery = '';
  selectedShopFilter: number | null = null; // null = all branches
  private isBrowser: boolean;
  private shopSub?: Subscription;

  // Selected user for view/edit/delete
  selectedUser: TejasUser | null = null;

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
    user_img: '',
    role: 'employee',
    tejas_shopes_id: 1 as number | null
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastr: ToastrService,
    public loader: LoaderService,
    public shopService: TejasShopService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.auth.isTejasLoggedIn()) {
      this.toastr.warning('Please login to manage Tejas users');
      this.router.navigate(['/tejas/login']);
      return;
    }
    this.selectedShopFilter = this.shopService.currentShopId;
    this.loadUsers();

    this.shopSub = this.shopService.selectedShop$.subscribe(shop => {
      if (shop) {
        this.selectedShopFilter = shop.tejaS_SHOPES_ID;
        this.loadUsers();
      }
    });
  }

  ngOnDestroy() {
    this.shopSub?.unsubscribe();
  }

  loadUsers() {
    this.loader.show();
    const params: any = {};
    if (this.selectedShopFilter) {
      params.shopId = this.selectedShopFilter;
    }

    this.api.get('TejasUser/GetAll', params).subscribe({
      next: (res: any) => {
        const rawUsers = Array.isArray(res) ? res : [];
        this.users = rawUsers.map((u: any) => this.normalizeUser(u));
        this.applyFilter();
        this.loader.hide();
      },
      error: (err: any) => {
        console.error('Error loading Tejas users:', err);
        this.toastr.error('Failed to load Tejas users');
        this.loader.hide();
      }
    });
  }

  normalizeUser(user: any): TejasUser {
    return {
      useR_ID: user.useR_ID ?? user.useR_Id ?? user.useR_id ?? user.USER_ID ?? user.userId ?? 0,
      useR_NAME: user.useR_NAME ?? user.useR_Name ?? user.useR_name ?? user.USER_NAME ?? user.userName ?? '',
      pass: user.pass ?? user.PASS ?? user.Password ?? user.password ?? '',
      contact: user.contact ?? user.CONTACT ?? '',
      useR_IMG: user.useR_IMG ?? user.useR_Img ?? user.useR_img ?? user.USER_IMG ?? user.userImg ?? user.user_img ?? '',
      role: user.role ?? user.ROLE ?? 'employee',
      tejaS_SHOPES_ID: user.tejaS_SHOPES_ID ?? user.tejas_shopes_id ?? user.TEJAS_SHOPES_ID ?? null,
      shoP_NAME: user.shoP_NAME ?? user.shop_name ?? user.SHOP_NAME ?? user.shopName ?? ''
    };
  }

  onFilterShopChange() {
    this.loadUsers();
  }

  applyFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(u => 
        u.useR_NAME.toLowerCase().includes(query) ||
        u.contact.toLowerCase().includes(query) ||
        (u.shoP_NAME && u.shoP_NAME.toLowerCase().includes(query))
      );
    }
  }

  searchUsers() {
    this.applyFilter();
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
      user_img: '',
      role: 'employee',
      tejas_shopes_id: this.shopService.currentShopId || 1
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(user: TejasUser) {
    this.editMode = true;
    this.selectedUser = user;
    this.showPassword = false;
    this.formData = {
      userId: user.useR_ID,
      username: user.useR_NAME,
      password: user.pass,
      contact: user.contact,
      user_img: user.useR_IMG || '',
      role: user.role || 'employee',
      tejas_shopes_id: user.tejaS_SHOPES_ID || this.shopService.currentShopId || 1
    };
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.selectedUser = null;
    this.formData = { userId: 0, username: '', password: '', contact: '', user_img: '', role: 'employee', tejas_shopes_id: 1 };
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
        USER_IMG: this.formData.user_img,
        ROLE: this.formData.role,
        TEJAS_SHOPES_ID: this.formData.tejas_shopes_id || this.selectedUser?.tejaS_SHOPES_ID || this.shopService.currentShopId || 1
      };

      this.api.put('TejasUser/Update', payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && res.success) {
            this.toastr.success('Tejas user updated successfully');
            this.closeDrawer();
            this.loadUsers();
          } else {
            this.toastr.error(res?.message || 'Failed to update Tejas user');
          }
        },
        error: (err: any) => {
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
        USER_IMG: this.formData.user_img,
        ROLE: this.formData.role,
        TEJAS_SHOPES_ID: this.formData.tejas_shopes_id || this.shopService.currentShopId || 1
      };

      this.api.post('TejasUser/Insert', payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res && res.success) {
            this.toastr.success('Tejas user added successfully');
            this.closeDrawer();
            this.loadUsers();
          } else {
            this.toastr.error(res?.message || 'Failed to add Tejas user');
          }
        },
        error: (err: any) => {
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
    this.api.delete('TejasUser/Delete', { userId: this.selectedUser.useR_ID }).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.toastr.success('Tejas user deleted successfully');
          this.closeDeleteModal();
          this.loadUsers();
        } else {
          this.toastr.error(res?.message || 'Failed to delete Tejas user');
          this.loader.hide();
        }
      },
      error: (err: any) => {
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
