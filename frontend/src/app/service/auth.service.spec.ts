import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService, AuthResponse, UserData } from './auth.service';

// Build a syntactically valid JWT with a fake signature.
// jwtDecode only decodes the payload — it never verifies the signature.
function makeJwt(exp: number, sub = 'testuser'): string {
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub, exp })}.fakesig`;
}

const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const PAST = Math.floor(Date.now() / 1000) - 100;

const mockUser: UserData = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '123456789',
  role: 'USER',
  profileImage: '',
  createdAt: '2024-01-01T00:00:00',
};

function makeAuthResponse(
  token: string,
  refreshToken = 'new-refresh-token',
): AuthResponse {
  return {
    success: true,
    message: 'ok',
    data: {
      token,
      refreshToken,
      type: 'Bearer',
      expiresIn: 3600,
      user: mockUser,
    },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('authReady$', () => {
    it('starts as false before initUser() is called', () => {
      let value = true;
      service.authReady$.subscribe((v) => (value = v));
      expect(value).toBe(false);
    });
  });

  describe('initUser()', () => {
    it('emits authReady$(true) synchronously when no refresh token exists', () => {
      const ready: boolean[] = [];
      service.authReady$.subscribe((v) => ready.push(v));

      service.initUser();

      expect(ready).toEqual([false, true]);
    });

    it('restores session using stored refresh token', () => {
      const token = makeJwt(FUTURE);
      localStorage.setItem('refresh_token', 'stored-rt');
      let user: UserData | null = null;
      service.currentUser$.subscribe((u) => (user = u));

      service.initUser();

      httpMock
        .expectOne((r) => r.url.includes('/refresh-token'))
        .flush(makeAuthResponse(token));

      httpMock
        .expectOne((r) => r.url.includes('/me'))
        .flush({ data: mockUser });

      expect(service.getToken()).toBe(token);
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
      expect(user).toBeTruthy();
    });

    it('emits authReady$(true) after successful token refresh and /me', () => {
      const token = makeJwt(FUTURE);
      localStorage.setItem('refresh_token', 'stored-rt');
      const ready: boolean[] = [];
      service.authReady$.subscribe((v) => ready.push(v));

      service.initUser();

      httpMock
        .expectOne((r) => r.url.includes('/refresh-token'))
        .flush(makeAuthResponse(token));
      httpMock
        .expectOne((r) => r.url.includes('/me'))
        .flush({ data: mockUser });

      expect(ready).toContain(true);
    });

    it('clears session and emits authReady$(true) when refresh request fails', () => {
      localStorage.setItem('refresh_token', 'expired-rt');
      const ready: boolean[] = [];
      service.authReady$.subscribe((v) => ready.push(v));

      service.initUser();

      httpMock
        .expectOne((r) => r.url.includes('/refresh-token'))
        .flush({ success: false }, { status: 401, statusText: 'Unauthorized' });

      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(ready).toContain(true);
    });

    it('clears session and emits authReady$(true) when /me fails after refresh', () => {
      const token = makeJwt(FUTURE);
      localStorage.setItem('refresh_token', 'stored-rt');
      const ready: boolean[] = [];
      service.authReady$.subscribe((v) => ready.push(v));

      service.initUser();

      httpMock
        .expectOne((r) => r.url.includes('/refresh-token'))
        .flush(makeAuthResponse(token));
      httpMock
        .expectOne((r) => r.url.includes('/me'))
        .flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.getToken()).toBeNull();
      expect(ready).toContain(true);
    });

    it('emits authReady$(true) when refresh response has no token', () => {
      localStorage.setItem('refresh_token', 'stored-rt');
      const ready: boolean[] = [];
      service.authReady$.subscribe((v) => ready.push(v));

      service.initUser();

      httpMock
        .expectOne((r) => r.url.includes('/refresh-token'))
        .flush({ success: false, message: 'nope', data: null });

      expect(ready).toContain(true);
    });
  });

  describe('login()', () => {
    it('stores access token in memory on success', () => {
      const token = makeJwt(FUTURE);
      service.login({ username: 'testuser', password: 'pass' }).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/login'))
        .flush(makeAuthResponse(token));

      expect(service.getToken()).toBe(token);
    });

    it('stores refresh token in localStorage on success', () => {
      const token = makeJwt(FUTURE);
      service.login({ username: 'testuser', password: 'pass' }).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/login'))
        .flush(makeAuthResponse(token, 'rt-123'));

      expect(localStorage.getItem('refresh_token')).toBe('rt-123');
    });

    it('does NOT write access token to localStorage', () => {
      const token = makeJwt(FUTURE);
      service.login({ username: 'testuser', password: 'pass' }).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/login'))
        .flush(makeAuthResponse(token));

      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('emits user to currentUser$ on success', () => {
      const token = makeJwt(FUTURE);
      let emitted: UserData | null = null;
      service.currentUser$.subscribe((u) => (emitted = u));

      service.login({ username: 'testuser', password: 'pass' }).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/login'))
        .flush(makeAuthResponse(token));

      expect((emitted as unknown as UserData)?.username).toBe('testuser');
    });

    it('sends rememberMe flag in request body', () => {
      const token = makeJwt(FUTURE);
      service
        .login({ username: 'testuser', password: 'pass', rememberMe: true })
        .subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/login'));
      expect(req.request.body.rememberMe).toBe(true);
      req.flush(makeAuthResponse(token));
    });
  });

  describe('register()', () => {
    const registerPayload = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'pass123',
      confirmPassword: 'pass123',
      firstName: 'New',
      lastName: 'User',
      phoneNumber: '999',
    };

    it('stores access token in memory on success', () => {
      const token = makeJwt(FUTURE);
      service.register(registerPayload).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/register'))
        .flush(makeAuthResponse(token));

      expect(service.getToken()).toBe(token);
    });

    it('stores refresh token in localStorage on success', () => {
      const token = makeJwt(FUTURE);
      service.register(registerPayload).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/register'))
        .flush(makeAuthResponse(token, 'reg-rt'));

      expect(localStorage.getItem('refresh_token')).toBe('reg-rt');
    });

    it('emits user to currentUser$ on success', () => {
      const token = makeJwt(FUTURE);
      let emitted: UserData | null = null;
      service.currentUser$.subscribe((u) => (emitted = u));

      service.register(registerPayload).subscribe();

      httpMock
        .expectOne((r) => r.url.includes('/register'))
        .flush(makeAuthResponse(token));

      expect((emitted as unknown as UserData)?.id).toBe('1');
    });
  });

  // ---------------------------------------------------------------------------
  // logout()
  // ---------------------------------------------------------------------------
  describe('logout()', () => {
    it('posts to /logout endpoint', () => {
      service.logout();

      const req = httpMock.expectOne((r) => r.url.includes('/logout'));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'ok' });
    });

    it('clears all auth state immediately without waiting for server response', () => {
      service.setToken(makeJwt(FUTURE));
      localStorage.setItem('refresh_token', 'rt');

      service.logout();

      expect(service.getToken()).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();

      httpMock.expectOne((r) => r.url.includes('/logout')).flush({});
    });

    it('emits null to currentUser$ on logout', () => {
      let emitted: UserData | null = mockUser;
      service.currentUser$.subscribe((u) => (emitted = u));

      service.logout();

      expect(emitted).toBeNull();

      httpMock.expectOne((r) => r.url.includes('/logout')).flush({});
    });
  });

  describe('isLoggedIn()', () => {
    it('returns false when no access token is set', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true for a valid non-expired JWT', () => {
      service.setToken(makeJwt(FUTURE));
      expect(service.isLoggedIn()).toBe(true);
    });

    it('returns false for an expired JWT', () => {
      service.setToken(makeJwt(PAST));
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns false for a malformed token string', () => {
      service.setToken('not.a.valid.jwt');
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('clearAll()', () => {
    it('removes access token from memory', () => {
      service.setToken(makeJwt(FUTURE));
      service.clearAll();
      expect(service.getToken()).toBeNull();
    });

    it('removes refresh_token from localStorage', () => {
      localStorage.setItem('refresh_token', 'rt');
      service.clearAll();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('removes rememberMe and savedUsername from localStorage', () => {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedUsername', 'testuser');
      service.clearAll();
      expect(localStorage.getItem('rememberMe')).toBeNull();
      expect(localStorage.getItem('savedUsername')).toBeNull();
    });

    it('emits null to currentUser$', () => {
      let emitted: UserData | null = mockUser;
      service.currentUser$.subscribe((u) => (emitted = u));
      service.clearAll();
      expect(emitted).toBeNull();
    });
  });

  describe('token storage', () => {
    it('setToken / getToken manage the access token in memory only', () => {
      service.setToken('mem-token');
      expect(service.getToken()).toBe('mem-token');
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('removeToken clears access token from memory', () => {
      service.setToken('mem-token');
      service.removeToken();
      expect(service.getToken()).toBeNull();
    });

    it('setRefreshToken writes to localStorage', () => {
      service.setRefreshToken('rt-value');
      expect(localStorage.getItem('refresh_token')).toBe('rt-value');
    });

    it('getRefreshToken reads from localStorage', () => {
      localStorage.setItem('refresh_token', 'rt-direct');
      expect(service.getRefreshToken()).toBe('rt-direct');
    });

    it('removeRefreshToken deletes from localStorage', () => {
      localStorage.setItem('refresh_token', 'rt-value');
      service.removeRefreshToken();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('password change flow', () => {
    it('sends correct payload for changePassword()', () => {
      service.changePassword('oldpass', 'newpass', 'newpass').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/change-password'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        oldPassword: 'oldpass',
        newPassword: 'newpass',
        confirmPassword: 'newpass',
      });
      req.flush({ success: true, message: 'ok' });
    });

    it('sends correct payload for forgotPassword()', () => {
      service.forgotPassword('test@example.com').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/forgot-password'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
      });
      req.flush({ success: true, message: 'ok' });
    });

    it('sends correct payload for resetPassword()', () => {
      service.resetPassword('reset-token', 'newpass', 'newpass').subscribe();

      const req = httpMock.expectOne((r) => r.url.includes('/reset-password'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        token: 'reset-token',
        newPassword: 'newpass',
        confirmPassword: 'newpass',
      });
      req.flush({ success: true, message: 'ok' });
    });
  });
});
