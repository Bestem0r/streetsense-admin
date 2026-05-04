/* eslint-disable @typescript-eslint/no-unused-vars */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Toast } from '../utils/toast';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PoleInterface } from '../interfaces/pole-interface';
import { LeafletMapComponent } from '../leaflet-map/leaflet-map.component';
import { NavComponent } from '../navbar/nav.component';
import { PolesService } from '../service/poles.service';

@Component({
  selector: 'app-inspection-editor',
  imports: [
    CommonModule,
    NavComponent,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    LeafletMapComponent,
    RouterLink,
  ],
  templateUrl: './inspection-editor.component.html',
  styleUrl: './inspection-editor.component.scss',
})
export class InspectionEditorComponent implements OnInit {
  form!: FormGroup;
  isModified = false;
  isCancelModalOpen = false;
  showInspectorDropdown = false;
  filteredInspectors: any[] = [];
  selectedInspector: any = null;
  private savedFormValue: Record<string, unknown> = {};
  private savedInspector: any = null;
  defaultDate = new Date().toISOString().split('T')[0];
  today: string = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  pickedDate: string = this.today;
  status = 'Not inspected';
  action = 'No action needed';
  selectedPole: PoleInterface | null = null;
  vegkategori = '';
  avstand = 0;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  durationInSeconds = 4;

  private toast = inject(Toast);
  private route = inject(ActivatedRoute);
  private polesService = inject(PolesService);
  private fb = inject(FormBuilder);
  imageId = '';
  imageNumber = 0; // this should be reconsidered.

  //TODO: This is hardcoded for now, but should be fetched from the backend.

  inspectors = [
    { id: 1, name: 'John Anderson', email: 'john.anderson@example.com' },
    { id: 2, name: 'Sarah Jensen', email: 'sarah.jensen@example.com' },
    { id: 3, name: 'Mike Thompson', email: 'mike.thompson@example.com' },
    { id: 4, name: 'Lisa Olsen', email: 'lisa.olsen@example.com' },
  ];

  ngOnInit() {
    this.imageId = this.route.snapshot.paramMap.get('imageId') || '';
    this.initializeForm();
    this.loadPoleData();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      inspectionDate: [this.defaultDate, [Validators.required]],
      status: ['', [Validators.required]],
      action: ['', [Validators.required]],
      inspector: ['', [Validators.required]],
      notes: ['', [Validators.maxLength(500)]],
    });
  }
  loadPoleData(): void {
    this.isLoading = true;
    const poleId = this.route.snapshot.paramMap.get('id');

    if (!poleId) {
      this.errorMessage = 'No pole ID provided';
      this.isLoading = false;
      return;
    }

    this.polesService.getPoleById(poleId).subscribe({
      next: async (pole: PoleInterface) => {
        this.selectedPole = pole;
        this.prepopulateForm(pole);
        this.isLoading = false;
      },
      error: (_err) => {
        this.errorMessage = 'Failed to load pole details';
        this.isLoading = false;
      },
    });
  }

  formatDateForInput(timestamp: number | string | undefined): string {
    if (!timestamp) return '';
    const date = new Date(
      typeof timestamp === 'string' ? parseInt(timestamp) : timestamp,
    );
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForSubmit(dateString: string): number {
    if (!dateString) return 0;
    return new Date(dateString).getTime();
  }

  /**
   * @description This method checks if there is existing inspection data for the current image and, if so, fills the form fields with that data.
   * @param pole The pole object containing the inspection data to pre-populate the form with.
   * @returns void
   *
   *
   */
  prepopulateForm(pole: PoleInterface): void {
    const currentImage = pole.images?.[this.imageNumber];
    if (!currentImage) return;

    const inspectionDateStr = currentImage.inspectionDate
      ? this.formatDateForInput(currentImage.inspectionDate)
      : this.defaultDate;

    this.form.patchValue({
      inspectionDate: inspectionDateStr,
      status: currentImage.inspectionStatus || '',
      action: currentImage.action || '',
      inspector: currentImage.assignedInspector || '',
      notes: currentImage.notes || '',
    });

    if (currentImage.assignedInspector) {
      const inspector = this.inspectors.find(
        (i) => i.id.toString() === currentImage.assignedInspector,
      );
      if (inspector) {
        this.selectedInspector = inspector;
      }
    }

    this.savedFormValue = { ...this.form.value };
    this.savedInspector = this.selectedInspector;
  }

  isFieldInvalid(fieldName: string): boolean {
    if (fieldName === 'inspectionDate') {
      return this.pickedDate === '';
    }
    return false;
  }

  getErrorMessage(fieldName: string): string {
    if (fieldName === 'inspectionDate' && this.pickedDate === '') {
      return 'Inspection Date is required';
    }
    return 'Invalid input';
  }

  filterInspectors(event: Event): void {
    const input = (event.target as HTMLInputElement).value.toLowerCase();
    if (input.length === 0) {
      this.filteredInspectors = [...this.inspectors];
    } else {
      this.filteredInspectors = this.inspectors.filter(
        (inspector) =>
          inspector.name.toLowerCase().includes(input) ||
          inspector.email.toLowerCase().includes(input),
      );
    }
  }

  selectInspector(inspector: any): void {
    this.selectedInspector = inspector;
    this.form.get('inspector')?.setValue(inspector.id);
    this.showInspectorDropdown = false;
    this.isModified = true;
  }

  showDropdown(): void {
    this.showInspectorDropdown = true;
    this.filteredInspectors = [...this.inspectors];
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showInspectorDropdown = false;
    }, 200);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  onSubmit() {
    if (this.form.valid) {
      if (!this.selectedPole?.images?.[this.imageNumber]) {
        return;
      }

      this.isSubmitting = true;
      this.errorMessage = '';

      const updatedImages = [...this.selectedPole.images];
      updatedImages[this.imageNumber] = {
        ...updatedImages[this.imageNumber],
        inspectionDate: this.formatDateForSubmit(
          this.form.get('inspectionDate')?.value,
        ),
        inspectionStatus: this.form.get('status')?.value,
        action: this.form.get('action')?.value,
        assignedInspector: String(this.selectedInspector?.id ?? ''),
        notes: this.form.get('notes')?.value || '',
      };

      const updatedPole: PoleInterface = {
        ...this.selectedPole,
        images: updatedImages,
      };

      this.polesService.updatePole(updatedPole).subscribe({
        next: (response) => {
          if (response.status === 200) {
            this.toast.show('Inspection saved successfully!', 'Close', 3000);
          }
          this.isSubmitting = false;
          this.isModified = false;
        },
        error: (_err) => {
          this.isSubmitting = false;
          this.errorMessage = 'Failed to save inspection. Please try again.';
          this.toast.show(this.errorMessage, 'Close', 3000);
        },
      });
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.form.get(fieldName);
    return field
      ? field.hasError(errorType) && (field.dirty || field.touched)
      : false;
  }

  isFieldTouched(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.touched : false;
  }

  cancelChanges() {
    if (this.isModified) {
      this.isCancelModalOpen = true;
    }
  }

  discardChanges() {
    this.form.patchValue(this.savedFormValue);
    this.selectedInspector = this.savedInspector;
    this.isModified = false;
    this.isCancelModalOpen = false;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.svg';
  }

  get notesLength(): number {
    return this.form.get('notes')?.value?.length || 0;
  }

  getCurrentImage() {
    if (!this.selectedPole?.images) return null;
    return this.selectedPole.images.find((img) => img.imageId === this.imageId);
  }
}
