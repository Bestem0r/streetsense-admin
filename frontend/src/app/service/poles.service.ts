import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

import { environment } from '../../environments/environment';
import { PoleInterface } from '../interfaces/pole-interface';

@Injectable({
  providedIn: 'root',
})
export class PolesService {
  private baseUrl = environment.apiUrl + '/poles';

  private httpClient = inject(HttpClient);

  getPoles() {
    return this.httpClient.get<PoleInterface[]>(this.baseUrl);
  }

  getPolesByDate(cdate: number) {
    const url = this.baseUrl + '/' + cdate;
    return this.httpClient.get<PoleInterface[]>(url);
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
