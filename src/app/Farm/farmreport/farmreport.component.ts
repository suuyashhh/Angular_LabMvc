import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/api.service'; // ✅ Import ApiService
import { catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface ReportData {
  selfWork_Total: number;
  farmProfit_Total: number;
  chemicalFertilizer_Total: number;
  worker_Total: number;
}

interface ExpenseItem {
  name: string;
  amount: number;
  color: string;
  icon: string;
  type: string;
}

@Component({
  selector: 'app-farmreport',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farmreport.component.html',
  styleUrl: './farmreport.component.css'
})
export class FarmreportComponent implements OnInit {
  // Farm data
  farmId: number | null = null;
  userId: number | null = null;
  farmName: string = '';
  farmImage: string = '';
  
  // Report data
  reportData: ReportData | null = null;
  isLoading: boolean = false;
  error: string = '';
  
  // Calculated values
  totalExpenses: number = 0;
  netProfit: number = 0;
  
  // Expense breakdown
  expenseItems: ExpenseItem[] = [];
  
  // Menu state
  showMenu: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService // ✅ Use ApiService instead of HttpClient
  ) {}

  ngOnInit() {
    this.loadFarmData();
  }

  private loadFarmData() {
    // Priority 1: Navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const farmData = navigation.extras.state['farmData'];
      if (farmData) {
        this.setFarmData(farmData);
        this.fetchReportData();
        return;
      }
    }

    // Priority 2: SessionStorage
    const savedFarm = sessionStorage.getItem('selectedFarm');
    if (savedFarm) {
      try {
        const farmData = JSON.parse(savedFarm);
        this.setFarmData(farmData);
        this.fetchReportData();
        return;
      } catch (error) {
        console.error('Error parsing saved farm data:', error);
      }
    }

    // Priority 3: Query parameters
    this.route.queryParams.subscribe(params => {
      if (params['farmId']) {
        this.farmId = Number(params['farmId']);
        this.userId = params['userId'] ? Number(params['userId']) : null;
        this.farmName = params['farmName'] || '';
        this.farmImage = params['farmImage'] || '';
        
        console.log('📊 Loaded farm data:', {
          farmId: this.farmId,
          userId: this.userId,
          farmName: this.farmName
        });
        
        this.fetchReportData();
      } else {
        this.error = 'No farm data found. Please select a farm first.';
        this.isLoading = false;
      }
    });
  }

  private setFarmData(farmData: any) {
    this.farmId = farmData.farmId;
    this.farmName = farmData.farmName;
    this.farmImage = farmData.farmImage || '';
    this.userId = farmData.userId ? Number(farmData.userId) : null;
    
    console.log('✅ Farm Data Loaded:', {
      farmId: this.farmId,
      userId: this.userId,
      farmName: this.farmName
    });
  }

  private fetchReportData() {
    // Validate required parameters
    if (!this.farmId) {
      this.error = 'Farm ID is required';
      this.isLoading = false;
      return;
    }

    if (!this.userId) {
      this.error = 'User ID is required';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = '';

    // ✅ CORRECT URL CONSTRUCTION WITH ApiService
    // ApiService baseurl = 'https://localhost:7193/api/'
    // So api.get('FarmEntry/GetReportCalculation') will call:
    // https://localhost:7193/api/FarmEntry/GetReportCalculation?farmId=X&userId=Y
    
    const params = {
      farmId: this.farmId.toString(),
      userId: this.userId.toString()
    };

    console.log('🔄 Fetching report from API:', 'FarmEntry/GetReportCalculation', params);

    this.api.get('FarmEntry/GetReportCalculation', params).pipe(
      catchError((error) => {
        console.error('❌ API Error:', error);
        
        // Detailed error handling
        if (error.status === 0) {
          this.error = 'Unable to connect to server. Please check if backend is running at https://localhost:7193';
        } else if (error.status === 404) {
          this.error = 'API endpoint not found: FarmEntry/GetReportCalculation';
        } else if (error.status === 400) {
          this.error = 'Invalid parameters. Farm ID and User ID are required.';
        } else {
          this.error = error.error?.message || error.message || 'Failed to load report data';
        }
        
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data: any) => {
        console.log('✅ Report data received:', data);
        this.reportData = data;
        this.calculateTotals();
        this.prepareExpenseBreakdown();
      }
    });
  }

  private calculateTotals() {
    if (!this.reportData) return;

    // Calculate total expenses (sum of all costs)
    this.totalExpenses = 
      (this.reportData.worker_Total || 0) +
      (this.reportData.chemicalFertilizer_Total || 0) +
      (this.reportData.selfWork_Total || 0);

    // Calculate net profit (Farm Profit - Total Expenses)
    this.netProfit = (this.reportData.farmProfit_Total || 0) - this.totalExpenses;
    
    console.log('💰 Calculations:', {
      worker: this.reportData.worker_Total,
      fertilizer: this.reportData.chemicalFertilizer_Total,
      selfWork: this.reportData.selfWork_Total,
      totalExpenses: this.totalExpenses,
      farmProfit: this.reportData.farmProfit_Total,
      netProfit: this.netProfit
    });
  }

  private prepareExpenseBreakdown() {
    if (!this.reportData) return;

    this.expenseItems = [
      {
        name: 'Worker',
        amount: this.reportData.worker_Total || 0,
        color: '#ef4444',
        icon: 'ri-user-line',
        type: 'expense'
      },
      {
        name: 'Chemical Fertilizer',
        amount: this.reportData.chemicalFertilizer_Total || 0,
        color: '#f59e0b',
        icon: 'ri-flask-line',
        type: 'expense'
      },
      {
        name: 'Self Work',
        amount: this.reportData.selfWork_Total || 0,
        color: '#10b981',
        icon: 'ri-hand-heart-line',
        type: 'expense'
      }
    ];
  }

  getExpensePercentage(amount: number): number {
    if (this.totalExpenses === 0) return 0;
    return Number(((amount / this.totalExpenses) * 100).toFixed(1));
  }

  getProfitMargin(): number {
    if (!this.reportData?.farmProfit_Total || this.reportData.farmProfit_Total === 0) return 0;
    return Number(((this.netProfit / this.reportData.farmProfit_Total) * 100).toFixed(1));
  }

  getROI(): number {
    if (this.totalExpenses === 0) return 0;
    return Number(((this.netProfit / this.totalExpenses) * 100).toFixed(1));
  }

  // ============= UI ACTIONS =============
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }

  navigateBack() {
    const farmData = {
      farmId: this.farmId,
      farmName: this.farmName,
      farmImage: this.farmImage,
      userId: this.userId
    };
    
    sessionStorage.setItem('selectedFarm', JSON.stringify(farmData));
    
    this.router.navigate(['/SF/farm-entry-types'], {
      state: { farmData },
      queryParams: { 
        farmId: this.farmId,
        userId: this.userId 
      }
    });
  }

  navigateToHome() {
    this.router.navigate(['/SF/home']);
  }

  refreshReport() {
    this.fetchReportData();
  }

  printReport() {
    window.print();
  }

  exportReport() {
    if (!this.reportData) return;
    
    // Create CSV data
    const csvData = [
      ['Report Type', 'Amount (₹)'],
      ['Worker Expenses', this.reportData.worker_Total],
      ['Chemical Fertilizer', this.reportData.chemicalFertilizer_Total],
      ['Self Work', this.reportData.selfWork_Total],
      ['Total Expenses', this.totalExpenses],
      ['Farm Profit (Revenue)', this.reportData.farmProfit_Total],
      ['Net Profit/Loss', this.netProfit],
      ['Profit Margin', this.getProfitMargin() + '%'],
      ['ROI', this.getROI() + '%']
    ];
    
    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Farm_Report_${this.farmName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}