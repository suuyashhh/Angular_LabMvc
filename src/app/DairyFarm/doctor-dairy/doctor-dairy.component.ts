import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-doctor-dairy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './doctor-dairy.component.html',
  styleUrl: './doctor-dairy.component.css'
})
export class DoctorDairyComponent implements OnInit, OnDestroy {
  @ViewChild('DoctorModal') DoctorModal!: ElementRef;
  @ViewChild('DoctorInput') DoctorInput!: ElementRef;
  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;


  // Form
  doctorForm!: FormGroup;

  // Data
  Animals: any[] = [];
  filteredDoctor: any[] = [];

  // Feed dropdown
  AnimalOptions: any[] = [];
  selectedAnimalId: number = 0;
  selectedAnimalName: string = '';
  AnimalSearchTerm: string = '';
  showAnimalDropdown: boolean = false;
  loadingAnimalOptions: boolean = false;
  AnimalSearchTimeout: any;

  // Modal
  modalMode: 'add' | 'edit' | 'delete' = 'add';
  selectedAnimal: any = null;
  deleteReason: string = '';

  // Loading
  loadingDoctorHistory: boolean = false;

  // Search
  searchTerm: string = '';

  // Misc
  submitted: boolean = false;
  dairyUserId: number = 0;


  // Image Preview
  previewImageUrl: string = '';
  isImagePreviewOpen: boolean = false;


  constructor(
    private http: HttpClient,
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    this.dairyUserId = this.getDairyUserId();
    this.initForm();
    this.loadDoctorHistory();
    this.loadAnimalsOptions();
  }

  OnDestroy(): void {
    if (this.AnimalSearchTimeout) {
      clearTimeout(this.AnimalSearchTimeout);
    }
  }

  initForm(): void {
    this.doctorForm = new FormGroup({
      Animal_id: new FormControl('', [Validators.required]),
      animal_name: new FormControl('', [Validators.required]),
      price: new FormControl('', [Validators.required, Validators.min(1)]),
      Reason: new FormControl('', [Validators.required, Validators.min(1)]),
      date: new FormControl(this.getTodayDate(), [Validators.required]),
      feedImage: new FormControl('')
    });
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }



  openImagePreview(): void {
    const imageUrl = this.doctorForm.get('feedImage')?.value;
    this.previewImageUrl = imageUrl || 'assets/images/default-animal.png';

    this.isImagePreviewOpen = true;
    this.showImagePreviewModal();
  }

  closeImagePreview(): void {
    this.isImagePreviewOpen = false;
    this.hideImagePreviewModal();
  }

