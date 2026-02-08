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
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  date: string;
}

@Component({
  selector: 'app-farmentry',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './farmentry.component.html',
  styleUrl: './farmentry.component.css'
})
export class FarmentryComponent implements OnInit, OnDestroy {
  // Farm data
  farmId: number | null = null;
  farmName: string = '';
  farmImage: string = '';
  userId: string = '';

  // Entry type data
  entryTypeId: number | null = null;
  entryTypeName: string = '';
  entryTypeImage: string = '';
  entryTypeRoute: string = '';

  // UI state
  showMenu = false;
  showModal = false;
  searchQuery = '';
  
  // Entries data
  entries: FarmEntry[] = [];
  filteredEntries: FarmEntry[] = [];
  groupedEntries: { date: string; count: number; entries: FarmEntry[] }[] = [];
  
  // Form data
  formData = {
    reason: '',
    price: 0,
    date: new Date().toISOString().split('T')[0]
  };
  
  selectedFiles: File[] = [];
  previewImages: string[] = [];
  totalAmount = 0;
  
  private isBrowser: boolean;

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
    this.loadFarmEntryData();
    this.loadEntries();
  }

  ngOnDestroy() {
    // Optional: Clear data when leaving
  }

  private loadFarmEntryData() {
    // Priority 1: Try to get from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const farmEntryData = navigation.extras.state['farmEntryData'];
      if (farmEntryData) {
        this.setFarmEntryData(farmEntryData);
        return;
      }
    }

    // Priority 2: Try to get from sessionStorage
    const savedData = sessionStorage.getItem('currentFarmEntry');
    if (savedData) {
      try {
        const farmEntryData = JSON.parse(savedData);
        this.setFarmEntryData(farmEntryData);
        return;
      } catch (error) {
        console.error('Error parsing saved farm entry data:', error);
      }
    }

    // Priority 3: Try to get from query parameters (partial data)
    this.route.queryParams.subscribe(params => {
      if (params['farmId']) {
        this.farmId = Number(params['farmId']);
        this.entryTypeId = Number(params['entryTypeId']) || null;
        console.log('Loaded partial data from query params');
      }
    });
  }

  private setFarmEntryData(data: any) {
    // Farm data
    this.farmId = data.farmId;
    this.farmName = data.farmName;
    this.farmImage = data.farmImage || '';
    this.userId = data.userId || '';

    // Entry type data
    this.entryTypeId = data.entryTypeId;
    this.entryTypeName = data.entryTypeName;
    this.entryTypeImage = data.entryTypeImage || '';
    this.entryTypeRoute = data.entryTypeRoute || '';

    console.log('Farm Entry Data Loaded:', {
      farmId: this.farmId,
      farmName: this.farmName,
      entryTypeId: this.entryTypeId,
      entryTypeName: this.entryTypeName
    });
  }

  loadEntries() {
    if (!this.farmId || !this.userId) {
      console.warn('Farm ID or User ID not available');
      return;
    }

    this.loader.show();
    
    this.api.get('FarmEntry/GetAll', { 
      farmId: this.farmId, 
      userId: this.userId 
    }).subscribe({
      next: (res: any) => {
        this.entries = Array.isArray(res) ? res : [];
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

    this.groupedEntries = Array.from(grouped.entries()).map(([date, entries]) => ({
      date,
      count: entries.length,
      entries
    }));
  }

  calculateTotal() {
    this.totalAmount = this.filteredEntries.reduce((sum, entry) => sum + entry.price, 0);
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
      this.filteredEntries = this.entries.filter(entry => 
        entry.reason.toLowerCase().includes(query) ||
        entry.entrY_TYPE.toLowerCase().includes(query)
      );
    }
    this.groupEntriesByDate();
    this.calculateTotal();
  }

  openAddModal() {
    this.showModal = true;
    this.resetForm();
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      reason: '',
      price: 0,
      date: new Date().toISOString().split('T')[0]
    };
    this.selectedFiles = [];
    this.previewImages = [];
    
    if (this.isBrowser) {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    if (this.selectedFiles.length + files.length > 4) {
      this.toastr.warning('Maximum 4 images allowed');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Only image files are allowed');
        return;
      }

      this.selectedFiles.push(file);
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewImages.splice(index, 1);
  }

  async saveEntry() {
    if (!this.formData.reason.trim()) {
      this.toastr.error('Please enter a reason');
      return;
    }

    if (this.formData.price <= 0) {
      this.toastr.error('Please enter a valid price');
      return;
    }

    try {
      this.loader.show();
      
      let imagePaths = ['', '', '', ''];
      
      // Upload images
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const formData = new FormData();
        formData.append('file', this.selectedFiles[i]);
        
        const uploadResult: any = await this.api.upload('FileUpload/Upload', formData).toPromise();
        
        if (uploadResult && uploadResult.success) {
          imagePaths[i] = uploadResult.filePath;
        }
      }
      
      // Save entry
      const payload = {
        entrY_TYPE: this.entryTypeName,
        reason: this.formData.reason.trim(),
        price: this.formData.price,
        farM_ID: this.farmId,
        useR_ID: Number(this.userId),
        image1: imagePaths[0],
        image2: imagePaths[1],
        image3: imagePaths[2],
        image4: imagePaths[3],
        date: this.formData.date
      };
      
      const result: any = await this.api.post('FarmEntry/Insert', payload).toPromise();
      
      if (result.success) {
        this.toastr.success('Entry added successfully');
        this.closeModal();
        this.loadEntries();
      } else {
        this.toastr.error(result.message || 'Failed to add entry');
        this.loader.hide();
      }
      
    } catch (error: any) {
      console.error('Save error:', error);
      this.toastr.error(error?.error?.message || error?.message || 'Error saving entry');
      this.loader.hide();
    }
  }

  viewEntry(entry: FarmEntry) {
    // Store entry data for the detail page
    const entryData = {
      ...entry,
      farmId: this.farmId,
      farmName: this.farmName,
      farmImage: this.farmImage,
      userId: this.userId,
      entryTypeName: this.entryTypeName,
      entryTypeImage: this.entryTypeImage
    };
    
    sessionStorage.setItem('currentEntryDetail', JSON.stringify(entryData));
    
    this.router.navigate(['/SF/showentry'], {
      state: { entryData: entryData },
      queryParams: {
        farmEntryId: entry.farM_ENTRY_ID,
        farmId: this.farmId
      }
    });
  }

  // Navigation methods
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
}