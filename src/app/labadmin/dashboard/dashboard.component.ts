import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { log } from 'console';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  dashboardCount: any;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.load();
    // Animate cards in with delay
    const cards = document.querySelectorAll<HTMLElement>('.stat-card, .partner-card');
    cards.forEach((card, index) => {
      card.classList.add('loading');
      card.style.animationDelay = `${index * 100}ms`;
    });

    // Animate numbers
    setTimeout(() => {
      const counters = document.querySelectorAll<HTMLElement>('.stat-number[data-target]');
      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute('data-target') || '0');
        if (!isNaN(target)) {
          this.animateCounter(counter, target);
        }
      });
    }, 500);

    // Hover effect
    document.querySelectorAll<HTMLElement>('.stat-card').forEach((card) => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
      });
    });

    // Click effect
    document.querySelectorAll<HTMLElement>('.stat-card, .partner-card').forEach((card) => {
      card.addEventListener('click', () => {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      });
    });
  }

  load() {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

  this.api.get('Home/Home/' + '20250426' + ',' + '20250426').subscribe((res: any) => {
    this.dashboardCount = res;
    console.log(res);

    // Delay to allow Angular to render dashboardCount values in the DOM
    setTimeout(() => {
      const counters = document.querySelectorAll<HTMLElement>('.stat-number[data-target]');
      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute('data-target') || '0');
        if (!isNaN(target)) {
          this.animateCounter(counter, target);
        }
      });
    }, 100); // Slight delay to ensure DOM update
  });
}


  animateCounter(element: HTMLElement, target: number, duration = 1500) {
  let start = 0;
  const increment = Math.ceil(target / (duration / 30));

  const updateCounter = () => {
    start += increment;
    if (start >= target) {
      element.innerText = target.toString();
    } else {
      element.innerText = start.toString();
      requestAnimationFrame(updateCounter);
    }
  };

  updateCounter();
}


  refreshStats(): void {
    const counters = document.querySelectorAll<HTMLElement>('.stat-number[data-target]');
    counters.forEach((counter) => {
      const currentTarget = parseInt(counter.getAttribute('data-target') || '0');
      const newTarget = Math.floor(currentTarget * (0.8 + Math.random() * 0.4));
      counter.setAttribute('data-target', newTarget.toString());
      this.animateCounter(counter, newTarget, 1000);
    });
  }
}
