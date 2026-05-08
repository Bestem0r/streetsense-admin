import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { CaptureInterface } from '../interfaces/Capture-interface';
import { PlanCaptureService } from '../service/plan-capture.service';
import { Toast } from '../utils/toast';

export interface CreateCaptureDialogData {
  poleIds: string[];
}

@Component({
  selector: 'app-create-capture-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './create-capture-dialog.component.html',
})
export class CreateCaptureDialogComponent {
  readonly data = inject<CreateCaptureDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<CreateCaptureDialogComponent>);
  private planCaptureService = inject(PlanCaptureService);
  private toast = inject(Toast);

  startDate = new Date().toISOString().split('T')[0];
  endDate = new Date().toISOString().split('T')[0];
  submitting = false;

  submit() {
    if (this.submitting) return;
    this.submitting = true;

    const capture: CaptureInterface = {
      id: crypto.randomUUID(),
      poles: this.data.poleIds,
      startDate: new Date(this.startDate).getTime(),
      endDate: new Date(this.endDate).getTime(),
      createdDate: Date.now(),
    };

    this.planCaptureService.createCapture(capture).subscribe({
      next: (created) => {
        this.toast.show('Capture round created!', 'Close', 3000);
        this.dialogRef.close(created);
      },
      error: () => {
        this.toast.show('Failed to create capture.', 'Close', 3000);
        this.submitting = false;
      },
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
