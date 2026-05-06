import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { PoleInterface } from '../interfaces/pole-interface';
import { PoleSummaryResponse } from '../interfaces/pole-summary-response';

export interface PagedPolesResponse {
  content: PoleInterface[];
  page: number;
  size: number;
  totalElements: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PolesService {
  private baseUrl = environment.apiUrl + '/poles';

  private httpClient = inject(HttpClient);

  getPoles() {
    return this.httpClient.get<PoleInterface[]>(this.baseUrl);
  }

  getPolesByDate(
    date: string,
    counties: string[] = [],
    municipalities: string[] = [],
    page = 0,
    size = 10,
  ) {
    let params = new HttpParams()
      .set('date', date)
      .set('page', page.toString())
      .set('size', size.toString());

    if (counties.length) {
      params = params.set('counties', counties.join(','));
    }
    if (municipalities.length) {
      params = params.set('municipalities', municipalities.join(','));
    }

    return this.httpClient.get<PagedPolesResponse>(this.baseUrl + '/date', {
      params,
    });
  }

  getSummary(counties: string[] = [], municipalities: string[] = []) {
    let params = new HttpParams();
    if (counties.length) params = params.set('counties', counties.join(','));
    if (municipalities.length) params = params.set('municipalities', municipalities.join(','));
    return this.httpClient.get<PoleSummaryResponse>(this.baseUrl + '/summary', { params });
  }

  getCapturedDates() {
    return this.httpClient.get(this.baseUrl + '/capturedDates');
  }

  getPoleById(id: string) {
    const url = this.baseUrl + '/id/' + id;
    return this.httpClient.get<PoleInterface>(url);
  }

  updatePole(pole: PoleInterface): Observable<HttpResponse<PoleInterface>> {
    const url = this.baseUrl + '/' + pole.id;

    return this.httpClient.put<PoleInterface>(url, pole, {
      observe: 'response',
    });
  }
}
