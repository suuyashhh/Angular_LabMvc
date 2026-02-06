import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
    items: any[] = [];

  showModal = false;
  editMode = false;
  menuIndex: number | null = null;
  userName: string | null = null;
  userId: string | null = null;

  formName = '';
  previewImage: any = null;
  editIndex: number | null = null;

  constructor(
    private auth: AuthService,
    private loader: LoaderService,
    private toastr: ToastrService,
    private api: ApiService
  ) { }

  ngOnInit() {
    const farm = this.auth.getFarmUserDetailsFromCookie();
    debugger;
    if (farm && farm.useR_NAME) {
      this.userName = farm.useR_NAME;
      this.userId = farm.useR_ID;
    }
  }

  openModal() {
    this.showModal = true;
    this.editMode = false;
    this.formName = '';
    this.previewImage = null;
  }

  closeModal() {
    this.showModal = false;
  }

  toggleMenu(index: number) {
    this.menuIndex = this.menuIndex === index ? null : index;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveItem() {
    if (this.editMode && this.editIndex !== null) {
      this.items[this.editIndex] = {
        name: this.formName,
        image: this.previewImage
      };
    } else {
      this.items.push({
        name: this.formName,
        image: this.previewImage
      });
    }

    this.closeModal();
  }

  editItem(item: any) {
    this.editMode = true;
    this.showModal = true;
    this.formName = item.name;
    this.previewImage = item.image;
    this.editIndex = this.items.indexOf(item);
  }

  deleteItem(index: number) {
    this.items.splice(index, 1);
  }
}