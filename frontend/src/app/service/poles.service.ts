import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PolesInterface } from '../interfaces/poles-interface';

@Injectable({
  providedIn: 'root',
})
export class PolesService {
  private baseUrl = environment.apiUrl + '/poles';

  constructor(private httpClient: HttpClient) {}

  getPoles() {
    return this.httpClient.get<PolesInterface[]>(this.baseUrl);
  }

  getPolesByDate(cdate: number) {
    const url = this.baseUrl + '/' + cdate;
    return this.httpClient.get<PolesInterface[]>(url);
  }

  getCapturedDates() {
    return this.httpClient.get(this.baseUrl + '/capturedDates');
  }

  getPoleById(id: string) {
    const url = this.baseUrl + '/id/' + id;
    return this.httpClient.get<PolesInterface>(url);
  }
}
