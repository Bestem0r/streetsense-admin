import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CaptureInterface } from '../interfaces/Capture-interface';

@Injectable({
  providedIn: 'root',
})
export class PlanCaptureService {
  private baseUrl = environment.apiUrl + '/captures';

  private httpClient = inject(HttpClient);

  /**
   * Create a new capture
   *
   * @param capture the capture object to create
   * @return Observable of the created capture with generated ID
   */
  createCapture(capture: CaptureInterface): Observable<CaptureInterface> {
    return this.httpClient
      .post<CaptureInterface>(this.baseUrl, capture, {
        observe: 'response',
      })
      .pipe(map((response) => response.body as CaptureInterface));
  }

  /**
   * Get all captures
   *
   * @return Observable of all captures
   */
  getCaptures(): Observable<CaptureInterface[]> {
    return this.httpClient.get<CaptureInterface[]>(this.baseUrl);
  }

  /**
   * Get a capture by ID
   *
   * @param id the capture ID
   * @return Observable of the capture
   */
  getCaptureById(id: string): Observable<CaptureInterface> {
    return this.httpClient.get<CaptureInterface>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get captures by groupBy field
   *
   * @param groupBy the groupBy field value
   * @return Observable of captures matching the groupBy
   */
  getCapturesByGroupBy(groupBy: string): Observable<CaptureInterface[]> {
    return this.httpClient.get<CaptureInterface[]>(
      `${this.baseUrl}/groupBy/${groupBy}`,
    );
  }

  /**
   * Get captures by groupBy and value
   *
   * @param groupBy the groupBy field value
   * @param groupByValue the groupByValue field value
   * @return Observable of captures matching both criteria
   */
  getCapturesByGroupByAndValue(
    groupBy: string,
    groupByValue: string,
  ): Observable<CaptureInterface[]> {
    return this.httpClient.get<CaptureInterface[]>(
      `${this.baseUrl}/groupBy/${groupBy}/value/${groupByValue}`,
    );
  }

  /**
   * Get captures within a date range
   *
   * @param startDate start date in milliseconds
   * @param endDate end date in milliseconds
   * @return Observable of captures within the date range
   */
  getCapturesByDateRange(
    startDate: number,
    endDate: number,
  ): Observable<CaptureInterface[]> {
    return this.httpClient.get<CaptureInterface[]>(
      `${this.baseUrl}/dateRange?startDate=${startDate}&endDate=${endDate}`,
    );
  }

  /**
   * Update an existing capture
   *
   * @param id the capture ID to update
   * @param capture the updated capture data
   * @return Observable of the updated capture
   */
  updateCapture(
    id: string,
    capture: CaptureInterface,
  ): Observable<CaptureInterface> {
    return this.httpClient.put<CaptureInterface>(
      `${this.baseUrl}/${id}`,
      capture,
    );
  }

  /**
   * Delete a capture by ID
   *
   * @param id the capture ID to delete
   * @return Observable of the delete operation
   */
  deleteCapture(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}
