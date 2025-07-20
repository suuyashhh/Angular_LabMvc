import { Pipe, PipeTransform } from '@angular/core';
import { ServicesService } from '../services.service';

@Pipe({
  name: 'formattedDate',
  standalone: true
})
export class FormattedDatePipe implements PipeTransform {
  constructor(private services: ServicesService) {}

  transform(value: string, flag: number): string {
    return this.services.getFormattedDate(value, flag);
  }
}
