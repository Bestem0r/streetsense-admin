import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CreateCaptureDialogComponent } from './create-capture-dialog.component';
import { PlanCaptureService } from '../service/plan-capture.service';
import { Toast } from '../utils/toast';
import { CaptureInterface } from '../interfaces/Capture-interface';

const POLE_IDS = ['pole-1', 'pole-2'];

const mockDialogRef = { close: vi.fn() };
const mockPlanCaptureService = { createCapture: vi.fn() };
const mockToast = { show: vi.fn() };

const createdCapture: CaptureInterface = {
  id: 'cap-1',
  poles: POLE_IDS,
  startDate: 1710460800000,
  endDate: 1710547200000,
  createdDate: 1710460800000,
};

describe('CreateCaptureDialogComponent', () => {
  let component: CreateCaptureDialogComponent;
  let fixture: ComponentFixture<CreateCaptureDialogComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPlanCaptureService.createCapture.mockReturnValue(of(createdCapture));

    await TestBed.configureTestingModule({
      imports: [CreateCaptureDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { poleIds: POLE_IDS } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: PlanCaptureService, useValue: mockPlanCaptureService },
        { provide: Toast, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCaptureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('initial state', () => {
    it('injects poleIds from dialog data', () => {
      expect(component.data.poleIds).toEqual(POLE_IDS);
    });

    it('initialises startDate and endDate to today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(component.startDate).toBe(today);
      expect(component.endDate).toBe(today);
    });

    it('submitting is false on init', () => {
      expect(component.submitting).toBe(false);
    });
  });

  describe('submit()', () => {
    it('calls createCapture with correct pole ids', () => {
      component.submit();
      const arg: CaptureInterface = mockPlanCaptureService.createCapture.mock.calls[0][0];
      expect(arg.poles).toEqual(POLE_IDS);
    });

    it('capture has valid id (uuid format)', () => {
      component.submit();
      const arg: CaptureInterface = mockPlanCaptureService.createCapture.mock.calls[0][0];
      expect(arg.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('converts startDate and endDate strings to epoch ms', () => {
      component.startDate = '2024-03-15';
      component.endDate = '2024-03-20';
      component.submit();
      const arg: CaptureInterface = mockPlanCaptureService.createCapture.mock.calls[0][0];
      expect(arg.startDate).toBe(new Date('2024-03-15').getTime());
      expect(arg.endDate).toBe(new Date('2024-03-20').getTime());
    });

    it('sets createdDate to approximately now', () => {
      const before = Date.now();
      component.submit();
      const after = Date.now();
      const arg: CaptureInterface = mockPlanCaptureService.createCapture.mock.calls[0][0];
      expect(arg.createdDate).toBeGreaterThanOrEqual(before);
      expect(arg.createdDate).toBeLessThanOrEqual(after);
    });

    it('shows success toast and closes dialog on success', () => {
      component.submit();
      expect(mockToast.show).toHaveBeenCalledWith('Capture round created!', 'Close', 3000);
      expect(mockDialogRef.close).toHaveBeenCalledWith(createdCapture);
    });

    it('shows error toast and resets submitting on error', () => {
      mockPlanCaptureService.createCapture.mockReturnValue(throwError(() => new Error('fail')));
      component.submit();
      expect(mockToast.show).toHaveBeenCalledWith('Failed to create capture.', 'Close', 3000);
      expect(component.submitting).toBe(false);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('does nothing when already submitting', () => {
      component.submitting = true;
      component.submit();
      expect(mockPlanCaptureService.createCapture).not.toHaveBeenCalled();
    });

    it('sets submitting to true during request', () => {
      let submittingDuringCall = false;
      mockPlanCaptureService.createCapture.mockImplementation(() => {
        submittingDuringCall = component.submitting;
        return of(createdCapture);
      });
      component.submit();
      expect(submittingDuringCall).toBe(true);
    });
  });

  describe('cancel()', () => {
    it('closes dialog without value', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('does not call createCapture', () => {
      component.cancel();
      expect(mockPlanCaptureService.createCapture).not.toHaveBeenCalled();
    });
  });
});
