import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-check-breeding-dates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './check-breeding-dates.component.html',
  styleUrls: ['./check-breeding-dates.component.css']
})
export class CheckBreedingDatesComponent implements OnInit, OnDestroy {
  // Page states
  currentPage: 'list' | 'detail' = 'list';

  // Animals list data
  animals: any[] = [];
  filteredAnimals: any[] = [];
  searchTerm: string = '';

  // Animal detail data
  selectedAnimal: any = null;
  breedingHistory: any[] = [];
  groupedHistory: Map<string, any[]> = new Map();

  // Filter options
  statusFilter: string = 'all';

  // Loading states
  isLoading: boolean = false;
  isLoadingHistory: boolean = false;
  userId: number = 0;

  @ViewChild('imagePreviewModal') imagePreviewModal!: ElementRef;

  previewImageUrl: string = '';


  constructor(
    private api: ApiService,
    private toastr: ToastrService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    if (!this.auth.isDairyLoggedIn()) {
      this.router.navigate(['/dairyfarm']);
      return;
    }

    this.userId = this.getUserId();

    // Check if we're coming with animal_id parameter
    this.route.queryParams.subscribe(params => {
      const animalId = params['animal_id'];
      const animalName = params['animal_name'];

      if (animalId && animalName) {
        this.loadAnimalBreedingDetail(parseInt(animalId), animalName);
      } else {
        this.loadAnimals();
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private getUserId(): number {
    const dairy = this.auth.getDairyCredentialsFromCookie();
    if (!dairy) return 0;
    const id = dairy.user_id ?? dairy.userId ?? dairy.UserId ?? dairy.id;
    return Number(id) || 0;
  }

  // ==================== LOAD ANIMALS LIST ====================
  loadAnimals(): void {
    if (!this.userId) {
      this.toastr.warning('Please login to Dairy Farm');
      return;
    }

    this.isLoading = true;
    this.loader.show();
    this.currentPage = 'list';

    this.api.get(`BreedingDateCheck/animals/${this.userId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoading = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.animals = Array.isArray(response) ? response : [];
          this.filteredAnimals = [...this.animals];
        },
        error: (error: any) => {
          console.error('Failed to load animals:', error);
          this.toastr.error('Failed to load animals');
          this.animals = [];
          this.filteredAnimals = [];
        }
      });
  }

  // ==================== LOAD ANIMAL BREEDING DETAIL ====================
  loadAnimalBreedingDetail(animalId: number, animalName: string, animalImage?: string): void {

    if (!this.userId || !animalId) {
      this.toastr.warning('Invalid animal selection');
      this.loadAnimals();
      return;
    }

    this.isLoadingHistory = true;
    this.loader.show();
    this.currentPage = 'detail';

    // Set selected animal
    this.selectedAnimal = {
      animalId: animalId,
      animalName: decodeURIComponent(animalName),
      animalImage: animalImage || null
    };


    this.api.get(`BreedingDateCheck/history/${this.userId}/${animalId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoadingHistory = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.breedingHistory = Array.isArray(response) ? response : [];
          this.groupHistoryByMonth();
        },
        error: (error: any) => {
          console.error('Failed to load breeding history:', error);
          this.toastr.error('Failed to load breeding history');
          this.breedingHistory = [];
          this.groupedHistory.clear();
        }
      });
  }

  // ==================== NAVIGATION METHODS ====================
  viewAnimalBreedingHistory(animal: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        animal_id: animal.animalId,
        animal_name: encodeURIComponent(animal.animalName),
        animal_image: encodeURIComponent(animal.animalImage || '')
      },
      queryParamsHandling: 'merge'
    }).then(() => {
      this.loadAnimalBreedingDetail(animal.animalId, animal.animalName, animal.animalImage);
    });
  }


  goBackToList(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    }).then(() => {
      this.loadAnimals();
    });
  }

  // ==================== SEARCH & FILTER FUNCTIONALITY ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();

    if (!search) {
      this.filteredAnimals = [...this.animals];
      return;
    }

    this.filteredAnimals = this.animals.filter(animal =>
      animal.animalName.toLowerCase().includes(search) ||
      animal.lastBreedingReason?.toLowerCase().includes(search) ||
      animal.status?.toLowerCase().includes(search)
    );
  }

  onStatusFilter(): void {
    if (this.statusFilter === 'all') {
      this.filteredAnimals = [...this.animals];
      return;
    }

    this.filteredAnimals = this.animals.filter(animal =>
      animal.status === this.statusFilter
    );
  }

  // ==================== GROUP HISTORY BY MONTH ====================
  groupHistoryByMonth(): void {
    this.groupedHistory.clear();

    this.breedingHistory.forEach(record => {
      const monthYear = record.monthYear || this.getMonthYear(record.breedingDate);
      if (!this.groupedHistory.has(monthYear)) {
        this.groupedHistory.set(monthYear, []);
      }
      this.groupedHistory.get(monthYear)!.push(record);
    });
  }

  getMonthYear(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'Unknown Date';
    }
  }

  // ==================== FORMATTING METHODS ====================
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatLastBreedingDate(dateString: string): string {
    if (!dateString) return 'No breeding records';

    try {
      const from = new Date(dateString);
      const to = new Date();

      let years = to.getFullYear() - from.getFullYear();
      let months = to.getMonth() - from.getMonth();
      let days = to.getDate() - from.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0).getDate();
        days += prevMonth;
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} ago`;
      }

      if (months > 0) {
        return `${months} month${months > 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''} ago`;
      }

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';

      return `${days} days ago`;
    } catch {
      return dateString;
    }
  }


  getStatusBadgeColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'Recent': 'bg-green-100 text-green-800 border-green-200',
      'Ongoing': 'bg-blue-100 text-blue-800 border-blue-200',
      'Overdue': 'bg-red-100 text-red-800 border-red-200',
      'No Records': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'Recent': 'ri-checkbox-circle-line text-green-600',
      'Ongoing': 'ri-time-line text-blue-600',
      'Overdue': 'ri-alarm-warning-line text-red-600',
      'No Records': 'ri-information-line text-gray-600'
    };
    return iconMap[status] || 'ri-information-line text-gray-600';
  }

  getRecordStatusBadge(daysSinceBreeding: number): string {
    if (daysSinceBreeding <= 30) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (daysSinceBreeding <= 90) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  }

  getDaysSinceText(daysSinceBreeding: number): string {
    if (daysSinceBreeding === 0) return 'Today';
    if (daysSinceBreeding === 1) return 'Yesterday';
    return `${daysSinceBreeding} days ago`;
  }

  // ==================== GETTERS ====================
  get totalAnimals(): number {
    return this.animals.length;
  }

  get totalBreedingRecords(): number {
    return this.breedingHistory.length;
  }

  get animalsWithRecentBreeding(): number {
    return this.animals.filter(a => a.status === 'Recent').length;
  }

  get animalsOverdue(): number {
    return this.animals.filter(a => a.status === 'Overdue').length;
  }
  get animalsOngoing(): number {
    return this.animals.filter(a => a.status === 'Ongoing').length;
  }

  openImagePreviewWithUrl(imageUrl: string | null): void {
    this.previewImageUrl = imageUrl || '../../../assets/DairryFarmImg/Breedingdate.png';
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

  onAnimalImageError(animal: any): void {
    animal.animalImage = '../../../assets/DairryFarmImg/Breedingdate.png';
  }

}