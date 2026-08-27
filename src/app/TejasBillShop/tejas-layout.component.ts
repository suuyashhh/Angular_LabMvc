import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tejas-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tejas-layout.component.html'
})
export class TejasLayoutComponent implements OnInit {
  isExpenseModule = false;

  constructor(private router: Router) {
    this.checkRoute(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects);
    });
  }

  ngOnInit() {}

  private checkRoute(url: string) {
    const expenseRoutes = ['/tejas/expenses', '/tejas/history', '/tejas/ex-entrytype', '/tejas/tejas-users'];
    this.isExpenseModule = expenseRoutes.some(route => url.includes(route));
  }
}
