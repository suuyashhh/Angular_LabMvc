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
  selectedMedicine: any = null;
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

  // Image Upload with Compression
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploadingImage: boolean = false;
  imageError: string = '';
  previewImageUrl: string = '';
  isImagePreviewOpen: boolean = false;
  imageSize: string = '';
  compressingImage: boolean = false;

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

  // ==================== IMAGE UPLOAD METHODS WITH COMPRESSION ====================
  async onImageSelected(event: any): Promise<void> {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    this.compressingImage = true;
    this.imageSize = this.formatFileSize(file.size);

    // Check file type
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
      this.imageError = 'Only JPG, JPEG, and PNG images are allowed';
      this.compressingImage = false;
      return;
    }

    // Check initial size (allow up to 10MB for compression)
    if (file.size > 10 * 1024 * 1024) {
      this.imageError = 'File size must be less than 10MB';
      this.compressingImage = false;
      return;
    }

    try {
      // Show compressing message
      this.imageError = 'Compressing image...';

      // Compress the image
      const compressedFile = await this.compressImageTo1MB(file);

      if (!compressedFile) {
        throw new Error('Compression failed');
      }

      // Read the compressed file
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.imageError = '';
        this.compressingImage = false;

        // Show compressed size
        const compressedSize = this.formatFileSize(compressedFile.size);
        this.imageSize = `${this.formatFileSize(file.size)} → ${compressedSize} (compressed)`;

        // Store the FULL Base64 data URL (with prefix) in the form
        this.medicienForm.patchValue({
          AnimalImage: e.target.result
        });
      };

      reader.onerror = () => {
        this.imageError = 'Failed to read compressed image';
        this.compressingImage = false;
      };

      reader.readAsDataURL(compressedFile);

    } catch (error: any) {
      console.error('Image compression error:', error);
      this.imageError = error.message || 'Failed to compress image';
      this.compressingImage = false;

      // Fallback: use original image if compression fails but size is small
      if (file.size <= 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreview = e.target.result;
          this.imageError = 'Using original image (already under 1MB)';
          // Store the FULL Base64 data URL (with prefix) in the form
          this.medicienForm.patchValue({
            AnimalImage: e.target.result
          });
        };
        reader.readAsDataURL(file);
        this.compressingImage = false;
      }
    }
  }

  // Main compression function - optimized for reliability
  compressImageTo1MB(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e: any) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set maximum dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image with higher quality for resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Function to compress with quality adjustment
        const compressWithQuality = (quality: number): Promise<File> => {
          return new Promise((resolveQuality, rejectQuality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  rejectQuality(new Error('Failed to create blob'));
                  return;
                }

                // Check if size is under 1MB
                if (blob.size <= 1024 * 1024) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolveQuality(compressedFile);
                } else if (quality > 0.3) {
                  // Reduce quality and try again
                  compressWithQuality(quality - 0.1).then(resolveQuality).catch(rejectQuality);
                } else {
                  // If still too large, resize more aggressively
                  if (width > 400 || height > 400) {
                    width = Math.round(width * 0.8);
                    height = Math.round(height * 0.8);
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    compressWithQuality(0.7).then(resolveQuality).catch(rejectQuality);
                  } else {
                    // Last resort: use the smallest possible
                    const finalFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    resolveQuality(finalFile);
                  }
                }
              },
              'image/jpeg',
              quality
            );
          });
        };

        // Start compression with 0.9 quality
        compressWithQuality(0.9).then(resolve).catch(reject);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.imageSize = '';
    this.imageError = '';
    this.medicienForm.patchValue({ AnimalImage: '' });

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
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
    this.selectedMedicine = medicine;
    this.selectedMedicineView = { ...medicine };

    this.viewImageUrl = '';
    this.isLoadingViewImage = true;

    this.showViewModal();

    if (medicine.expense_id) {
      try {
        const imageData = await this.fetchMedicineImageById(medicine.expense_id);

        if (imageData && (imageData.AnimalImage || imageData.animalImage)) {
          const imageUrl = imageData.AnimalImage || imageData.animalImage;

          if (imageUrl.startsWith('data:image') || imageUrl.startsWith('http')) {
            this.viewImageUrl = imageUrl;
          } else if (imageUrl) {
            this.viewImageUrl = 'data:image/jpeg;base64,' + imageUrl;
          }
        } else if (medicine.AnimalImage) {
          const imgUrl = medicine.AnimalImage;
          if (imgUrl.startsWith('data:image') || imgUrl.startsWith('http')) {
            this.viewImageUrl = imgUrl;
          } else if (imgUrl) {
            this.viewImageUrl = 'data:image/jpeg;base64,' + imgUrl;
          }
        } else {
          this.viewImageUrl = '../../../assets/DairryFarmImg/tablet_16443237.png';
        }
      } catch (error) {
        console.error('Error fetching medicine image:', error);
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

        if (this.selectedMedicine && this.viewImageUrl !== '../../../assets/DairryFarmImg/tablet_16443237.png') {
          this.selectedMedicine.AnimalImage = this.viewImageUrl;
        }
      }
    } else {
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

    this.selectedMedicineView = null;
    this.viewImageUrl = '';
    this.isLoadingViewImage = false;
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
    this.imageSize = '';
    this.compressingImage = false;

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
    this.imageSize = '';
    this.compressingImage = false;

    this.medicienForm.patchValue({
      Animal_id: this.selectedAnimalId,
      animal_name: this.selectedAnimalName,
      price: medicine.price,
      reason: medicine.reason,
      date: this.formatDateForInput(medicine.date),
      AnimalImage: medicine.AnimalImage || ''
    });

    this.loader.show();

    this.api.get(`DoctorDairy/GetMedicienImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.AnimalImage || res?.animalImage || medicine.AnimalImage;
          if (image) {
            this.medicienForm.patchValue({ AnimalImage: image });
            this.imagePreview = image;
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

    this.loader.show();

    this.api.get(`DoctorDairy/GetMedicienImageById/${expenseId}`)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res: any) => {
          const image = res?.AnimalImage || res?.animalImage || medicine.AnimalImage;
          if (image) {
            this.medicienForm.patchValue({ AnimalImage: image });
            this.imagePreview = image;
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

    this.selectedFile = null;
    this.imagePreview = null;
    this.imageError = '';
    this.imageSize = '';
    this.compressingImage = false;
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

    // Image is already compressed and stored in form
    const medicineImageBase64 = this.medicienForm.value.AnimalImage;

    if (this.modalMode === 'add') {
      this.addMedicine(medicineImageBase64);
    } else if (this.modalMode === 'edit') {
      this.updateMedicine(medicineImageBase64);
    }
  }

  addMedicine(imageBase64: string | null): void {
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
      AnimalImage: imageBase64 || ''
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

  updateMedicine(imageBase64: string | null): void {
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
      AnimalImage: imageBase64 || ''
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

    this.closeViewModal();

    setTimeout(() => {
      this.openEditModal(this.selectedMedicine);
    }, 300);
  }

  deleteFromViewModal(): void {
    if (!this.selectedMedicine) {
      this.toastr.error('No medicine data available');
      return;
    }

    this.closeViewModal();

    setTimeout(() => {
      this.openDeleteModal(this.selectedMedicine);
    }, 300);
  }
}