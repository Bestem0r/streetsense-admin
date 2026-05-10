import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../service/auth.service';

const mockAuthService = { resetPassword: vi.fn() };
const mockRouter = { navigate: vi.fn() };
const queryParamsSubject = new BehaviorSubject<any>({
  token: 'test-reset-token',
});
const mockActivatedRoute = { queryParams: queryParamsSubject.asObservable() };

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    queryParamsSubject.next({ token: 'test-reset-token' });
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('ngOnInit()', () => {
    it('sets resetToken from query params', () => {
      expect(component.resetToken).toBe('test-reset-token');
    });
    it('sets errorMessage when token is missing', () => {
      queryParamsSubject.next({});
      component.ngOnInit();
      expect(component.errorMessage).toContain(
        'Invalid or missing reset token',
      );
    });
  });

  describe('passwordMatchValidator()', () => {
    it('returns null when passwords match', () => {
      component.resetPasswordForm.setValue({
        newPassword: 'abc123',
        confirmPassword: 'abc123',
      });
      expect(component.resetPasswordForm.errors).toBeNull();
    });
    it('returns passwordMismatch error when passwords differ', () => {
      component.resetPasswordForm.setValue({
        newPassword: 'abc123',
        confirmPassword: 'xyz789',
      });
      expect(component.resetPasswordForm.hasError('passwordMismatch')).toBe(
        true,
      );
    });
  });

  describe('togglePasswordVisibility()', () => {
    it('toggles isPasswordVisible and isConfirmPasswordVisible independently', () => {
      expect(component.isPasswordVisible).toBe(false);
      component.togglePasswordVisibility();
      expect(component.isPasswordVisible).toBe(true);
      component.togglePasswordVisibility();
      expect(component.isPasswordVisible).toBe(false);

      expect(component.isConfirmPasswordVisible).toBe(false);
      component.toggleConfirmPasswordVisibility();
      expect(component.isConfirmPasswordVisible).toBe(true);
    });
  });

  describe('onSubmit() — no token', () => {
    it('sets errorMessage and does not call authService', () => {
      component.resetToken = null;
      component.onSubmit();
      expect(component.errorMessage).toContain('Invalid reset token');
      expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit() — invalid form', () => {
    it('marks all controls touched and sets errorMessage', () => {
      component.resetPasswordForm.setValue({
        newPassword: '',
        confirmPassword: '',
      });
      component.onSubmit();
      expect(component.resetPasswordForm.get('newPassword')?.touched).toBe(
        true,
      );
      expect(component.resetPasswordForm.get('confirmPassword')?.touched).toBe(
        true,
      );
      expect(component.errorMessage).toBe(
        'Please fill in all required fields correctly',
      );
    });
  });

  describe('onSubmit() — success', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      component.resetPasswordForm.setValue({
        newPassword: 'newpass1',
        confirmPassword: 'newpass1',
      });
    });
    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('calls authService.resetPassword with token and passwords', () => {
      mockAuthService.resetPassword.mockReturnValue(of({ message: 'ok' }));
      component.onSubmit();
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'test-reset-token',
        'newpass1',
        'newpass1',
      );
    });
    it('sets successMessage from response', () => {
      mockAuthService.resetPassword.mockReturnValue(
        of({ message: 'Password updated!' }),
      );
      component.onSubmit();
      expect(component.successMessage).toBe('Password updated!');
    });
    it('uses default successMessage when response has no message', () => {
      mockAuthService.resetPassword.mockReturnValue(of({}));
      component.onSubmit();
      expect(component.successMessage).toContain('reset successfully');
    });
    it('navigates to /login after 2000ms', () => {
      mockAuthService.resetPassword.mockReturnValue(of({ message: 'ok' }));
      component.onSubmit();
      vi.advanceTimersByTime(2000);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('onSubmit() — error', () => {
    beforeEach(() => {
      component.resetPasswordForm.setValue({
        newPassword: 'newpass1',
        confirmPassword: 'newpass1',
      });
    });
    it('sets errorMessage from error.error.message', () => {
      mockAuthService.resetPassword.mockReturnValue(
        throwError(() => ({ error: { message: 'Token expired' } })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe('Token expired');
    });
    it('falls back to error.error.error.message', () => {
      mockAuthService.resetPassword.mockReturnValue(
        throwError(() => ({ error: { error: { message: 'Nested error' } } })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe('Nested error');
    });
    it('uses default message when server provides none', () => {
      mockAuthService.resetPassword.mockReturnValue(
        throwError(() => ({ error: {} })),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe(
        'Failed to reset password. Please try again.',
      );
    });
  });

  describe('getNewPasswordError()', () => {
    it('returns required message', () => {
      component.resetPasswordForm
        .get('newPassword')
        ?.setErrors({ required: true });
      expect(component.getNewPasswordError()).toBe('New password is required');
    });
    it('returns minlength message', () => {
      component.resetPasswordForm
        .get('newPassword')
        ?.setErrors({ minlength: {} });
      expect(component.getNewPasswordError()).toBe(
        'Password must be at least 6 characters',
      );
    });
    it('returns empty string when no errors', () => {
      component.resetPasswordForm.get('newPassword')?.setErrors(null);
      expect(component.getNewPasswordError()).toBe('');
    });
  });

  describe('getConfirmPasswordError()', () => {
    it('returns required message', () => {
      component.resetPasswordForm
        .get('confirmPassword')
        ?.setErrors({ required: true });
      expect(component.getConfirmPasswordError()).toBe(
        'Please confirm your password',
      );
    });
    it('returns minlength message', () => {
      component.resetPasswordForm
        .get('confirmPassword')
        ?.setErrors({ minlength: {} });
      expect(component.getConfirmPasswordError()).toBe(
        'Password must be at least 6 characters',
      );
    });
    it('returns mismatch message when form has passwordMismatch and field is touched', () => {
      component.resetPasswordForm.setValue({
        newPassword: 'abc123',
        confirmPassword: 'xyz789',
      });
      component.resetPasswordForm.get('confirmPassword')?.markAsTouched();
      expect(component.getConfirmPasswordError()).toBe(
        'Passwords do not match',
      );
    });
    it('returns empty string when no errors', () => {
      component.resetPasswordForm.get('confirmPassword')?.setErrors(null);
      expect(component.getConfirmPasswordError()).toBe('');
    });
  });
});
