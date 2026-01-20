import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

import { ApiService } from '../../shared/api.service';
import { AuthService } from '../../shared/auth.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-check-animal-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './check-animal-history.component.html',
  styleUrls: ['./check-animal-history.component.css']
})
export class CheckAnimalHistoryComponent implements OnInit, OnDestroy {
  // Page states
  currentPage: 'list' | 'detail' = 'list';
  
  // Animals list data
  animals: any[] = [];
  filteredAnimals: any[] = [];
  searchTerm: string = '';
  
  // Animal detail data
  selectedAnimal: any = null;
  healthHistory: any[] = [];
  groupedHistory: Map<string, any[]> = new Map();
  
  // Loading states
  isLoading: boolean = false;
  isLoadingHistory: boolean = false;
  userId: number = 0;

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
        this.loadAnimalDetail(parseInt(animalId), animalName);
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

    this.api.get(`AnimalHealthHistory/animals/${this.userId}`)
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

  // ==================== LOAD ANIMAL DETAIL ====================
  loadAnimalDetail(animalId: number, animalName: string): void {
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
      animalName: decodeURIComponent(animalName)
    };

    this.api.get(`AnimalHealthHistory/history/${this.userId}/${animalId}`)
      .pipe(finalize(() => {
        this.loader.hide();
        this.isLoadingHistory = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.healthHistory = Array.isArray(response) ? response : [];
          this.groupHistoryByMonth();
        },
        error: (error: any) => {
          console.error('Failed to load health history:', error);
          this.toastr.error('Failed to load health history');
          this.healthHistory = [];
          this.groupedHistory.clear();
        }
      });
  }

  // ==================== NAVIGATION METHODS ====================
  viewAnimalHistory(animal: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        animal_id: animal.animalId,
        animal_name: encodeURIComponent(animal.animalName)
      },
      queryParamsHandling: 'merge'
    }).then(() => {
      this.loadAnimalDetail(animal.animalId, animal.animalName);
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

  // ==================== SEARCH FUNCTIONALITY ====================
  onSearch(): void {
    const search = this.searchTerm.toLowerCase().trim();
    
    if (!search) {
      this.filteredAnimals = [...this.animals];
      return;
    }

    this.filteredAnimals = this.animals.filter(animal =>
      animal.animalName.toLowerCase().includes(search)
    );
  }

  // ==================== GROUP HISTORY BY MONTH ====================
  groupHistoryByMonth(): void {
    this.groupedHistory.clear();
    
    this.healthHistory.forEach(record => {
      const monthYear = record.monthYear || this.getMonthYear(record.recordDate);
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

  formatPrice(price: number): string {
    return `₹ ${price.toLocaleString('en-IN')}`;
  }

  getRecordTypeIcon(recordType: string): string {
    const iconMap: { [key: string]: string } = {
      'Medicine': 'ri-medicine-bottle-line',
      'Doctor': 'ri-stethoscope-line'
    };
    return iconMap[recordType] || 'ri-file-list-line';
  }

  getRecordTypeColor(recordType: string): string {
    const colorMap: { [key: string]: string } = {
      'Medicine': 'text-purple-600',
      'Doctor': 'text-red-600'
    };
    return colorMap[recordType] || 'text-gray-600';
  }

  getRecordTypeBadge(recordType: string): string {
    const badgeMap: { [key: string]: string } = {
      'Medicine': 'bg-purple-100 text-purple-800 border-purple-200',
      'Doctor': 'bg-red-100 text-red-800 border-red-200'
    };
    return badgeMap[recordType] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  // ==================== GETTERS ====================
  get totalAnimals(): number {
    return this.animals.length;
  }

  get totalHealthRecords(): number {
    return this.healthHistory.length;
  }

  get totalExpenses(): number {
    return this.healthHistory.reduce((sum, record) => sum + (record.price || 0), 0);
  }
}