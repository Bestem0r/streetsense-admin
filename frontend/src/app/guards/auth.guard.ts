import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.authReady$.pipe(
      filter((ready) => ready),
      take(1),
      map(() => {
        if (this.authService.isLoggedIn()) {
          return true;
        }
        this.router.navigate(['/login']);
        return false;
      }),
    );
  }
}
