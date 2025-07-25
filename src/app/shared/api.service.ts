import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as bootstrap from 'bootstrap';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

 baseurl = 'https://localhost:7193/api/';
//  baseurl = 'https://labmvcapi.bsite.net/api/';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private getComId(): string {
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  return userDetails.coM_ID || '';
  // return JSON.parse(localStorage.getItem('COM_ID') || '');
}


get(api: string, params: any = {}) {
  params['comId'] = this.getComId();
  return this.http.get(this.baseurl + api, {
    headers: this.getHeaders(),
    params: params
  });
}

post(api: string, data: any) {
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  data.CRT_BY = userDetails.name || '';
  data.COM_ID = this.getComId();

  return this.http.post(this.baseurl + api, data, { headers: this.getHeaders() });
}

put(api: string, data: any) {
  data.COM_ID = this.getComId();
  return this.http.put(this.baseurl + api, data, { headers: this.getHeaders() });
}

delete(api: string, params: any = {}) {
  params['comId'] = this.getComId();
  return this.http.delete(this.baseurl + api, {
    headers: this.getHeaders(),
    params: params
  });
}

 modalClose(modalId: string) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modal.hide();
    modalElement.addEventListener('hidden.bs.modal', () => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(b => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, { once: true });
  }
}

formatDate(dateString: string): string {
  if (!dateString || dateString.length !== 8) return '';
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  return `${day}-${month}-${year}-`;
  // return `${year}-${month}-${day}`;
}

}

