import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../service/auth.service';

const mockAuthService = {
  login: vi.fn(),
  forgotPassword: vi.fn(),
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockReturnValue(undefined as unknown as void);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initializeForm()', () => {
    it('initializes with empty userName when localStorage has no saveduserName', () => {
      component.initializeForm();
      expect(component.loginForm.get('userName')?.value).toBe('');
    });

    it('pre-fills userName from saveduserName in localStorage', () => {
      localStorage.setItem('savedUsername', 'johndoe');
      component.initializeForm();
      expect(component.loginForm.get('userName')?.value).toBe('johndoe');
    });

    it('pre-checks rememberMe when localStorage has rememberMe=true', () => {
      localStorage.setItem('rememberMe', 'true');
      component.initializeForm();
      expect(component.loginForm.get('rememberMe')?.value).toBe(true);
    });

    it('leaves rememberMe unchecked when localStorage has no rememberMe entry', () => {
      component.initializeForm();
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
    });
  });

  describe('togglePasswordVisibility()', () => {
    it('toggles from false to true on first call', () => {
      expect(component.isPasswordVisible).toBe(false);
      component.togglePasswordVisibility();
      expect(component.isPasswordVisible).toBe(true);
    });

    it('toggles back to false on second call', () => {
      component.togglePasswordVisibility();
      component.togglePasswordVisibility();
      expect(component.isPasswordVisible).toBe(false);
    });
  });

  describe('getuserNameError()', () => {
    it('returns required message', () => {
      component.loginForm.controls['userName'].setErrors({ required: true });
      expect(component.getUsernameError()).toBe('Username is required');
    });

    it('returns minlength message', () => {
      component.loginForm.controls['userName'].setErrors({
        minlength: { requiredLength: 3 },
      });
      expect(component.getUsernameError()).toBe(
        'Username must be at least 3 characters',
      );
    });

    it('returns empty string when valid', () => {
      component.loginForm.controls['userName'].setErrors(null);
      expect(component.getUsernameError()).toBe('');
    });
  });

  describe('getPasswordError()', () => {
    it('returns required message', () => {
      component.loginForm.controls['password'].setErrors({ required: true });
      expect(component.getPasswordError()).toBe('Password is required');
    });

    it('returns minlength message', () => {
      component.loginForm.controls['password'].setErrors({
        minlength: { requiredLength: 6 },
      });
      expect(component.getPasswordError()).toBe(
        'Password must be at least 6 characters',
      );
    });

    it('returns empty string when valid', () => {
      component.loginForm.controls['password'].setErrors(null);
      expect(component.getPasswordError()).toBe('');
    });
  });

  describe('onSubmit() with invalid form', () => {
    it('marks all controls touched when form is invalid', () => {
      component.loginForm.setValue({
        userName: 'ab',
        password: '123',
        rememberMe: false,
      });
      component.onSubmit();
      expect(component.loginForm.controls['userName'].touched).toBe(true);
      expect(component.loginForm.controls['password'].touched).toBe(true);
    });
  });

  describe('onSubmit() — successful login', () => {
    const successResponse = {
      success: true,
      message: 'ok',
      data: {
        token: 'tok',
        refreshToken: 'rt',
        type: 'Bearer',
        expiresIn: 3600,
        user: {} as any,
      },
    };

    beforeEach(() => {
      component.loginForm.setValue({
        userName: 'testuser',
        password: 'password123',
        rememberMe: false,
      });
    });

    it('calls authService.login with form credentials', () => {
      mockAuthService.login.mockReturnValue(of(successResponse));
      component.onSubmit();
      expect(mockAuthService.login).toHaveBeenCalledWith({
        userName: 'testuser',
        password: 'password123',
        rememberMe: false,
      });
    });

    it('navigates to / on success', () => {
      mockAuthService.login.mockReturnValue(of(successResponse));
      component.onSubmit();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('saves rememberMe and saveduserName to localStorage when rememberMe is checked', () => {
      component.loginForm.setValue({
        userName: 'testuser',
        password: 'password123',
        rememberMe: true,
      });
      mockAuthService.login.mockReturnValue(of(successResponse));
      component.onSubmit();
      expect(localStorage.getItem('rememberMe')).toBe('true');
      expect(localStorage.getItem('savedUsername')).toBe('testuser');
    });

    it('clears rememberMe and saveduserName from localStorage when rememberMe is unchecked', () => {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedUsername', 'testuser');
      mockAuthService.login.mockReturnValue(of(successResponse));
      component.onSubmit();
      expect(localStorage.getItem('rememberMe')).toBeNull();
      expect(localStorage.getItem('savedUsername')).toBeNull();
    });
  });

  describe('onSubmit() — login error', () => {
    beforeEach(() => {
      component.loginForm.setValue({
        userName: 'testuser',
        password: 'password123',
        rememberMe: false,
      });
    });

    it('shows error.error.message from server response', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => ({ error: { message: 'Invalid credentials' } })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe('Invalid credentials');
    });

    it('shows nested error.error.error.message as fallback', () => {
      mockAuthService.login.mockReturnValue(
        throwError(() => ({ error: { error: { message: 'Account locked' } } })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe('Account locked');
    });
  });

  describe('openForgotPasswordModal()', () => {
    it('sets showForgotPasswordModal to true', () => {
      component.openForgotPasswordModal();
      expect(component.showForgotPasswordModal).toBe(true);
    });
  });

  describe('closeForgotPasswordModal()', () => {
    it('sets showForgotPasswordModal to false', () => {
      component.openForgotPasswordModal();
      component.closeForgotPasswordModal();
      expect(component.showForgotPasswordModal).toBe(false);
    });

    it('clears forgotPasswordMessage and forgotPasswordSuccess', () => {
      component.forgotPasswordMessage = 'msg';
      component.forgotPasswordSuccess = true;
      component.closeForgotPasswordModal();
      expect(component.forgotPasswordMessage).toBe('');
      expect(component.forgotPasswordSuccess).toBe(false);
    });
  });

  describe('submitForgotPassword() — invalid form', () => {
    beforeEach(() => component.openForgotPasswordModal());

    it('marks email touched when form is invalid', () => {
      component.forgotPasswordForm.setValue({ email: 'not-an-email' });
      component.submitForgotPassword();
      expect(component.forgotPasswordForm.get('email')?.touched).toBe(true);
    });

    it('sets forgotPasswordMessage when email is invalid', () => {
      component.forgotPasswordForm.setValue({ email: '' });
      component.submitForgotPassword();
      expect(component.forgotPasswordMessage).toBe(
        'Please enter a valid email address',
      );
    });
  });

  describe('submitForgotPassword() — success', () => {
    beforeEach(() => component.openForgotPasswordModal());

    it('calls authService.forgotPassword with the entered email', () => {
      mockAuthService.forgotPassword.mockReturnValue(
        of({ message: 'Email sent' }),
      );
      component.forgotPasswordForm.setValue({ email: 'user@example.com' });
      component.submitForgotPassword();
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        'user@example.com',
      );
    });

    it('sets forgotPasswordSuccess to true on success', () => {
      mockAuthService.forgotPassword.mockReturnValue(
        of({ message: 'Email sent' }),
      );
      component.forgotPasswordForm.setValue({ email: 'user@example.com' });
      component.submitForgotPassword();
      expect(component.forgotPasswordSuccess).toBe(true);
    });

    it('shows response.message when provided', () => {
      mockAuthService.forgotPassword.mockReturnValue(
        of({ message: 'Check your inbox!' }),
      );
      component.forgotPasswordForm.setValue({ email: 'user@example.com' });
      component.submitForgotPassword();
      expect(component.forgotPasswordMessage).toBe('Check your inbox!');
    });

    it('shows default message when response has no message', () => {
      mockAuthService.forgotPassword.mockReturnValue(of({}));
      component.forgotPasswordForm.setValue({ email: 'user@example.com' });
      component.submitForgotPassword();
      expect(component.forgotPasswordMessage).toBe(
        'Password reset link has been sent to your email. Please check your inbox.',
      );
    });
  });

  describe('submitForgotPassword() — error', () => {
    beforeEach(() => component.openForgotPasswordModal());

    it('shows error.error.message from server', () => {
      mockAuthService.forgotPassword.mockReturnValue(
        throwError(() => ({ error: { message: 'Email not found' } })),
      );
      component.forgotPasswordForm.setValue({ email: 'user@example.com' });
      component.submitForgotPassword();
      expect(component.forgotPasswordMessage).toBe('Email not found');
    });

    it('shows nested error.error.error.message as fallback', () => {
      mockAuthService.forgotPassword.mockReturnValue(
        throwError(() => ({ error: { error: { message: 'Server error' } } })),
      );
      component.forgotPasswordForm.setValue({ email: 'user@example.com' });
      component.submitForgotPassword();
      expect(component.forgotPasswordMessage).toBe('Server error');
    });

    it('shows default message when server provides no message', () => {
      mockAuthService.forgotPassword.mockReturnValue(
        throwError(() => ({ error: {} })),
      );
      component.forgotPasswordForm.setValue({ email: 'user@example.com' });
      component.submitForgotPassword();
      expect(component.forgotPasswordMessage).toBe(
        'Failed to send password reset email. Please try again.',
      );
    });
  });
});
