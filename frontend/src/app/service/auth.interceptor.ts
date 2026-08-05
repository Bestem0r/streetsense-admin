import { inject, Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null,
  );

  private isExternalRequest(url: string): boolean {
    return url.includes('nvdbapiles.atlas.vegvesen.no');
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (this.isExternalRequest(request.url)) {
      return next.handle(request);
    }

    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        } else if (error.status === 403) {
          this.authService.clearAll();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      }),
    );
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken();
      if (refreshToken) {
        return this.authService.refreshTokenRequest(refreshToken).pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            if (response.data?.token) {
              this.authService.setToken(response.data.token);
              if (response.data?.refreshToken) {
                this.authService.setRefreshToken(response.data.refreshToken);
              }
              this.refreshTokenSubject.next(response.data.token);
              return next.handle(
                request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.data.token}`,
                  },
                }),
              );
            }
            return throwError(() => new Error('Token refresh failed'));
          }),
          catchError((err) => {
            this.isRefreshing = false;
            this.authService.clearAll();
            this.router.navigate(['/login']);
            return throwError(() => err);
          }),
        );
      } else {
        this.authService.clearAll();
        this.router.navigate(['/login']);
        return throwError(() => new Error('No refresh token available'));
      }
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            }),
          );
        }),
      );
    }
  }
}
