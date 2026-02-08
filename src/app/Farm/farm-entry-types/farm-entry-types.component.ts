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
  
  // Farm entry types data
  farmEntryTypes = [
    {
      id: 1,
      title: 'Worker',
      image: '../../../assets/img/farmImages/worker.png',
      route: '/SF/worker'
    },
    {
      id: 2,
      title: 'Chemical Fertilizer',
      image: '../../../assets/img/farmImages/chemicalfertilizer.png',
      route: '/SF/chemical-fertilizer'
    },
    {
      id: 3,
      title: 'Self Work',
      image: '../../../assets/img/farmImages/selfwork.png',
      route: '/SF/self-work'
    },
    {
      id: 4,
      title: 'Farm Profit',
      image: '../../../assets/img/farmImages/farmprofit.png',
      route: '/SF/farm-profit'
    },
    {
      id: 5,
      title: 'Report',
      image: '../../../assets/img/farmImages/farmreport.png',
      route: '/SF/report'
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
        // Note: farmImage and userId won't be in query params, 
        // so this is a fallback only
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

// Navigate to specific farm entry type
navigateToEntryType(entryType: any) {
  if (!this.farmId) {
    alert('No farm selected! Please go back and select a farm.');
    this.router.navigate(['/SF/home']);
    return;
  }

  // Prepare complete data to pass to the farm entry page
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

  // Navigate back to farms list
  navigateBack() {
    this.router.navigate(['/SF/home']);
  }
}