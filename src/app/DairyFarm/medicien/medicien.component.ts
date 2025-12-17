import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-medicien',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './medicien.component.html',
  styleUrl: './medicien.component.css'
})
export class MedicienComponent implements OnInit, OnDestroy {
  @ViewChild('DoctorModal') DoctorModal!: ElementRef;
  @ViewChild('doctorInput') doctorInput!: ElementRef;
  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Form
  doctorForm!: FormGroup;

  // Data
  Animals: any[] = [];
  filteredDoctor: any[] = [];

  // Animal dropdown
  AnimalOptions: any[] = [];
  selectedAnimalId: number = 0;
  selectedAnimalName: string = '';
  AnimalSearchTerm: string = '';
  showAnimalDropdown: boolean = false;
  loadingAnimalOptions: boolean = false;
  AnimalSearchTimeout: any;

  // Modal
  modalMode: 'add' | 'edit' | 'delete' = 'add';
  selectedDoctor: any = null;
  deleteReason: string = '';

  // Search
  searchTerm: string = '';

  // Misc
  submitted: boolean = false;
  dairyUserId: number = 0;

  // Image Upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploadingImage: boolean = false;
  imageError: string = '';
  previewImageUrl: string = '';
  isImagePreviewOpen: boolean = false;

  // Button loading states
  isSaving: boolean = false;
  isUpdating: boolean = false;
  isDeleting: boolean = false;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService,
    private router: Router,
    private loader: LoaderService
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

  ngOnDestroy(): void {
    if (this.AnimalSearchTimeout) {
      clearTimeout(this.AnimalSearchTimeout);
    }
  }

  initForm(): void {
    this.doctorForm = new FormGroup({
      Animal_id: new FormControl('', [Validators.required]),
      animal_name: new FormControl('', [Validators.required]),
      price: new FormControl('', [Validators.required, Validators.min(1)]),
      reason: new FormControl('', [Validators.required]),
      date: new FormControl(this.getTodayDate(), [Validators.required]),
      AnimalImage: new FormControl('')
    });
  }

