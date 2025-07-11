import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  ngOnInit(): void {
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

  animateCounter(element: HTMLElement, target: number, duration: number = 2000): void {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
        element.classList.add('animate');
        setTimeout(() => element.classList.remove('animate'), 500);
      }

      if (target > 1000) {
        element.textContent = '₹' + Math.floor(current).toLocaleString('en-IN');
      } else {
        element.textContent = Math.floor(current).toString();
      }
    }, 16);
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
