import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { PoleInterface } from '../interfaces/pole-interface';
import { PoleSummaryResponse } from '../interfaces/pole-summary-response';

@Injectable({
  providedIn: 'root',
})
export class PolesService {
  private baseUrl = environment.apiUrl + '/poles';

  private httpClient = inject(HttpClient);

  getPoles() {
    return this.httpClient.get<PoleInterface[]>(this.baseUrl);
  }

  getSummary() {
    return this.httpClient.get<PoleSummaryResponse>(this.baseUrl + '/summary');
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
