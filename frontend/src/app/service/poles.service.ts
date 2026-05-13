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

export interface InspectorStats {
  totalAssigned: number;
  inspectedCount: number;
  byAction: { action: string; count: number }[];
  byCounty: { county: string; count: number }[];
  byMunicipality: { municipality: string; count: number }[];
  recentActivity: {
    poleId: string;
    county: string;
    action: string;
    inspectionDate: number | null;
  }[];
}

export interface DashboardStats {
  totalPoles: number;
  inspectedCount: number;
  captureDates: { capturedDate: number; count: number }[];
  byCounty: { county: string; count: number }[];
  byInspector: { inspectorId: string; inspected: number; pending: number }[];
  recentInspections: {
    poleId: string;
    county: string;
    action: string;
    assignedInspector: string;
    inspectionDate: number;
  }[];
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
    if (municipalities.length)
      params = params.set('municipalities', municipalities.join(','));
    return this.httpClient.get<PoleSummaryResponse>(this.baseUrl + '/summary', {
      params,
    });
  }

  getCapturedDates() {
    return this.httpClient.get(this.baseUrl + '/capturedDates');
  }

  getPoleById(id: string) {
    const url = this.baseUrl + '/id/' + id;
    return this.httpClient.get<PoleInterface>(url);
  }

  getPolesByInspector(inspectorId: string): Observable<PoleInterface[]> {
    return this.httpClient.get<PoleInterface[]>(
      `${this.baseUrl}/inspector/${inspectorId}`,
    );
  }

  getInspectorStats(inspectorId: string): Observable<InspectorStats> {
    return this.httpClient.get<InspectorStats>(
      `${this.baseUrl}/inspector/${inspectorId}/stats`,
    );
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.httpClient.get<DashboardStats>(
      `${this.baseUrl}/dashboard-stats`,
    );
  }

  updatePole(pole: PoleInterface): Observable<HttpResponse<PoleInterface>> {
    const url = this.baseUrl + '/' + pole.id;

    return this.httpClient.put<PoleInterface>(url, pole, {
      observe: 'response',
    });
  }
}
