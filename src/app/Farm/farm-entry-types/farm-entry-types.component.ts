import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-farm-entry-types',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './farm-entry-types.component.html',
  styleUrl: './farm-entry-types.component.css'
})
export class FarmEntryTypesComponent implements OnInit {
  farmId: number | null = null;
  farmName: string = '';
  farmImage: string = '';
  userId: string = '';
  showMenu = false;
  
  // Farm entry types data
  farmEntryTypes = [
    {
      id: 1,
      title: 'Worker',
      image: '../../../assets/img/farmImages/worker.png',
      route: '/SF/worker',
      isHistory: false
    },
    {
      id: 2,
      title: 'Chemical Fertilizer',
      image: '../../../assets/img/farmImages/chemicalfertilizer.png',
      route: '/SF/chemical-fertilizer',
      isHistory: false
    },
    {
      id: 3,
      title: 'Self Work',
      image: '../../../assets/img/farmImages/selfwork.png',
      route: '/SF/self-work',
      isHistory: false
    },
    {
      id: 4,
      title: 'Farm Profit',
      image: '../../../assets/img/farmImages/farmprofit.png',
      route: '/SF/farm-profit',
      isHistory: false
    },
    {
      id: 5,
      title: 'Report',
      image: '../../../assets/img/farmImages/farmreport.png',
      route: '/SF/report',
      isHistory: false
    },
    {
      id: 6,
      title: 'All History',
      image: '../../../assets/DairryFarmImg/HistoryRecord.png',
      route: '/SF/all-history',  // ✅ FIXED: Added leading slash
      isHistory: true
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFarmData();
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
      farmImage: this.farmImage,
      userId: this.userId
    });
  }

  // Navigate to specific farm entry type or all history
  navigateToEntryType(entryType: any) {
    if (!this.farmId) {
      alert('No farm selected! Please go back and select a farm.');
      this.router.navigate(['/SF/home']);
      return;
    }

    // If it's the "All History" option, navigate to all-history component
    if (entryType.isHistory) {
      const historyData = {
        farmId: this.farmId,
        farmName: this.farmName,
        farmImage: this.farmImage,
        userId: this.userId
      };

      // Store in sessionStorage for persistence
      sessionStorage.setItem('selectedFarm', JSON.stringify(historyData));

      // Navigate to all-history page
      this.router.navigate(['/SF/all-history'], {
        state: { farmData: historyData },
        queryParams: {
          farmId: this.farmId,
          userId: this.userId
        }
      });
      return;
    }

    // For regular entry types, navigate to farmentry page
    const completeData = {
      // Farm data
      farmId: this.farmId,
      farmName: this.farmName,
      farmImage: this.farmImage,
      userId: this.userId,
      // Entry type data
      entryTypeId: entryType.id,
      entryTypeName: entryType.title,
      entryTypeImage: entryType.image,
      entryTypeRoute: entryType.route
    };

    // Store in sessionStorage for persistence
    sessionStorage.setItem('currentFarmEntry', JSON.stringify(completeData));

    // Navigate to farmentry page
    this.router.navigate(['/SF/farmentry'], {
      state: { farmEntryData: completeData },
      queryParams: {
        farmId: this.farmId,
        entryTypeId: entryType.id
      }
    });
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }
  
  navigateToHome() {
    this.router.navigate(['/SF/home']);
  }

  // Navigate back to farms list
  navigateBack() {
    this.router.navigate(['/SF/home']);
  }
}