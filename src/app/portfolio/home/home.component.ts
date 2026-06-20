import { Component, OnInit, AfterViewChecked, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewChecked, AfterViewInit {
  weeks: any[][] = [];
  totalContributions = 0;
  isLoading = true;
  hasError = false;
  
  // Tooltip properties
  hoveredDay: any = null;
  tooltipX = 0;
  tooltipY = 0;

  // Image preview modal properties
  showImagePreview = false;
  previewImage = '';
  previewProjectTitle = '';
  currentPreviewProjectId = '';
  currentImageIndex: { [key: string]: number } = {};

  projects: any[] = [
    {
      id: 'laboratory',
      title: 'Laboratory - App',
      description: 'Manage laboratory operations efficiently with our comprehensive solution.',
      images: [
        '../../../assets/img/LabApplication/LabApp2.png',
        '../../../assets/img/LabApplication/LabApp1.png',
        '../../../assets/img/LabApplication/LapApp3.png',
        '../../../assets/img/LabApplication/LabApp4.png'
      ],
      tech: ['Angular', 'Tailwind CSS', 'Typescript', 'SQL', '.Net Core', 'Android Studio'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://suyashpatil.in/lab'
      }
    },
    {
      id: 'dairy',
      title: 'DairyFarm - App',
      description: 'Manage your dairy farm operations efficiently with our comprehensive solution.',
      images: [
        '../../../assets/img/DairFarm/DF1.png',
        '../../../assets/img/DairFarm/DF2.png',
        '../../../assets/img/DairFarm/DF3.png',
        '../../../assets/img/DairFarm/DF4.png'
      ],
      tech: ['Angular', '.Net Core Web Api', 'SQL', 'Android Studio'],
      links: {
        code: 'https://github.com/suuyashhh',
        demo: 'https://suyashpatil.in/dairyfarm'
      }
    }
  ];

  private hasScrolledToEnd = false;

  constructor() {
    this.projects.forEach(project => {
      this.currentImageIndex[project.id] = 0;
    });
  }

  ngOnInit() {
    this.fetchContributions();

    // Keyboard navigation for image preview
    document.addEventListener('keydown', (e) => {
      if (this.showImagePreview && e.key === 'Escape') {
        this.closeImagePreview();
      }
    });
  }
  showTooltip(day: any, event: MouseEvent) {
    this.hoveredDay = day;
    const container = document.getElementById('contrib-card-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = (event.target as HTMLElement).getBoundingClientRect();
      
      this.tooltipX = targetRect.left - containerRect.left + (targetRect.width / 2);
      this.tooltipY = targetRect.top - containerRect.top - 6;
    }
  }

  hideTooltip() {
    this.hoveredDay = null;
  }

  ngAfterViewChecked() {
    // Auto-scroll contribution grid to the right (most recent contributions)
    if (!this.isLoading && !this.hasError && !this.hasScrolledToEnd) {
      const container = document.getElementById('contrib-grid-viewport');
      if (container) {
        container.scrollLeft = container.scrollWidth;
        this.hasScrolledToEnd = true;
      }
    }
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          // Unobserve after animating once to keep it clean and performant
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    // Query both direct reveals and lists that might contain staggered reveals
    const targets = document.querySelectorAll('.scroll-reveal');
    targets.forEach(target => observer.observe(target));
  }

  fetchContributions() {
    fetch('https://github-contributions-api.jogruber.de/v4/suuyashhh')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: any) => {
        // Compute total contributions
        if (data.total) {
          let sum = 0;
          for (const key in data.total) {
            if (Object.prototype.hasOwnProperty.call(data.total, key)) {
              sum += Number(data.total[key]) || 0;
            }
          }
          this.totalContributions = sum;
        }

        let rawContributions = data.contributions || [];
        
        // Filter out future dates (since the API returns placeholders for the entire current year)
        const today = new Date();
        const yToday = today.getFullYear();
        const mToday = String(today.getMonth() + 1).padStart(2, '0');
        const dToday = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yToday}-${mToday}-${dToday}`;
        
        rawContributions = rawContributions.filter((c: any) => c.date <= todayStr);

        // Sort contributions ascending so the latest date is at the end
        rawContributions.sort((a: any, b: any) => a.date.localeCompare(b.date));
        const lastIndex = rawContributions.length - 1;
        if (lastIndex < 0) {
          this.isLoading = false;
          return;
        }

        // Align graph to 53 weeks (Sunday to Saturday) ending at the last day's week
        const lastDateStr = rawContributions[lastIndex].date;
        const parts = lastDateStr.split('-');
        const lastDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const lastDayOfWeek = lastDate.getDay(); // 0: Sunday, 6: Saturday

        const totalDaysNeeded = 53 * 7;
        
        // Find Saturday of the last week
        const endDate = new Date(lastDate);
        endDate.setDate(lastDate.getDate() + (6 - lastDayOfWeek));

        // Find Sunday of the first week
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - totalDaysNeeded + 1);

        // Map data by date string
        const contribMap: { [key: string]: any } = {};
        rawContributions.forEach((c: any) => {
          contribMap[c.date] = c;
        });

        // Populate 53 weeks
        const weeksData: any[][] = [];
        let currentDate = new Date(startDate);

        for (let w = 0; w < 53; w++) {
          const week: any[] = [];
          for (let d = 0; d < 7; d++) {
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dayNum = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayNum}`;
            const dayData = contribMap[dateStr] || { date: dateStr, count: 0, level: 0 };
            
            week.push({
              ...dayData,
              monthName: currentDate.toLocaleDateString('en-US', { month: 'short' })
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }
          weeksData.push(week);
        }

        this.weeks = weeksData;
        this.isLoading = false;
      })
      .catch(err => {
        console.error('Error loading github contributions:', err);
        this.hasError = true;
        this.isLoading = false;
      });
  }

  getMonthLabel(weekIndex: number): string {
    if (this.weeks.length === 0) return '';
    if (weekIndex === 0) return this.weeks[0][0].monthName;
    const currentMonth = this.weeks[weekIndex][0].monthName;
    const prevMonth = this.weeks[weekIndex - 1][0].monthName;
    return currentMonth !== prevMonth ? currentMonth : '';
  }

  getDayClass(level: number): string {
    const base = 'w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-200 hover:scale-125 cursor-pointer ';
    switch(level) {
      case 1:
        return base + 'bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-900/30';
      case 2:
        return base + 'bg-emerald-400 dark:bg-emerald-700/80';
      case 3:
        return base + 'bg-emerald-500 dark:bg-emerald-500/90';
      case 4:
        return base + 'bg-emerald-600 dark:bg-emerald-400';
      default:
        return base + 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/30';
    }
  }

  showContribToast(day: any) {
    window.open('https://github.com/suuyashhh', '_blank');
  }

  openImagePreview(project: any): void {
    this.previewImage = project.images[this.currentImageIndex[project.id]];
    this.previewProjectTitle = project.title;
    this.currentPreviewProjectId = project.id;
    this.showImagePreview = true;
    document.body.style.overflow = 'hidden';
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    document.body.style.overflow = 'auto';
  }

  // Navigate to next image in carousel
  nextImage(projectId: string): void {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.currentImageIndex[projectId] = 
        (this.currentImageIndex[projectId] + 1) % project.images.length;
    }
  }

  // Navigate to previous image in carousel
  prevImage(projectId: string): void {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.currentImageIndex[projectId] = 
        (this.currentImageIndex[projectId] - 1 + project.images.length) % project.images.length;
    }
  }

  // Navigate to next image in preview modal
  nextImageInPreview(): void {
    const project = this.projects.find(p => p.id === this.currentPreviewProjectId);
    if (project) {
      this.currentImageIndex[this.currentPreviewProjectId] = 
        (this.currentImageIndex[this.currentPreviewProjectId] + 1) % project.images.length;
      this.previewImage = project.images[this.currentImageIndex[this.currentPreviewProjectId]];
    }
  }

  // Navigate to previous image in preview modal
  prevImageInPreview(): void {
    const project = this.projects.find(p => p.id === this.currentPreviewProjectId);
    if (project) {
      this.currentImageIndex[this.currentPreviewProjectId] = 
        (this.currentImageIndex[this.currentPreviewProjectId] - 1 + project.images.length) % project.images.length;
      this.previewImage = project.images[this.currentImageIndex[this.currentPreviewProjectId]];
    }
  }

  // Get current project images for counter
  getCurrentProjectImages(): string[] {
    const project = this.projects.find(p => p.id === this.currentPreviewProjectId);
    return project ? project.images : [];
  }
}