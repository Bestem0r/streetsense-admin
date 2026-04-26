import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { InspectorService } from '../service/inspector.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-add-inspector',
  imports: [CommonModule, ReactiveFormsModule, MatIcon],
  templateUrl: './add-inspector.component.html',
  styleUrl: './add-inspector.component.scss',
})
export class AddInspectorComponent {
  @Output() inspectorAdded = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  form: FormGroup;
  isLoading = false;
  errorMessage = '';
  private fb = inject(FormBuilder);
  private inspectorService = inject(InspectorService);
  private authService = inject(AuthService);
  submitted = false;

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      county: ['All Counties'],
      role: ['Field Inspector'],
      status: ['Active'],
    });
  }

  get firstNameInitial(): string {
    const firstName = (this.form.get('firstName')?.value || '').trim();
    const lastName = (this.form.get('lastName')?.value || '').trim();

    const first = firstName[0] || '';
    const last = lastName[0] || '';

    return (first + last).toUpperCase();
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.form.invalid) {
      return;
    }

    // Validate password match
    if (
      this.form.get('password')?.value !==
      this.form.get('confirmPassword')?.value
    ) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    const {
      firstName,
      lastName,
      email,
      phone,
      username,
      password,
      confirmPassword,
    } = this.form.value;

    this.authService
      .register({
        username,
        email,
        firstName,
        lastName,
        password,
        confirmPassword,
        phoneNumber: phone,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.submitted = false;
            this.isLoading = false;
            this.inspectorAdded.emit();
          }
        },
        error: (error) => {
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.error?.error?.message) {
            this.errorMessage = error.error.error.message;
          } else {
            this.errorMessage =
              'Failed to register inspector. Please try again.';
          }
          this.isLoading = false;
        },
      });
  }

  onCancel(): void {
    this.form.reset();
    this.submitted = false;
    this.cancelForm.emit();
  }
}
