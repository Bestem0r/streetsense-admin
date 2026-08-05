import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { Toast } from './toast';

const mockSnackBar = { open: vi.fn() };

describe('Toast', () => {
  let toast: Toast;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        Toast,
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });
    toast = TestBed.inject(Toast);
  });

  it('should be created', () => {
    expect(toast).toBeTruthy();
  });

  it('calls MatSnackBar.open with correct arguments', () => {
    toast.show('Saved!', 'Close', 3000);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Saved!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  });

  it('passes through different messages', () => {
    toast.show('Error occurred', 'Dismiss', 5000);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error occurred', 'Dismiss', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  });

  it('always uses center horizontal and top vertical position', () => {
    toast.show('Any message', 'OK', 1000);
    const config = mockSnackBar.open.mock.calls[0][2];
    expect(config.horizontalPosition).toBe('center');
    expect(config.verticalPosition).toBe('top');
  });

  it('calls open exactly once per show call', () => {
    toast.show('msg', 'x', 1000);
    expect(mockSnackBar.open).toHaveBeenCalledTimes(1);
  });
});