  showImagePreviewModal(): void {
    const modalElement = this.imagePreviewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      backdrop.addEventListener('click', () => this.closeImagePreview());
      document.body.appendChild(backdrop);
    }
  }

  hideImagePreviewModal(): void {
    const modalElement = this.imagePreviewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');

      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-animal.png';
  }

  // ==================== FEED DROPDOWN METHODS ====================
  loadAnimalsOptions(searchTerm: string = ''): void {
    if (!this.dairyUserId) return;

    this.loadingAnimalOptions = true;

    this.api.get(`DairyMasters/Animals/${this.dairyUserId}`).subscribe({
      next: (response: any) => {
        let Animals = Array.isArray(response) ? response : [];

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          Animals = Animals.filter(animal =>
            animal.animalName?.toLowerCase().includes(term)
          );
        }

        this.AnimalOptions = Animals;
        this.loadingAnimalOptions = false;
      },
      error: (error: any) => {
        console.error('Failed to load animal options:', error);
        this.AnimalOptions = [];
        this.loadingAnimalOptions = false;
      }
    });
  }

  onFeedSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.AnimalSearchTerm = input.value;

    // Clear previous timeout
    if (this.AnimalSearchTimeout) {
      clearTimeout(this.AnimalSearchTimeout);
    }

    // Debounce search
    this.AnimalSearchTimeout = setTimeout(() => {
      this.loadAnimalsOptions(this.AnimalSearchTerm);
    }, 300);
  }

  selectFeed(animal: any): void {
    this.selectedAnimalId = animal.feedId;
    this.selectedAnimalName = animal.animalName;
    this.showAnimalDropdown = false;

    // Update form controls
    this.doctorForm.patchValue({
      animalId: animal.animalId,
      animal_name: animal.animalName
    });
  }

  toggleFeedDropdown(): void {
    this.showAnimalDropdown = !this.showAnimalDropdown;
    if (this.showAnimalDropdown && this.AnimalOptions.length === 0) {
      this.loadAnimalsOptions();
    }
  }

  onFeedBlur(): void {
    // Small delay to allow click events on dropdown items
    setTimeout(() => {
      this.showAnimalDropdown = false;
    }, 200);
  }

  // ==================== MODAL METHODS ====================
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedAnimal = null;
    this.deleteReason = '';
    this.submitted = false;

    // Reset animal selection
    this.selectedAnimalId = 0;
    this.selectedAnimalName = '';
    this.AnimalSearchTerm = '';

    this.doctorForm.reset();
    this.doctorForm.patchValue({
      date: this.getTodayDate(),
      animalId: '',
      animal_name: ''
    });

    // Load fresh animal options
    this.loadAnimalsOptions();

    this.showModal();
  }

  openEditModal(animal: any): void {
    this.modalMode = 'edit';
    this.selectedAnimal = animal;
    this.deleteReason = '';
    this.submitted = false;

    const expenseId = animal.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid animal data');
      return;
    }

    // Set animal selection
    this.selectedAnimalId = animal.animalId || 0;
    this.selectedAnimalName = animal.animalName || '';

    // FIRST PATCH BASIC DATA (without image)
    this.doctorForm.patchValue({
      Animal_id: this.selectedAnimalId,
      animal_name: this.selectedAnimalName,
      price: animal.price,
      Reason: animal.reason,
      date: this.formatDateForInput(animal.date),
      feedImage: ''
    });

    this.api.get(`Feeds/GetFeedImageById/${expenseId}`).subscribe({
      next: (res: any) => {
        const image = res?.feedImage || res?.FeedImage;
        if (image) {
          this.doctorForm.patchValue({ feedImage: image });
        }
        this.showModal();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error("Failed to load animal image");
        this.showModal();
      }
    });

  }

  openDeleteModal(animal: any): void {
    this.modalMode = 'delete';
    this.selectedAnimal = animal;
    this.deleteReason = '';
    this.submitted = false;

    const expenseId = animal.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid animal data');
      return;
    }

    // Set animal selection
    this.selectedAnimalId = animal.animalId || 0;
    this.selectedAnimalName = animal.animalName || '';

    // FIRST PATCH BASIC DATA (without image)
    this.doctorForm.patchValue({
      Animal_id: this.selectedAnimalId,
      animal_name: this.selectedAnimalName,
      price: animal.price,
      Reason: animal.reason,
      date: this.formatDateForInput(animal.date),
      feedImage: ''
    });

    this.api.get(`Feeds/GetFeedImageById/${expenseId}`).subscribe({
      next: (res: any) => {
        const image = res?.feedImage || res?.FeedImage;
        if (image) {
          this.doctorForm.patchValue({ feedImage: image });
        }
        this.showModal();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error("Failed to load animal image");
        this.showModal();
      }
    });

  }

  closeModal(): void {
    const modalElement = this.DoctorModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  }

  showModal(): void {
    const modalElement = this.DoctorModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // ==================== CRUD OPERATIONS ====================
  loadDoctorHistory(): void {
    if (!this.dairyUserId) {
      this.toastr.warning('Please login to Dairy Farm');
      return;
    }

    this.loadingDoctorHistory = true;

    this.api.get(`DoctorDairy/History/${this.dairyUserId}`).subscribe({
      next: (response: any) => {
        this.Animals = Array.isArray(response) ? response : [];
        this.filteredDoctor = [...this.Animals];
        this.loadingDoctorHistory = false;
      },
      error: (error: any) => {
        console.error('Failed to load Animals:', error);
        this.toastr.error('Failed to load Animals');
        this.loadingDoctorHistory = false;
        this.Animals = [];
        this.filteredDoctor = [];
      }
    });
  }

  submitFeed(): void {
    this.submitted = true;

    if (this.modalMode === 'delete') {
      if (!this.deleteReason.trim()) {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteFeed();
      return;
    }

    if (this.doctorForm.invalid) {
      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    // Validate animal selection
    if (!this.selectedAnimalId) {
      this.toastr.error('Please select a animal from the dropdown');
      return;
    }

    if (this.modalMode === 'add') {
      this.addFeed();
    } else if (this.modalMode === 'edit') {
      this.updateFeed();
    }
  }

  addFeed(): void {
    const payload = {
      user_id: this.dairyUserId,
      Animal_id: this.selectedAnimalId,
      expense_name: 'Feeds',
      animal_name: this.selectedAnimalName,
      price: Number(this.doctorForm.value.price),
      Reason: Number(this.doctorForm.value.Reason),
      date: this.formatDateForAPI(this.doctorForm.value.date)
    };

    this.api.post('Feeds/Save', payload).subscribe({
      next: () => {
        this.toastr.success('Feed saved successfully');
        this.closeModal();
        this.loadDoctorHistory();
      },
      error: (error: any) => {
        console.error('Save error:', error);
        this.toastr.error('Failed to save animal');
      }
    });
  }

  updateFeed(): void {
    if (!this.selectedAnimal?.expense_id) {
      this.toastr.error('Invalid animal data');
      return;
    }

    const payload = {
      expense_id: this.selectedAnimal.expense_id,
      user_id: this.dairyUserId,
      Animal_id: this.selectedAnimalId,
      expense_name: 'Feeds',
      animal_name: this.selectedAnimalName,
      price: Number(this.doctorForm.value.price),
      Reason: Number(this.doctorForm.value.Reason),
      date: this.formatDateForAPI(this.doctorForm.value.date)
    };

    this.api.put('Feeds/Edit', payload).subscribe({
      next: () => {
        this.toastr.success('Feed updated successfully');
        this.closeModal();
        this.loadDoctorHistory();
      },
      error: (error: any) => {
        console.error('Update error:', error);
        this.toastr.error('Failed to update animal');
      }
    });
  }

  deleteFeed(): void {
    if (!this.selectedAnimal?.expense_id) {
      this.toastr.error('Invalid animal data');
      return;
    }

    this.api.delete(`Feeds/${this.selectedAnimal.expense_id}`).subscribe({
      next: () => {
        this.toastr.success('Feed deleted successfully');
        this.closeModal();
        this.loadDoctorHistory();
      },
      error: (error: any) => {
        console.error('Delete error:', error);
        this.toastr.error('Failed to delete animal');
      }
    });
  }


  getAnimalId(animal: any): number {
    return animal.animalId ?? 0;
  }

  // ==================== SEARCH & FILTER ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();

    if (!search) {
      this.filteredDoctor = [...this.Animals];
      return;
    }

    // Try to match date first
    const dateMatch = this.tryParseDate(search);
    if (dateMatch) {
      this.filteredDoctor = this.Animals.filter(animal => {
        const feedDate = this.formatDateDisplay(animal.date).toLowerCase();
        return feedDate.includes(dateMatch);
      });
      return;
    }

    // Then match by animal name
    this.filteredDoctor = this.Animals.filter(animal =>
      animal.animal_name.toLowerCase().includes(search)
    );
  }

  // ==================== HELPER METHODS ====================
  private getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  formatDateForInput(date: any): string {
    if (!date) return '';

    if (typeof date === 'string') {
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date;
    }

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    return '';
  }

  formatDateForAPI(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    return new Date(dateStr).toISOString();
  }

  formatDateDisplay(date: any): string {
    if (!date) return '';

    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  private tryParseDate(search: string): string | null {
    const formats = [
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/
    ];

    for (const format of formats) {
      if (format.test(search)) {
        return search;
      }
    }

    return null;
  }

  // Add this method to clean up timeouts
  ngOnDestroy(): void {
    if (this.AnimalSearchTimeout) {
      clearTimeout(this.AnimalSearchTimeout);
    }
  }
}