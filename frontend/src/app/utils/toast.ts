import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class Toast {
  private _snackBar = inject(MatSnackBar);

  show(message: string, action: string, duration: number) {
    this._snackBar.open(message, action, {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
