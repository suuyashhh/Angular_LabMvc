import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  baseurl = 'https://localhost:7193/api/';

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
}
