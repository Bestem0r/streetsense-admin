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
  private fb = inject(FormBuilder);
  private inspectorService = inject(InspectorService);
  submitted = false;

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
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

    if (this.form.invalid) {
      return;
    }

    const { firstName, lastName, email, phone, county, role, status } =
      this.form.value;
    const fullName = `${firstName} ${lastName}`;

    console.log('Add Inspector Form Submitted:', {
      name: fullName,
      email: email,
      phone: phone,
      county: county,
      role: role,
      status: status,
    });

    // TODO: Replace with actual service call
    this.form.reset({
      county: 'All Counties',
      role: 'Field Inspector',
      status: 'Active',
    });
    this.submitted = false;
    this.inspectorAdded.emit();
  }

  onCancel(): void {
    this.form.reset();
    this.submitted = false;
    this.cancelForm.emit();
  }
}
