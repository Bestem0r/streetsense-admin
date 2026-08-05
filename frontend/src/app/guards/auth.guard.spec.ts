import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../service/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  let authReadySubject: BehaviorSubject<boolean>;

  const mockAuthService = {
    authReady$: null as any,
    isLoggedIn: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authReadySubject = new BehaviorSubject<boolean>(false);
    mockAuthService.authReady$ = authReadySubject.asObservable();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        AuthGuard,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  // ── allows access ──────────────────────────────────────────────────────────
  describe('when user is logged in', () => {
    beforeEach(() => mockAuthService.isLoggedIn.mockReturnValue(true));

    it('emits true when authReady$ emits true', () => {
      return new Promise<void>((resolve) => {
        guard.canActivate().subscribe((result) => {
          expect(result).toBe(true);
          resolve();
        });
        authReadySubject.next(true);
      });
    });

    it('does not navigate to login', () => {
      const spy = vi.spyOn(router, 'navigate');
      return new Promise<void>((resolve) => {
        guard.canActivate().subscribe(() => {
          expect(spy).not.toHaveBeenCalled();
          resolve();
        });
        authReadySubject.next(true);
      });
    });
  });

  // ── blocks access ──────────────────────────────────────────────────────────
  describe('when user is not logged in', () => {
    beforeEach(() => mockAuthService.isLoggedIn.mockReturnValue(false));

    it('emits false when authReady$ emits true', () => {
      return new Promise<void>((resolve) => {
        guard.canActivate().subscribe((result) => {
          expect(result).toBe(false);
          resolve();
        });
        authReadySubject.next(true);
      });
    });

    it('navigates to /login', () => {
      const spy = vi.spyOn(router, 'navigate');
      return new Promise<void>((resolve) => {
        guard.canActivate().subscribe(() => {
          expect(spy).toHaveBeenCalledWith(['/login']);
          resolve();
        });
        authReadySubject.next(true);
      });
    });
  });

  // ── authReady$ filtering ───────────────────────────────────────────────────
  describe('authReady$ filtering', () => {
    it('waits for authReady$ to emit true before evaluating', () => {
      mockAuthService.isLoggedIn.mockReturnValue(true);
      let emitted = false;

      return new Promise<void>((resolve) => {
        guard.canActivate().subscribe(() => {
          emitted = true;
          resolve();
        });

        expect(emitted).toBe(false);
        authReadySubject.next(false);
        expect(emitted).toBe(false);
        authReadySubject.next(true);
      });
    });

    it('only evaluates once (take 1) even if authReady$ emits multiple times', () => {
      mockAuthService.isLoggedIn.mockReturnValue(true);
      let callCount = 0;

      return new Promise<void>((resolve) => {
        guard.canActivate().subscribe(() => {
          callCount++;
        });

        authReadySubject.next(true);
        authReadySubject.next(true);
        authReadySubject.next(true);

        setTimeout(() => {
          expect(callCount).toBe(1);
          resolve();
        }, 0);
      });
    });
  });
});
