import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  userName: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    type: string;
    expiresIn: number;
    user: UserData;
  };
}

export interface UserData {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  profileImage: string;
  createdAt: string;
  county?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiUrl + '/auth';
  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  private accessToken: string | null = null;
  private authReadySubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public authReady$ = this.authReadySubject.asObservable();
  private http = inject(HttpClient);

  initUser(): void {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.authReadySubject.next(true);
      return;
    }

    this.refreshTokenRequest(refreshToken).subscribe({
      next: (response) => {
        if (response.success && response.data?.token) {
          this.accessToken = response.data.token;
          this.setRefreshToken(response.data.refreshToken);
          this.getCurrentUser().subscribe({
            next: (res: any) => {
              const userData = res.data || res;
              if (userData?.id) {
                this.currentUserSubject.next(userData);
              }
              this.authReadySubject.next(true);
            },
            error: () => {
              this.clearAll();
              this.authReadySubject.next(true);
            },
          });
        } else {
          this.authReadySubject.next(true);
        }
      },
      error: () => {
        this.clearAll();
        this.authReadySubject.next(true);
      },
    });
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap((response) => {
        if (response.success && response.data.token) {
          this.accessToken = response.data.token;
          this.setRefreshToken(response.data.refreshToken);
          this.currentUserSubject.next(response.data.user);
        }
      }),
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap((response) => {
        if (response.success && response.data.token) {
          this.accessToken = response.data.token;
          this.setRefreshToken(response.data.refreshToken);
          this.currentUserSubject.next(response.data.user);
        }
      }),
    );
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}).subscribe();
    this.clearAll();
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/me`);
  }

  refreshTokenRequest(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh-token`, {
      refreshToken,
    });
  }

  changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password`, {
      oldPassword,
      newPassword,
      confirmPassword,
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, {
      token,
      newPassword,
      confirmPassword,
    });
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile`, profile);
  }

  refreshCurrentUser(): void {
    this.getCurrentUser().subscribe({
      next: (res: any) => {
        const userData = res.data || res;
        if (userData?.id) {
          if (userData.phone && !userData.phoneNumber) userData.phoneNumber = userData.phone;
          this.currentUserSubject.next(userData);
        }
      },
    });
  }

  setToken(token: string): void {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  removeToken(): void {
    this.accessToken = null;
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  removeRefreshToken(): void {
    localStorage.removeItem('refresh_token');
  }

  isLoggedIn(): boolean {
    if (!this.accessToken) return false;
    try {
      const decoded: any = jwtDecode(this.accessToken);
      return decoded.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  clearAll(): void {
    this.accessToken = null;
    this.removeRefreshToken();
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedUsername');
    this.currentUserSubject.next(null);
  }
}