  private getDairyUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  // ==================== IMAGE UPLOAD METHODS ====================
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'Image size should be less than 5MB';
      this.selectedFile = null;
      this.imagePreview = null;
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.imageError = 'Only JPG, PNG, and GIF images are allowed';
      this.selectedFile = null;
      this.imagePreview = null;
      return;
    }

    this.imageError = '';
    this.selectedFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.doctorForm.patchValue({ AnimalImage: '' });
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      return this.doctorForm.get('AnimalImage')?.value || '';
    }

    this.isUploadingImage = true;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64Image = reader.result as string;
        this.isUploadingImage = false;
        resolve(base64Image);
      };
      
      reader.onerror = () => {
        this.isUploadingImage = false;
        reject('Failed to read image file');
      };
      
      reader.readAsDataURL(this.selectedFile!);
    });
  }

  // ==================== IMAGE PREVIEW METHODS ====================
  openImagePreview(): void {
    const imageUrl = this.doctorForm.get('AnimalImage')?.value || this.imagePreview;
    this.previewImageUrl = imageUrl || '../../../assets/DairryFarmImg/doctor_16802630.png';
    this.isImagePreviewOpen = true;
    this.showImagePreviewModal();
  }

  previewCardImage(doctor: any): void {
    this.previewImageUrl = doctor.AnimalImage || '../../../assets/DairryFarmImg/doctor_16802630.png';
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
    img.src = '../../../assets/DairryFarmImg/doctor_16802630.png';
  }

  // ==================== ANIMAL DROPDOWN METHODS ====================
  loadAnimalsOptions(searchTerm: string = ''): void {
    if (!this.dairyUserId) return;

    this.loadingAnimalOptions = true;

    this.api.get(`DairyMasters/Animals/${this.dairyUserId}`).subscribe({
      next: (response: any) => {
        let animals = Array.isArray(response) ? response : [];

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          animals = animals.filter(animal =>
            animal.animalName?.toLowerCase().includes(term) ||
            animal.animalId?.toString().includes(term)
          );
        }

        this.AnimalOptions = animals;
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
    this.selectedAnimalName = input.value;

    if (this.AnimalSearchTimeout) {
      clearTimeout(this.AnimalSearchTimeout);
    }

    this.AnimalSearchTimeout = setTimeout(() => {
      this.loadAnimalsOptions(this.AnimalSearchTerm);
    }, 300);
  }

  selectFeed(animal: any): void {
    this.selectedAnimalId = animal.animalId;
    this.selectedAnimalName = animal.animalName;
    this.showAnimalDropdown = false;

    this.doctorForm.patchValue({
      Animal_id: animal.animalId,
      animal_name: animal.animalName
    });
  }

  toggleFeedDropdown(): void {
    this.showAnimalDropdown = !this.showAnimalDropdown;
    if (this.showAnimalDropdown && this.AnimalOptions.length === 0) {
      this.loadAnimalsOptions();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showAnimalDropdown) return;
    
    const target = event.target as HTMLElement;
    const isClickInside = this.doctorInput?.nativeElement?.contains(target);
    
    if (!isClickInside) {
      this.showAnimalDropdown = false;
    }
  }

  // ==================== MODAL METHODS ====================
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedDoctor = null;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    this.selectedAnimalId = 0;
    this.selectedAnimalName = '';
    this.AnimalSearchTerm = '';
    
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.doctorForm.reset();
    this.doctorForm.patchValue({
      date: this.getTodayDate(),
      Animal_id: '',
      animal_name: '',
      price: '',
      reason: '',
      AnimalImage: ''
    });

    this.loadAnimalsOptions();
    this.showModal();
  }

  openEditModal(doctor: any): void {
    this.modalMode = 'edit';
    this.selectedDoctor = doctor;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const expenseId = doctor.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid doctor data');
      return;
    }

    this.selectedAnimalId = doctor.Animal_id || 0;
    this.selectedAnimalName = doctor.animal_name || '';
    
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.doctorForm.patchValue({
      Animal_id: this.selectedAnimalId,
      animal_name: this.selectedAnimalName,
      price: doctor.price,
      reason: doctor.reason,
      date: this.formatDateForInput(doctor.date),
      AnimalImage: ''
    });

    // Show loader before API call
    this.loader.show();

    this.api.get(`DoctorDairy/GetMedicienImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.AnimalImage || res?.animalImage;
          if (image) {
            this.doctorForm.patchValue({ AnimalImage: image });
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

  openDeleteModal(doctor: any): void {
    this.modalMode = 'delete';
    this.selectedDoctor = doctor;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const expenseId = doctor.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid doctor data');
      return;
    }

    this.selectedAnimalId = doctor.Animal_id || 0;
    this.selectedAnimalName = doctor.animal_name || '';
    
    this.selectedFile = null;
    this.imagePreview = null;

    this.doctorForm.patchValue({
      Animal_id: this.selectedAnimalId,
      animal_name: this.selectedAnimalName,
      price: doctor.price,
      reason: doctor.reason,
      date: this.formatDateForInput(doctor.date),
      AnimalImage: ''
    });

    // Show loader before API call
    this.loader.show();

    this.api.get(`DoctorDairy/GetMedicienImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.AnimalImage || res?.animalImage;
          if (image) {
            this.doctorForm.patchValue({ AnimalImage: image });
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
    
    // Reset image upload state
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';
  }

  showModal(): void {
    const modalElement = this.DoctorModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

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

    this.loader.show();

    this.api.get(`DoctorDairy/GetAllMedicienHistory/${this.dairyUserId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (response: any) => {
          this.Animals = Array.isArray(response) ? response : [];
          this.filteredDoctor = [...this.Animals];
        },
        error: (error: any) => {
          console.error('Failed to load GetAllMedicienHistory:', error);
          this.toastr.error('Failed to load GetAllMedicienHistory');
          this.Animals = [];
          this.filteredDoctor = [];
        }
      });
  }

  async submitFeed(): Promise<void> {
    this.submitted = true;

    if (this.modalMode === 'delete') {
      if (!this.deleteReason.trim()) {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteDoctor();
      return;
    }

    if (this.doctorForm.invalid) {
      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    if (!this.selectedAnimalId) {
      this.toastr.error('Please select an animal from the dropdown');
      return;
    }

    try {
      // Upload image if a new one is selected
      if (this.selectedFile) {
        const base64Image = await this.uploadImage();
        this.doctorForm.patchValue({ AnimalImage: base64Image });
      }

      if (this.modalMode === 'add') {
        await this.addDoctor();
      } else if (this.modalMode === 'edit') {
        await this.updateDoctor();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      this.toastr.error('Failed to upload image');
    }
  }

  async addDoctor(): Promise<void> {
    this.isSaving = true;
    
    const payload = {
      user_id: this.dairyUserId,
      Animal_id: this.selectedAnimalId,
      expense_name: 'Medicine',
      animal_name: this.selectedAnimalName,
      price: Number(this.doctorForm.value.price),
      reason: this.doctorForm.value.reason,
      date: this.formatDateForAPI(this.doctorForm.value.date),
      Switch: 1,
      AnimalImage: this.doctorForm.value.AnimalImage
    };

    this.loader.show();

    this.api.post('DoctorDairy/Save', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isSaving = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Medicien record saved successfully');
          this.closeModal();
          this.loadDoctorHistory();
        },
        error: (error: any) => {
          console.error('Save error:', error);
          this.toastr.error('Failed to save medicien record');
        }
      });
  }

  async updateDoctor(): Promise<void> {
    if (!this.selectedDoctor?.expense_id) {
      this.toastr.error('Invalid medicien data');
      return;
    }

    this.isUpdating = true;

    const payload = {
      expense_id: this.selectedDoctor.expense_id,
      user_id: this.dairyUserId,
      Animal_id: this.selectedAnimalId,
      expense_name: 'Medicine',
      animal_name: this.selectedAnimalName,
      price: Number(this.doctorForm.value.price),
      reason: this.doctorForm.value.reason,
      date: this.formatDateForAPI(this.doctorForm.value.date),
      Switch: 1,
      AnimalImage: this.doctorForm.value.AnimalImage
    };

    this.loader.show();

    this.api.put('DoctorDairy/Edit', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isUpdating = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Medicien record updated successfully');
          this.closeModal();
          this.loadDoctorHistory();
        },
        error: (error: any) => {
          console.error('Update error:', error);
          this.toastr.error('Failed to update medicien record');
        }
      });
  }

  deleteDoctor(): void {
    if (!this.selectedDoctor?.expense_id) {
      this.toastr.error('Invalid medicien data');
      return;
    }

    this.isDeleting = true;

    this.loader.show();

    this.api.delete(`DoctorDairy/${this.selectedDoctor.expense_id}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isDeleting = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Medicien record deleted successfully');
          this.closeModal();
          this.loadDoctorHistory();
        },
        error: (error: any) => {
          console.error('Delete error:', error);
          this.toastr.error('Failed to delete medicien record');
        }
      });
  }

  getAnimalId(doctor: any): number {
    return doctor.expense_id ?? 0;
  }

  // ==================== SEARCH & FILTER ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();

    if (!search) {
      this.filteredDoctor = [...this.Animals];
      return;
    }

    const dateMatch = this.tryParseDate(search);
    if (dateMatch) {
      this.filteredDoctor = this.Animals.filter(doctor => {
        const doctorDate = this.formatDateDisplay(doctor.date).toLowerCase();
        return doctorDate.includes(dateMatch);
      });
      return;
    }

    this.filteredDoctor = this.Animals.filter(doctor =>
      doctor.animal_name?.toLowerCase().includes(search) ||
      doctor.reason?.toLowerCase().includes(search)
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
}