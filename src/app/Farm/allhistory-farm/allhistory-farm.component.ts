import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../services/loader.service';

interface FarmEntry {
  farM_ENTRY_ID: number;
  entrY_TYPE: string;
  reason: string;
  price: number;
  farM_ID: number;
  useR_ID: number;
  imagE1?: string;
  imagE2?: string;
  imagE3?: string;
  imagE4?: string;
  date: string;
}

@Component({
  selector: 'app-all-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './allhistory-farm.component.html',
  styleUrl: './allhistory-farm.component.css'
})
export class AllHistoryComponent implements OnInit, OnDestroy {
  // Farm data
  farmId: number | null = null;
  farmName: string = '';
  farmImage: string = '';
  userId: string = '';

  // UI state
  showMenu = false;
  showViewModal = false;
  searchQuery = '';
  
  // Entries data
  entries: FarmEntry[] = [];
  filteredEntries: FarmEntry[] = [];
  groupedEntries: { date: string; count: number; entries: FarmEntry[] }[] = [];
  
  // Selected entry for view
  selectedEntry: FarmEntry | null = null;
  viewImages: string[] = [];
  
  // Image preview
  showImagePreview = false;
  previewImageUrl: string = '';
  currentImageIndex = 0;
  
  totalAmount = 0;
  
  private isBrowser: boolean;

  // Entry type images mapping
  private entryTypeImages: { [key: string]: string } = {
    'Worker': '../../../assets/img/farmImages/worker.png',
    'Chemical Fertilizer': '../../../assets/img/farmImages/chemicalfertilizer.png',
    'Self Work': '../../../assets/img/farmImages/selfwork.png',
    'Farm Profit': '../../../assets/img/farmImages/farmprofit.png'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private toastr: ToastrService,
    public loader: LoaderService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.loadFarmData();
    this.loadAllEntries();
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  private loadFarmData() {
    // Priority 1: Try to get from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const farmData = navigation.extras.state['farmData'];
      if (farmData) {
        this.setFarmData(farmData);
        return;
      }
    }

    // Priority 2: Try to get from sessionStorage
    const savedFarm = sessionStorage.getItem('selectedFarm');
    if (savedFarm) {
      try {
        const farmData = JSON.parse(savedFarm);
        this.setFarmData(farmData);
        return;
      } catch (error) {
        console.error('Error parsing saved farm data:', error);
      }
    }

    // Priority 3: Try to get from query parameters
    this.route.queryParams.subscribe(params => {
      if (params['farmId']) {
        this.farmId = Number(params['farmId']);
        this.farmName = params['farmName'] || '';
        this.userId = params['userId'] || '';
        console.log('Loaded farm data from query params');
      }
    });
  }

  private setFarmData(farmData: any) {
    this.farmId = farmData.farmId;
    this.farmName = farmData.farmName;
    this.farmImage = farmData.farmImage || '';
    this.userId = farmData.userId || '';
    
    console.log('Farm Data Loaded:', {
      farmId: this.farmId,
      farmName: this.farmName,
      userId: this.userId
    });
  }

  loadAllEntries() {
    if (!this.farmId || !this.userId) {
      console.warn('Farm ID or User ID not available');
      return;
    }

    this.loader.show();
    
    this.api.get('FarmEntry/GetAllTypesEntrys', { 
      farmId: this.farmId, 
      userId: this.userId
    }).subscribe({
      next: (res: any) => {
        this.entries = Array.isArray(res) ? res : [];
        // Sort by date descending (newest first)
        this.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.filteredEntries = [...this.entries];
        this.groupEntriesByDate();
        this.calculateTotal();
        this.loader.hide();
      },
      error: (err) => {
        console.error('Error loading entries:', err);
        this.toastr.error('Failed to load entries');
        this.loader.hide();
      }
    });
  }

  groupEntriesByDate() {
    const grouped = new Map<string, FarmEntry[]>();
    
    this.filteredEntries.forEach(entry => {
      const dateKey = this.formatDate(entry.date);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    });

    // Convert to array and maintain descending order
    this.groupedEntries = Array.from(grouped.entries()).map(([date, entries]) => ({
      date,
      count: entries.length,
      entries
    }));
  }

  calculateTotal() {
    this.totalAmount = this.filteredEntries.reduce((sum, entry) => {
      // Add for income types, subtract for expense types
      if (this.isIncomeEntry(entry.entrY_TYPE)) {
        return sum + entry.price;
      } else {
        return sum - entry.price;
      }
    }, 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  searchEntries() {
    if (!this.searchQuery.trim()) {
      this.filteredEntries = [...this.entries];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredEntries = this.entries.filter(entry => {
        const dateFormatted = this.formatDate(entry.date).toLowerCase();
        const dateOriginal = entry.date.toLowerCase();
        
        return entry.reason.toLowerCase().includes(query) ||
               entry.entrY_TYPE.toLowerCase().includes(query) ||
               dateFormatted.includes(query) ||
               dateOriginal.includes(query);
      });
    }
    this.groupEntriesByDate();
    this.calculateTotal();
  }

  // Get entry type image
  getEntryTypeImage(entryType: string): string {
    return this.entryTypeImages[entryType] || '';
  }

  // ============= VIEW MODAL =============
  viewEntry(entry: FarmEntry) {
    this.selectedEntry = entry;
    this.loadViewImages();
    this.showViewModal = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedEntry = null;
    this.viewImages = [];
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  private loadViewImages() {
    if (!this.selectedEntry) return;
    
    const img1 = this.selectedEntry.imagE1 || '';
    const img2 = this.selectedEntry.imagE2 || '';
    const img3 = this.selectedEntry.imagE3 || '';
    const img4 = this.selectedEntry.imagE4 || '';
    
    this.viewImages = [img1, img2, img3, img4].filter(img => img && img.trim() !== '');
  }

  // ============= IMAGE PREVIEW =============
  openImagePreview(imageUrl: string, index: number) {
    this.previewImageUrl = imageUrl;
    this.currentImageIndex = index;
    this.showImagePreview = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeImagePreview() {
    this.showImagePreview = false;
    this.previewImageUrl = '';
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.viewImages.length - 1) {
      this.currentImageIndex++;
      this.previewImageUrl = this.viewImages[this.currentImageIndex];
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.previewImageUrl = this.viewImages[this.currentImageIndex];
    }
  }

  // ============= NAVIGATION =============
  navigateBack() {
    this.router.navigate(['/SF/farmentrytypes']);
  }

  navigateToHome() {
    this.router.navigate(['/SF/home']);
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }
  
  isIncomeEntry(entryType: string): boolean {
    const incomeTypes = ['Self Work', 'Farm Profit'];
    return incomeTypes.includes(entryType);
  }
}