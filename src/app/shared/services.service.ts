import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  constructor() {}

  getFormattedDate(input: string | Date, flag: number): string {
  let strDate = '';

  if (input instanceof Date) {
    const y = input.getFullYear();
    const m = ('0' + (input.getMonth() + 1)).slice(-2);
    const d = ('0' + input.getDate()).slice(-2);
    strDate = `${y}${m}${d}`; // default yyyyMMdd
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

// first & last date of month in yyyy-MM-dd (LOCAL)
getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const f = (d: Date) => {
    const y = d.getFullYear();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  };

  return { start: f(start), end: f(end) };
}

}
