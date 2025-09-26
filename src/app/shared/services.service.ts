import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  constructor() {}

  // Get current date in Indian Standard Time
  getCurrentIndianDate(): Date {
    const serverTime = new Date();
    // Convert to Indian time (UTC+5:30)
    const indianTime = new Date(serverTime.getTime() + (5.5 * 60 * 60 * 1000));
    return indianTime;
  }

  // Get current date in yyyy-MM-dd format (Indian time)
  getCurrentIndianDateFormatted(): string {
    const indianDate = this.getCurrentIndianDate();
    const y = indianDate.getUTCFullYear();
    const m = ('0' + (indianDate.getUTCMonth() + 1)).slice(-2);
    const d = ('0' + indianDate.getUTCDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  getFormattedDate(input: string | Date, flag: number): string {
    let strDate = '';

    if (input instanceof Date) {
      // Convert to Indian time if it's a Date object
      const indianDate = new Date(input.getTime() + (5.5 * 60 * 60 * 1000));
      const y = indianDate.getUTCFullYear();
      const m = ('0' + (indianDate.getUTCMonth() + 1)).slice(-2);
      const d = ('0' + indianDate.getUTCDate()).slice(-2);
      strDate = `${y}${m}${d}`;
    } else if (typeof input === 'string') {
      strDate = input.trim();
    } else {
      return '';
    }

    let retDate = '';

    try {
      if ((flag === 1 || flag === 4) && strDate.includes('/')) {
        const [day, month, year] = strDate.split('/');
        retDate = `${year}${month}${day}`;
      } else if (flag === 3 && strDate.includes('-')) {
        const [year, month, day] = strDate.split('-');
        retDate = `${day}/${month}/${year}`;
      } else if (flag === 8 && strDate.length === 8) {
        const year = strDate.substring(0, 4);
        const month = strDate.substring(4, 6);
        const day = strDate.substring(6, 8);
        retDate = `${year}-${month}-${day}`;
      } else if (strDate.length === 8) {
        const year = strDate.substring(0, 4);
        const month = strDate.substring(4, 6);
        const day = strDate.substring(6, 8);
        retDate = `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error('Error in getFormattedDate:', error);
    }

    return retDate;
  }

  // yyyy-MM-dd → yyyyMMdd
  formatDate(date: string, flag: number): string {
    if (!date) return '';
    if (flag === 1 && date.includes('-')) {
      const [y, m, d] = date.split('-');
      return `${y}${m}${d}`;
    }
    return date;
  }

  // first & last date of month in yyyy-MM-dd (Indian time)
  getCurrentMonthRange() {
    const now = this.getCurrentIndianDate();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

    const f = (d: Date) => {
      const y = d.getUTCFullYear();
      const m = ('0' + (d.getUTCMonth() + 1)).slice(-2);
      const day = ('0' + d.getUTCDate()).slice(-2);
      return `${y}-${m}-${day}`;
    };

    return { start: f(start), end: f(end) };
  }

  // Alternative method using timezone offset calculation
  convertToIndianTime(date: Date): Date {
    // Indian Standard Time is UTC+5:30
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return new Date(utc + istOffset);
  }

  // Get current Indian time in various formats
  getIndianTime(): { date: Date; formatted: string; timeString: string } {
    const indianDate = this.getCurrentIndianDate();
    const formatted = this.getCurrentIndianDateFormatted();
    const timeString = indianDate.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata'
    });
    
    return {
      date: indianDate,
      formatted: formatted,
      timeString: timeString
    };
  }
}