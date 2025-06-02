import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseurl="https://localhost:7193/api/";
  constructor(private http:HttpClient) {}

  get(api: string) {
    //console.log(this.baseurl + api);    
    return this.http.get(this.baseurl + api)
  };

  post(api: string, data: any) {
    return this.http.post(this.baseurl + api, data)
  };

  put(api: string, data: any) {
    return this.http.put(this.baseurl + api, data)
  };

  delete(api: string) {
    return this.http.delete(this.baseurl + api)
  };
}
