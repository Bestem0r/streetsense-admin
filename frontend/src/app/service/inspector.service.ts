import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Inspector {
  id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  county?: string;
  role?: string;
  createdAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Shape returned by the backend User entity
interface BackendUser {
  id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  county?: string;
  role?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InspectorService {
  private baseUrl = environment.apiUrl + '/users';
  private http = inject(HttpClient);

  getInspectors(): Observable<Inspector[]> {
    return this.http
      .get<ApiResponse<BackendUser[]>>(this.baseUrl)
      .pipe(map((res) => (res.data ?? []).map((u) => this.toInspector(u))));
  }

  getInspectorById(id: string): Observable<Inspector | undefined> {
    return this.getInspectors().pipe(
      map((list) => list.find((i) => i.id === id)),
    );
  }

  searchInspectors(query: string): Observable<Inspector[]> {
    const q = query.toLowerCase();
    return this.getInspectors().pipe(
      map((list) =>
        list.filter(
          (i) =>
            i.firstName?.toLowerCase().includes(q) ||
            i.lastName?.toLowerCase().includes(q) ||
            i.email.toLowerCase().includes(q),
        ),
      ),
    );
  }

  addInspector(inspector: Omit<Inspector, 'id'>): Observable<Inspector> {
    return this.http
      .post<
        ApiResponse<BackendUser>
      >(environment.apiUrl + '/auth/register', inspector)
      .pipe(map((res) => this.toInspector(res.data)));
  }

  removeInspector(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toInspector(user: BackendUser): Inspector {
    return {
      id: user.id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      county: user.county,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
