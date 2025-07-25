import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  constructor() {}

  getFormattedDate(strDate: string, flag: number): string {
    let retDate = '';

    if (!strDate || typeof strDate !== 'string') {
      return '';
    }

    strDate = strDate.trim();

    try {
      if ((flag === 1 || flag === 4) && strDate.includes('/')) {
        // dd/MM/yyyy → yyyyMMdd
        const [day, month, year] = strDate.split('/');
        if (day && month && year) {
          retDate = `${year}${month}${day}`;
        }
      } else if (flag === 3 && strDate.includes('-')) {
        // yyyy-MM-dd → dd/MM/yyyy
        const [year, month, day] = strDate.split('-');
        if (day && month && year) {
          retDate = `${day}/${month}/${year}`;
        }
      } else if (flag === 8 && strDate.length === 8) {
        // yyyyMMdd → yyyy-MM-dd
        const year = strDate.substring(0, 4);
        const month = strDate.substring(4, 6);
        const day = strDate.substring(6, 8);
        retDate = `${year}-${month}-${day}`;
      } else if (strDate.length === 8) {
        // Default: yyyyMMdd → dd/MM/yyyy
        const year = strDate.substring(0, 4);
        const month = strDate.substring(4, 6);
        const day = strDate.substring(6, 8);
        retDate = `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error('Error in getFormattedDate:', error);
      retDate = '';
    }

    return retDate;
  }
}
