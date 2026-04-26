import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    MatIconModule,
    FontAwesomeModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  faEyeSlash = faEyeSlash;
  faEye = faEye;
  isPasswordVisible = false;
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  showForgotPasswordModal = false;
  forgotPasswordForm!: FormGroup;
  forgotPasswordLoading = false;
  forgotPasswordMessage = '';
  forgotPasswordSuccess = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedUsername = localStorage.getItem('savedUsername') || '';

    this.loginForm = this.fb.group({
      username: [savedUsername, [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [rememberMe],
    });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    this.isLoading = true;
    const { username, password, rememberMe } = this.loginForm.value;

    this.authService.login({ username, password, rememberMe }).subscribe({
      next: (response) => {
        if (response.success) {
          if (rememberMe) {
            localStorage.setItem('savedUsername', username);
          }
          this.router.navigate(['/']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage =
            error.error?.error?.message || 'Login failed. Please try again.';
        }
        this.isLoading = false;
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getUsernameError(): string {
    const control = this.loginForm.get('username');
    if (control?.hasError('required')) {
      return 'Username is required';
    }
    if (control?.hasError('minlength')) {
      return 'Username must be at least 3 characters';
    }
    return '';
  }

  getPasswordError(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  openForgotPasswordModal(): void {
    this.errorMessage = '';
    this.showForgotPasswordModal = true;
    // Clear login form error message
    this.forgotPasswordMessage = '';
    this.forgotPasswordSuccess = false;
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  closeForgotPasswordModal(): void {
    this.showForgotPasswordModal = false;
    this.forgotPasswordMessage = '';
    this.forgotPasswordSuccess = false;
  }

  submitForgotPassword(): void {
    this.forgotPasswordMessage = '';

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.get('email')?.markAsTouched();
      this.forgotPasswordMessage = 'Please enter a valid email address';
      return;
    }

    this.forgotPasswordLoading = true;
    const email = this.forgotPasswordForm.get('email')?.value;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        console.log('Forgot password response:', response);
        this.forgotPasswordLoading = false;
        this.forgotPasswordSuccess = true;
        this.forgotPasswordMessage =
          response.message ||
          'Password reset link has been sent to your email. Please check your inbox.';
      },
      error: (error) => {
        this.forgotPasswordLoading = false;
        if (error.error?.message) {
          this.forgotPasswordMessage = error.error.message;
        } else {
          this.forgotPasswordMessage =
            error.error?.error?.message ||
            'Failed to send password reset email. Please try again.';
        }
      },
    });
  }
}
