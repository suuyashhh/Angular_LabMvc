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
  @ViewChild('medicienModal') medicienModal!: ElementRef;
  @ViewChild('viewModal') viewModal!: ElementRef;
  @ViewChild('animalInput') animalInput!: ElementRef;
  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  // Form
  medicienForm!: FormGroup;

  // Data
  medicines: any[] = [];
  filteredMedicines: any[] = [];

  // Animal dropdown
  animalOptions: any[] = [];
  selectedAnimalId: number = 0;
  selectedAnimalName: string = '';
  animalSearchTerm: string = '';
  showAnimalDropdown: boolean = false;
  loadingAnimalOptions: boolean = false;
  animalSearchTimeout: any;

  // Modal
  modalMode: 'add' | 'edit' | 'delete' = 'add';
  selectedMedicine: any = null; // Changed from selectedMedicien to selectedMedicine
  deleteReason: string = '';

  // View Modal
  selectedMedicineView: any = null;
  viewImageUrl: string = '';

  // Grouped Medicines
  groupedMedicines: { date: string; items: any[] }[] = [];

  // Search
  searchTerm: string = '';
  isLoadingViewImage = false;
  // Misc
  submitted: boolean = false;
  dairyUserId: number = 0;
  isLoading: boolean = false;

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
    this.loadMedicineHistory();
  }

  ngOnDestroy(): void {
    if (this.animalSearchTimeout) {
      clearTimeout(this.animalSearchTimeout);
    }
  }

  initForm(): void {
    this.medicienForm = new FormGroup({
      Animal_id: new FormControl('', [Validators.required]), // Keep original field name to match API
      animal_name: new FormControl('', [Validators.required]),
      price: new FormControl('', [Validators.required, Validators.min(1)]),
      reason: new FormControl('', [Validators.required]),
      date: new FormControl(this.getTodayDate(), [Validators.required]),
      AnimalImage: new FormControl('') // Keep original field name to match API
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

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      this.imageError = 'Image size should be less than 1MB';
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

    // Create preview and compress if needed
    this.compressAndPreviewImage(file);
  }

  compressAndPreviewImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          this.createBasicPreview(file);
          return;
        }

        // Set maximum dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Get compressed base64 with quality 0.7 (70% quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        this.imagePreview = compressedBase64;
      };

      img.onerror = () => {
        this.createBasicPreview(file);
      };
    };

    reader.onerror = () => {
      this.imageError = 'Failed to read image file';
      this.selectedFile = null;
      this.imagePreview = null;
    };

    reader.readAsDataURL(file);
  }

  createBasicPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.medicienForm.patchValue({ AnimalImage: '' });

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      return this.medicienForm.get('AnimalImage')?.value || '';
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
  openImagePreviewWithUrl(imageUrl: string | null): void {
    this.previewImageUrl = imageUrl || '../../../assets/DairryFarmImg/tablet_16443237.png';
    this.showImagePreviewModal();
  }


  closeImagePreview(): void {
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
    img.src = '../../../assets/DairryFarmImg/tablet_16443237.png';
  }

  // ==================== VIEW MODAL METHODS ====================
  async openViewModal(medicine: any): Promise<void> {
    // ✅ Store the original object for Edit/Delete actions
    this.selectedMedicine = medicine;          // <-- IMPORTANT: Store original object
    this.selectedMedicineView = { ...medicine }; // copy for display

    this.viewImageUrl = ''; // Reset image URL
    this.isLoadingViewImage = true;

    // Show the modal immediately
    this.showViewModal();

    // Try to fetch the image in the background
    if (medicine.expense_id) {
      try {
        const imageData = await this.fetchMedicineImageById(medicine.expense_id);

        // Check if the response has an image
        if (imageData && (imageData.AnimalImage || imageData.animalImage)) {
          // Use whichever field contains the image
          const imageUrl = imageData.AnimalImage || imageData.animalImage;

          // Check if it's a base64 image or a URL
          if (imageUrl.startsWith('data:image') || imageUrl.startsWith('http')) {
            this.viewImageUrl = imageUrl;
          } else if (imageUrl) {
            // If it's not a data URL, assume it's a base64 string without the prefix
            this.viewImageUrl = 'data:image/jpeg;base64,' + imageUrl;
          }
        } else if (medicine.AnimalImage) {
          // Fallback to the image from the medicine object
          const imgUrl = medicine.AnimalImage;
          if (imgUrl.startsWith('data:image') || imgUrl.startsWith('http')) {
            this.viewImageUrl = imgUrl;
          } else if (imgUrl) {
            this.viewImageUrl = 'data:image/jpeg;base64,' + imgUrl;
          }
        } else {
          // No image available, use default
          this.viewImageUrl = '../../../assets/DairryFarmImg/tablet_16443237.png';
        }
      } catch (error) {
        console.error('Error fetching medicine image:', error);
        // Fallback to medicine data or default image
        if (medicine.AnimalImage) {
          const imgUrl = medicine.AnimalImage;
          if (imgUrl.startsWith('data:image') || imgUrl.startsWith('http')) {
            this.viewImageUrl = imgUrl;
          } else if (imgUrl) {
            this.viewImageUrl = 'data:image/jpeg;base64,' + imgUrl;
          }
        } else {
          this.viewImageUrl = '../../../assets/DairryFarmImg/tablet_16443237.png';
        }
      } finally {
        this.isLoadingViewImage = false;

        // Update the stored medicine object with the image
        if (this.selectedMedicine && this.viewImageUrl !== '../../../assets/DairryFarmImg/tablet_16443237.png') {
          this.selectedMedicine.AnimalImage = this.viewImageUrl;
        }
      }
    } else {
      // No expense_id, use what's available
      if (medicine.AnimalImage) {
        const imgUrl = medicine.AnimalImage;
        if (imgUrl.startsWith('data:image') || imgUrl.startsWith('http')) {
          this.viewImageUrl = imgUrl;
        } else if (imgUrl) {
          this.viewImageUrl = 'data:image/jpeg;base64,' + imgUrl;
        }
      } else {
        this.viewImageUrl = '../../../assets/DairryFarmImg/tablet_16443237.png';
      }
      this.isLoadingViewImage = false;
    }
  }

  private fetchMedicineImageById(expenseId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.api.get(`DoctorDairy/GetMedicienImageById/${expenseId}`)
        .subscribe({
          next: (response: any) => {
            resolve(response);
          },
          error: (error: any) => {
            console.error('Error fetching medicine image:', error);
            reject(error);
          }
        });
    });
  }

  onViewImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '../../../assets/DairryFarmImg/tablet_16443237.png';
    this.isLoadingViewImage = false;
  }


  closeViewModal(): void {
    const modalElement = this.viewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }

    // reset only view data
    this.selectedMedicineView = null;
    this.viewImageUrl = '';
    this.isLoadingViewImage = false;

    // ✅ DO NOT clear selectedMedicine here
  }


  showViewModal(): void {
    const modalElement = this.viewModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      backdrop.addEventListener('click', () => this.closeViewModal());
      document.body.appendChild(backdrop);
    }
  }

  // ==================== ANIMAL DROPDOWN METHODS ====================
  loadAnimalOptions(searchTerm: string = ''): void {
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

        this.animalOptions = animals;
        this.loadingAnimalOptions = false;
      },
      error: (error: any) => {
        console.error('Failed to load animal options:', error);
        this.animalOptions = [];
        this.loadingAnimalOptions = false;
        this.toastr.error('Failed to load animals');
      }
    });
  }

  onAnimalSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.animalSearchTerm = input.value;
    this.selectedAnimalName = input.value;

    if (this.animalSearchTimeout) {
      clearTimeout(this.animalSearchTimeout);
    }

    this.animalSearchTimeout = setTimeout(() => {
      this.loadAnimalOptions(this.animalSearchTerm);
    }, 300);
  }

  selectAnimal(animal: any): void {
    this.selectedAnimalId = animal.animalId;
    this.selectedAnimalName = animal.animalName;
    this.showAnimalDropdown = false;

    this.medicienForm.patchValue({
      Animal_id: animal.animalId,
      animal_name: animal.animalName
    });
  }

  toggleAnimalDropdown(): void {
    this.showAnimalDropdown = !this.showAnimalDropdown;
    if (this.showAnimalDropdown && this.animalOptions.length === 0) {
      this.loadAnimalOptions();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showAnimalDropdown) return;

    const target = event.target as HTMLElement;
    const isClickInside = this.animalInput?.nativeElement?.contains(target);

    if (!isClickInside) {
      this.showAnimalDropdown = false;
    }
  }

  // ==================== MODAL METHODS ====================
  openAddModal(): void {
    this.modalMode = 'add';
    this.selectedMedicine = null;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    this.selectedAnimalId = 0;
    this.selectedAnimalName = '';
    this.animalSearchTerm = '';

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.medicienForm.reset();
    this.medicienForm.patchValue({
      date: this.getTodayDate(),
      Animal_id: '',
      animal_name: '',
      price: '',
      reason: '',
      AnimalImage: ''
    });

    this.loadAnimalOptions();
    this.showModal();
  }

  openEditModal(medicine: any): void {
    this.modalMode = 'edit';
    this.selectedMedicine = medicine;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const expenseId = medicine.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid medicine data');
      return;
    }

    this.selectedAnimalId = medicine.Animal_id || 0;
    this.selectedAnimalName = medicine.animal_name || '';

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';

    this.medicienForm.patchValue({
      Animal_id: this.selectedAnimalId,
      animal_name: this.selectedAnimalName,
      price: medicine.price,
      reason: medicine.reason,
      date: this.formatDateForInput(medicine.date),
      AnimalImage: medicine.AnimalImage || '' // Use the existing image from the medicine object
    });

    // Show loader before API call to get image
    this.loader.show();

    // Call API to get the image by ID
    this.api.get(`DoctorDairy/GetMedicienImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.AnimalImage || res?.animalImage || medicine.AnimalImage;
          if (image) {
            this.medicienForm.patchValue({ AnimalImage: image });
          }
          this.showModal();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error("Failed to load medicine image");
          this.showModal();
        }
      });
  }

  openDeleteModal(medicine: any): void {
    this.modalMode = 'delete';
    this.selectedMedicine = medicine;
    this.deleteReason = '';
    this.submitted = false;
    this.isSaving = false;
    this.isUpdating = false;
    this.isDeleting = false;

    const expenseId = medicine.expense_id;

    if (!expenseId) {
      this.toastr.error('Invalid medicine data');
      return;
    }

    this.selectedAnimalId = medicine.Animal_id || 0;
    this.selectedAnimalName = medicine.animal_name || '';

    this.selectedFile = null;
    this.imagePreview = null;

    this.medicienForm.patchValue({
      Animal_id: this.selectedAnimalId,
      animal_name: this.selectedAnimalName,
      price: medicine.price,
      reason: medicine.reason,
      date: this.formatDateForInput(medicine.date),
      AnimalImage: medicine.AnimalImage || ''
    });

    // Show loader before API call to get image
    this.loader.show();

    // Call API to get the image by ID
    this.api.get(`DoctorDairy/GetMedicienImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.AnimalImage || res?.animalImage || medicine.AnimalImage;
          if (image) {
            this.medicienForm.patchValue({ AnimalImage: image });
          }
          this.showModal();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error("Failed to load medicine image");
          this.showModal();
        }
      });
  }

  closeModal(): void {
    const modalElement = this.medicienModal?.nativeElement;
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
    const modalElement = this.medicienModal?.nativeElement;
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // ==================== GROUP MEDICINES BY DATE ====================
  groupMedicinesByDate(): void {
    this.groupedMedicines = [];

    if (!this.filteredMedicines || this.filteredMedicines.length === 0) return;

    const map = new Map<string, any[]>();

    for (const medicine of this.filteredMedicines) {
      const dateStr = this.getDateString(medicine.date);

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(medicine);
    }

    this.groupedMedicines = Array.from(map.entries()).map(([date, items]) => ({
      date,
      items
    }));
  }

  getDateString(date: any): string {
    if (!date) return 'Unknown Date';

    try {
      const d = new Date(date);

      const day = d.getDate().toString().padStart(2, '0');

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();

      return `${day}-${month}-${year}`;
    } catch {
      return 'Unknown Date';
    }
  }

  // ==================== CRUD OPERATIONS ====================
  loadMedicineHistory(): void {
    if (!this.dairyUserId) {
      this.toastr.warning('Please login to Dairy Farm');
      return;
    }

    this.isLoading = true;
    this.loader.show();

    this.api.get(`DoctorDairy/GetAllMedicienHistory/${this.dairyUserId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.medicines = Array.isArray(response) ? response : [];
          this.filteredMedicines = [...this.medicines];
          this.groupMedicinesByDate();
        },
        error: (error: any) => {
          console.error('Failed to load medicine history:', error);
          this.toastr.error('Failed to load medicine history');
          this.medicines = [];
          this.filteredMedicines = [];
          this.groupedMedicines = [];
        }
      });
  }

  async submitMedicine(): Promise<void> {
    this.submitted = true;

    if (this.modalMode === 'delete') {
      if (!this.deleteReason.trim()) {
        this.toastr.error('Please provide delete reason');
        return;
      }
      this.deleteMedicine();
      return;
    }

    if (this.medicienForm.invalid) {
      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    if (!this.selectedAnimalId) {
      this.toastr.error('Please select an animal from the dropdown');
      return;
    }

    try {
      // Use the compressed preview image if available
      if (this.imagePreview) {
        this.medicienForm.patchValue({ AnimalImage: this.imagePreview });
      } else if (this.selectedFile) {
        // Fallback to regular upload if no preview
        const base64Image = await this.uploadImage();
        this.medicienForm.patchValue({ AnimalImage: base64Image });
      }

      if (this.modalMode === 'add') {
        await this.addMedicine();
      } else if (this.modalMode === 'edit') {
        await this.updateMedicine();
      }
    } catch (error) {
      console.error('Image upload error:', error);
      this.toastr.error('Failed to upload image');
    }
  }

  async addMedicine(): Promise<void> {
    this.isSaving = true;

    const payload = {
      user_id: this.dairyUserId,
      Animal_id: this.selectedAnimalId,
      expense_name: 'Medicine',
      animal_name: this.selectedAnimalName,
      price: Number(this.medicienForm.value.price),
      reason: this.medicienForm.value.reason,
      date: this.formatDateForAPI(this.medicienForm.value.date),
      Switch: 1,
      AnimalImage: this.medicienForm.value.AnimalImage // Use correct field name
    };

    this.loader.show();

    this.api.post('DoctorDairy/Save', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isSaving = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Medicine record saved successfully');
          this.closeModal();
          this.loadMedicineHistory();
        },
        error: (error: any) => {
          console.error('Save error:', error);
          this.toastr.error('Failed to save medicine record');
        }
      });
  }

  async updateMedicine(): Promise<void> {
    if (!this.selectedMedicine?.expense_id) {
      this.toastr.error('Invalid medicine data');
      return;
    }

    this.isUpdating = true;

    const payload = {
      expense_id: this.selectedMedicine.expense_id,
      user_id: this.dairyUserId,
      Animal_id: this.selectedAnimalId,
      expense_name: 'Medicine',
      animal_name: this.selectedAnimalName,
      price: Number(this.medicienForm.value.price),
      reason: this.medicienForm.value.reason,
      date: this.formatDateForAPI(this.medicienForm.value.date),
      Switch: 1,
      AnimalImage: this.medicienForm.value.AnimalImage // Use correct field name
    };

    this.loader.show();

    this.api.put('DoctorDairy/Edit', payload)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isUpdating = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Medicine record updated successfully');
          this.closeModal();
          this.loadMedicineHistory();
        },
        error: (error: any) => {
          console.error('Update error:', error);
          this.toastr.error('Failed to update medicine record');
        }
      });
  }

  deleteMedicine(): void {
    if (!this.selectedMedicine?.expense_id) {
      this.toastr.error('Invalid medicine data');
      return;
    }

    this.isDeleting = true;

    this.loader.show();

    this.api.delete(`DoctorDairy/${this.selectedMedicine.expense_id}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isDeleting = false;
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Medicine record deleted successfully');
          this.closeModal();
          this.loadMedicineHistory();
        },
        error: (error: any) => {
          console.error('Delete error:', error);
          this.toastr.error('Failed to delete medicine record');
        }
      });
  }

  getMedicineId(medicine: any): number {
    return medicine.expense_id ?? 0;
  }

  // ==================== SEARCH & FILTER ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();

    if (!search) {
      this.filteredMedicines = [...this.medicines];
      this.groupMedicinesByDate();
      return;
    }

    const dateMatch = this.tryParseDate(search);
    if (dateMatch) {
      this.filteredMedicines = this.medicines.filter(medicine => {
        const medicineDate = this.formatDateDisplay(medicine.date).toLowerCase();
        return medicineDate.includes(dateMatch);
      });
    } else {
      this.filteredMedicines = this.medicines.filter(medicine =>
        medicine.animal_name?.toLowerCase().includes(search) ||
        medicine.reason?.toLowerCase().includes(search)
      );
    }

    // Regroup after filtering
    this.groupMedicinesByDate();
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

  formatDateForView(date: any): string {
    if (!date) return '';

    try {
      const d = new Date(date);

      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }
  // ==================== VIEW MODAL ACTION METHODS ====================
  editFromViewModal(): void {
    if (!this.selectedMedicine) {
      this.toastr.error('No medicine data available');
      return;
    }

    console.log('Editing medicine from view modal:', this.selectedMedicine);

    // Close the view modal
    this.closeViewModal();

    // Open edit modal with the selected medicine
    setTimeout(() => {
      this.openEditModal(this.selectedMedicine);
    }, 300);
  }

  deleteFromViewModal(): void {
    if (!this.selectedMedicine) {
      this.toastr.error('No medicine data available');
      return;
    }

    console.log('Deleting medicine from view modal:', this.selectedMedicine);

    // Close the view modal
    this.closeViewModal();

    // Open delete modal with the selected medicine
    setTimeout(() => {
      this.openDeleteModal(this.selectedMedicine);
    }, 300);
  }

}