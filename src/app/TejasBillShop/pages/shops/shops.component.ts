import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TejasShop } from '../../models/interfaces';
import { TejasShopService } from '../../services/tejas-shop.service';
import { AuthService } from '../../../shared/auth.service';
import { LoaderService } from '../../../services/loader.service';

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.css']
})
export class ShopsComponent implements OnInit {
  public shopService = inject(TejasShopService);
  private auth = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  public loader = inject(LoaderService);

  shops: TejasShop[] = [];
  filteredShops: TejasShop[] = [];
  searchQuery = '';
  isAdmin = false;

  // Drawer / Modal states
  isDrawerOpen = false;
  editMode = false;
  isDeleteModalOpen = false;
  isSaving = false;
  shopToDeleteId: number | null = null;

  formData: Partial<TejasShop> = {
    tejaS_SHOPES_ID: 0,
    shoP_NAME: '',
    shoP_CODE: '',
    address: '',
    contact: '',
    email: '',
    gsT_NO: '',
    active: 'Y'
  };

  ngOnInit(): void {
    if (!this.auth.isTejasLoggedIn()) {
      this.toastr.warning('Please login to continue');
      this.router.navigate(['/tejas/login']);
      return;
    }

    let role = '';
    if (typeof localStorage !== 'undefined') {
      try {
        const uStr = localStorage.getItem('Tejas_user') || localStorage.getItem('userDetails');
        if (uStr) {
          const u = JSON.parse(uStr);
          role = (u?.role || u?.ROLE || '').toString().toLowerCase().trim();
        }
      } catch {}
    }
    const user = this.auth.getTejasCredentialsFromCookie();
    if (!role && user?.role) {
      role = (user.role || '').toString().toLowerCase().trim();
    }
    this.isAdmin = role === 'admin' || role === 'superadmin';

    this.shopService.shops$.subscribe(list => {
      this.shops = list;
      this.filterShops();
    });

    this.shopService.loadShops().subscribe();
  }

  filterShops(): void {
    if (!this.searchQuery.trim()) {
      this.filteredShops = [...this.shops];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredShops = this.shops.filter(s =>
        (s.shoP_NAME && s.shoP_NAME.toLowerCase().includes(q)) ||
        (s.shoP_CODE && s.shoP_CODE.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.contact && s.contact.toLowerCase().includes(q))
      );
    }
  }

  openAddDrawer(): void {
    this.editMode = false;
    this.formData = {
      tejaS_SHOPES_ID: 0,
      shoP_NAME: '',
      shoP_CODE: '',
      address: '',
      contact: '',
      email: '',
      gsT_NO: '',
      active: 'Y'
    };
    this.isDrawerOpen = true;
  }

  openEditDrawer(shop: TejasShop): void {
    this.editMode = true;
    this.formData = { ...shop };
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  saveShop(): void {
    if (!this.formData.shoP_NAME || !this.formData.shoP_NAME.trim()) {
      this.toastr.error('Please enter a shop name', 'Validation Error');
      return;
    }

    this.isSaving = true;

    if (this.editMode) {
      this.shopService.updateShop(this.formData as TejasShop).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          this.toastr.success('Shop updated successfully', 'Success');
          this.closeDrawer();
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Update shop error:', err);
          this.toastr.error('Failed to update shop', 'Error');
        }
      });
    } else {
      this.shopService.addShop(this.formData).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          this.toastr.success('Shop added successfully', 'Success');
          this.closeDrawer();
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error('Add shop error:', err);
          this.toastr.error('Failed to add shop', 'Error');
        }
      });
    }
  }

  selectAndSwitchShop(shop: TejasShop): void {
    this.shopService.selectShop(shop);
    this.toastr.info(`Active branch switched to: ${shop.shoP_NAME}`, 'Shop Selected');
  }

  confirmDelete(shopId: number): void {
    this.shopToDeleteId = shopId;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.shopToDeleteId = null;
  }

  executeDelete(): void {
    if (!this.shopToDeleteId) return;

    this.shopService.deleteShop(this.shopToDeleteId).subscribe({
      next: () => {
        this.toastr.success('Shop deactivated successfully', 'Success');
        this.closeDeleteModal();
      },
      error: (err: any) => {
        console.error('Delete shop error:', err);
        this.toastr.error('Failed to delete shop', 'Error');
        this.closeDeleteModal();
      }
    });
  }
}
