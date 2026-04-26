import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
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
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  profileImage: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiUrl + '/auth';
  private currentUserSubject = new BehaviorSubject<UserData | null>(null);

  initUser(): void {
    const token = this.getToken();
    const storedUser = this.getUserFromStorage();

    // If we have a stored user and valid token, use the cached user
    if (storedUser && token) {
      this.currentUserSubject.next(storedUser);

      // Fetch fresh user data in the background
      this.getCurrentUser().subscribe({
        next: (response: any) => {
          // Response is wrapped in ApiResponse with data field
          const userData = response.data || response;
          if (userData && userData.id) {
            this.setCurrentUser(userData);
            this.currentUserSubject.next(userData);
          }
        },
        error: (error) => {
          // If 401, interceptor will handle token refresh
          // Keep using cached user if other error
          if (error.status === 404 || error.status === 400) {
            this.clearAll();
          }
        },
      });
    } else if (token && !storedUser) {
      // We have a token but no cached user, fetch it
      this.getCurrentUser().subscribe({
        next: (response: any) => {
          const userData = response.data || response;
          if (userData && userData.id) {
            this.setCurrentUser(userData);
            this.currentUserSubject.next(userData);
          }
        },
        error: (error) => {
          // Only clear on certain errors
          if (error.status === 401 || error.status === 404) {
            this.clearAll();
          }
        },
      });
    }
  }
  public currentUser$ = this.currentUserSubject.asObservable();
  private http = inject(HttpClient);

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap((response) => {
        if (response.success && response.data.token) {
          this.setToken(response.data.token);
          this.setRefreshToken(response.data.refreshToken);
          this.setCurrentUser(response.data.user);
          this.currentUserSubject.next(response.data.user);
        }
      }),
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap((response) => {
        if (response.success && response.data.token) {
          this.setToken(response.data.token);
          this.setRefreshToken(response.data.refreshToken);
          this.setCurrentUser(response.data.user);
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

  updateProfile(profile: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile`, profile);
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
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
    const token = this.getToken();
    if (!token) {
      return false;
    }
    try {
      const decoded: any = jwtDecode(token);
      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp > now;
    } catch {
      return false;
    }
  }

  clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
    localStorage.removeItem('current_user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedUsername');
    this.currentUserSubject.next(null);
  }

  private setCurrentUser(user: UserData): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  private getUserFromStorage(): UserData | null {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}
