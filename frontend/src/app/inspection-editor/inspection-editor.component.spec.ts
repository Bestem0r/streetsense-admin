import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { InspectionEditorComponent } from './inspection-editor.component';
import { PolesService } from '../service/poles.service';
import { InspectorService, Inspector } from '../service/inspector.service';
import { Toast } from '../utils/toast';
import { PoleInterface } from '../interfaces/pole-interface';

const POLE_ID = 'pole-123';
const IMAGE_ID = 'image-456';

const INSPECTOR: Inspector = {
  id: 'insp-1',
  firstName: 'Lars',
  lastName: 'Hansen',
  email: 'lars@example.com',
  role: 'Inspector',
};

const mockPole: PoleInterface = {
  id: POLE_ID,
  county: 'Troms',
  assignedInspector: INSPECTOR.id,
  images: [
    {
      imageId: IMAGE_ID,
      capturedDate: 1710460800000, // 2024-03-15
      inspectionDate: 1710547200000,
      inspectionStatus: 'Inspected',
      action: 'No Action needed',
      notes: 'Looks fine',
    },
  ],
};

const mockPolesService = {
  getPoleById: vi.fn(),
  updatePole: vi.fn(),
};

const mockInspectorService = {
  getInspectors: vi.fn(),
};

const mockToast = { show: vi.fn() };

const mockActivatedRoute = {
  snapshot: {
    paramMap: {
      get: vi.fn((key: string) =>
        key === 'id' ? POLE_ID : key === 'imageId' ? IMAGE_ID : null,
      ),
    },
  },
};

describe('InspectionEditorComponent', () => {
  let component: InspectionEditorComponent;
  let fixture: ComponentFixture<InspectionEditorComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPolesService.getPoleById.mockReturnValue(of(mockPole));
    mockPolesService.updatePole.mockReturnValue(
      of(new HttpResponse({ status: 200 })),
    );
    mockInspectorService.getInspectors.mockReturnValue(of([INSPECTOR]));

    await TestBed.configureTestingModule({
      imports: [InspectionEditorComponent],
      providers: [
        { provide: PolesService, useValue: mockPolesService },
        { provide: InspectorService, useValue: mockInspectorService },
        { provide: Toast, useValue: mockToast },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InspectionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('ngOnInit()', () => {
    it('reads imageId and poleId from route', () => {
      expect(component.imageId).toBe(IMAGE_ID);
      expect(mockPolesService.getPoleById).toHaveBeenCalledWith(POLE_ID);
    });

    it('sets selectedPole on success', () => {
      expect(component.selectedPole?.id).toBe(POLE_ID);
    });

    it('sets imageNumber by matching imageId in images array', () => {
      expect(component.imageNumber).toBe(0);
    });

    it('sets errorMessage when no poleId in route', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
      component.ngOnInit();
      expect(component.errorMessage).toBe('No pole ID provided');
      expect(component.isLoading).toBe(false);
    });

    it('sets errorMessage on service error', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockImplementation(
        (key: string) => (key === 'id' ? POLE_ID : null),
      );
      mockPolesService.getPoleById.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      component.ngOnInit();
      expect(component.errorMessage).toBe('Failed to load pole details');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('initializeForm()', () => {
    it('creates form with inspectionDate, action, inspector, notes fields', () => {
      expect(component.form.contains('inspectionDate')).toBe(true);
      expect(component.form.contains('action')).toBe(true);
      expect(component.form.contains('inspector')).toBe(true);
      expect(component.form.contains('notes')).toBe(true);
    });

    it('action field is required', () => {
      component.form.get('action')?.setValue('');
      expect(component.form.get('action')?.hasError('required')).toBe(true);
    });

    it('notes has maxLength of 500', () => {
      component.form.get('notes')?.setValue('a'.repeat(501));
      expect(component.form.get('notes')?.hasError('maxlength')).toBe(true);
    });

    it('does NOT have a status field', () => {
      expect(component.form.contains('status')).toBe(false);
    });
  });

  describe('prepopulateForm()', () => {
    it('patches form from current image', () => {
      expect(component.form.get('action')?.value).toBe('No Action needed');
      expect(component.form.get('notes')?.value).toBe('Looks fine');
    });

    it('sets selectedInspector by matching assignedInspector id', () => {
      expect(component.selectedInspector?.id).toBe(INSPECTOR.id);
    });

    it('does nothing when pole has no images', () => {
      component.selectedInspector = null;
      component.prepopulateForm({ id: 'x' });
      expect(component.selectedInspector).toBeNull();
    });
  });
  describe('formatDateForInput()', () => {
    it('returns empty string for falsy input', () => {
      expect(component.formatDateForInput(undefined)).toBe('');
      expect(component.formatDateForInput(0)).toBe('');
    });

    it('formats epoch ms to YYYY-MM-DD', () => {
      expect(component.formatDateForInput(1710460800000)).toMatch(
        /^2024-03-1\d$/,
      );
    });

    it('accepts string timestamps', () => {
      expect(component.formatDateForInput('1710460800000')).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
    });
  });
  describe('formatDateForSubmit()', () => {
    it('returns 0 for empty string', () => {
      expect(component.formatDateForSubmit('')).toBe(0);
    });

    it('converts YYYY-MM-DD to epoch ms', () => {
      const result = component.formatDateForSubmit('2024-03-15');
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });
  });
  describe('selectAction()', () => {
    it('sets action and marks modified when value differs', () => {
      component.form.get('action')?.setValue('No Action needed');
      component.isModified = false;
      component.selectAction('Replace');
      expect(component.form.get('action')?.value).toBe('Replace');
      expect(component.isModified).toBe(true);
    });

    it('does NOT set isModified when same value selected', () => {
      component.form.get('action')?.setValue('Replace');
      component.isModified = false;
      component.selectAction('Replace');
      expect(component.isModified).toBe(false);
    });
  });

  describe('inspectorFullName()', () => {
    it('returns firstName + lastName', () => {
      expect(component.inspectorFullName(INSPECTOR)).toBe('Lars Hansen');
    });

    it('falls back to email when name is empty', () => {
      const i: Inspector = { id: 'x', email: 'x@example.com' };
      expect(component.inspectorFullName(i)).toBe('x@example.com');
    });
  });

  describe('filterInspectors()', () => {
    const makeEvent = (value: string) =>
      ({ target: { value } }) as unknown as Event;

    beforeEach(() => {
      component.inspectors = [INSPECTOR];
    });

    it('returns all inspectors on empty input', () => {
      component.filterInspectors(makeEvent(''));
      expect(component.filteredInspectors).toHaveLength(1);
    });

    it('filters by first name (case-insensitive)', () => {
      component.filterInspectors(makeEvent('lars'));
      expect(component.filteredInspectors[0].id).toBe(INSPECTOR.id);
    });

    it('filters by email', () => {
      component.filterInspectors(makeEvent('lars@example'));
      expect(component.filteredInspectors).toHaveLength(1);
    });

    it('returns empty array when no match', () => {
      component.filterInspectors(makeEvent('zzz'));
      expect(component.filteredInspectors).toHaveLength(0);
    });
  });

  describe('selectInspector()', () => {
    it('sets selectedInspector, updates form field, hides dropdown, marks modified', () => {
      component.selectInspector(INSPECTOR);
      expect(component.selectedInspector).toBe(INSPECTOR);
      expect(component.form.get('inspector')?.value).toBe(INSPECTOR.id);
      expect(component.showInspectorDropdown).toBe(false);
      expect(component.isModified).toBe(true);
    });
  });

  describe('changeInspector()', () => {
    it('clears selectedInspector, shows dropdown, marks modified', () => {
      component.selectedInspector = INSPECTOR;
      component.changeInspector();
      expect(component.selectedInspector).toBeNull();
      expect(component.showInspectorDropdown).toBe(true);
      expect(component.isModified).toBe(true);
    });
  });

  describe('showDropdown()', () => {
    it('opens dropdown and loads all inspectors', () => {
      component.inspectors = [INSPECTOR];
      component.showInspectorDropdown = false;
      component.showDropdown();
      expect(component.showInspectorDropdown).toBe(true);
      expect(component.filteredInspectors).toEqual([INSPECTOR]);
    });
  });
  describe('hideDropdown()', () => {
    it('hides dropdown after 200ms delay', () => {
      vi.useFakeTimers();
      component.showInspectorDropdown = true;
      component.hideDropdown();
      expect(component.showInspectorDropdown).toBe(true);
      vi.advanceTimersByTime(200);
      expect(component.showInspectorDropdown).toBe(false);
      vi.useRealTimers();
    });

    it('does not hide before 200ms', () => {
      vi.useFakeTimers();
      component.showInspectorDropdown = true;
      component.hideDropdown();
      vi.advanceTimersByTime(199);
      expect(component.showInspectorDropdown).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('getInitials()', () => {
    it('returns uppercase initials', () => {
      expect(component.getInitials('Lars Hansen')).toBe('LH');
      expect(component.getInitials('Erik')).toBe('E');
    });
  });
  describe('onSubmit()', () => {
    beforeEach(() => {
      component.form.setValue({
        inspectionDate: '2024-03-15',
        action: 'No Action needed',
        inspector: INSPECTOR.id,
        notes: 'Updated notes',
      });
      component.selectedInspector = INSPECTOR;
    });

    it('returns early when selectedPole has no images', () => {
      component.selectedPole = { id: 'x' };
      component.onSubmit();
      expect(mockPolesService.updatePole).not.toHaveBeenCalled();
    });

    it('marks all controls touched when form invalid', () => {
      component.form.get('action')?.setValue('');
      component.onSubmit();
      expect(component.form.get('action')?.touched).toBe(true);
      expect(mockPolesService.updatePole).not.toHaveBeenCalled();
    });

    it('always sets inspectionStatus to Inspected', () => {
      component.onSubmit();
      const saved: PoleInterface = mockPolesService.updatePole.mock.calls[0][0];
      expect(saved.images?.[0].inspectionStatus).toBe('Inspected');
    });

    it('preserves existing dueDate when action unchanged', () => {
      component.selectedPole!.images![0].dueDate = 9999999;
      component.selectedPole!.images![0].action = 'No Action needed';
      component.form.get('action')?.setValue('No Action needed');
      component.onSubmit();
      const saved: PoleInterface = mockPolesService.updatePole.mock.calls[0][0];
      expect(saved.images?.[0].dueDate).toBe(9999999);
    });

    it('computes dueDate = capturedDate + 28 days when action changes to Replace', () => {
      component.form.get('action')?.setValue('Replace');
      component.onSubmit();
      const saved: PoleInterface = mockPolesService.updatePole.mock.calls[0][0];
      const capturedDate = mockPole.images![0].capturedDate!;
      const expectedDue = (() => {
        const d = new Date(capturedDate);
        d.setDate(d.getDate() + 28);
        return d.getTime();
      })();
      expect(saved.images?.[0].dueDate).toBe(expectedDue);
    });

    it('computes dueDate = capturedDate + 7 days when action changes to Reposition/Realign', () => {
      component.form.get('action')?.setValue('Reposition/Realign');
      component.onSubmit();
      const saved: PoleInterface = mockPolesService.updatePole.mock.calls[0][0];
      const capturedDate = mockPole.images![0].capturedDate!;
      const expectedDue = (() => {
        const d = new Date(capturedDate);
        d.setDate(d.getDate() + 7);
        return d.getTime();
      })();
      expect(saved.images?.[0].dueDate).toBe(expectedDue);
    });

    it('shows success toast and resets flags on 200', () => {
      component.onSubmit();
      expect(mockToast.show).toHaveBeenCalledWith(
        'Inspection saved successfully!',
        'Close',
        3000,
      );
      expect(component.isSubmitting).toBe(false);
      expect(component.isModified).toBe(false);
    });

    it('sets errorMessage and shows toast on error', () => {
      mockPolesService.updatePole.mockReturnValue(
        throwError(() => new Error('fail')),
      );
      component.onSubmit();
      expect(component.errorMessage).toBe(
        'Failed to save inspection. Please try again.',
      );
      expect(mockToast.show).toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });
  });
  describe('cancelChanges()', () => {
    it('opens modal only when isModified', () => {
      component.isModified = false;
      component.cancelChanges();
      expect(component.isCancelModalOpen).toBe(false);

      component.isModified = true;
      component.cancelChanges();
      expect(component.isCancelModalOpen).toBe(true);
    });
  });

  describe('discardChanges()', () => {
    it('restores saved form + inspector and clears flags', () => {
      component.form.get('notes')?.setValue('dirty');
      component.isModified = true;
      component.isCancelModalOpen = true;
      component.discardChanges();
      expect(component.form.get('notes')?.value).toBe('Looks fine');
      expect(component.isModified).toBe(false);
      expect(component.isCancelModalOpen).toBe(false);
    });
  });

  describe('notesLength', () => {
    it('returns character count', () => {
      component.form.get('notes')?.setValue('hello');
      expect(component.notesLength).toBe(5);
    });

    it('returns 0 for empty notes', () => {
      component.form.get('notes')?.setValue('');
      expect(component.notesLength).toBe(0);
    });
  });

  describe('getCurrentImage()', () => {
    it('returns image matching imageId', () => {
      component.imageId = IMAGE_ID;
      expect(component.getCurrentImage()?.imageId).toBe(IMAGE_ID);
    });

    it('returns null when selectedPole has no images', () => {
      component.selectedPole = { id: 'x' };
      expect(component.getCurrentImage()).toBeNull();
    });

    it('returns undefined when imageId does not match', () => {
      component.imageId = 'no-match';
      expect(component.getCurrentImage()).toBeUndefined();
    });
  });

  describe('isFieldInvalid()', () => {
    it('returns true for inspectionDate when pickedDate is empty', () => {
      component.pickedDate = '';
      expect(component.isFieldInvalid('inspectionDate')).toBe(true);
    });

    it('returns false for other fields', () => {
      expect(component.isFieldInvalid('action')).toBe(false);
    });
  });

  describe('isFieldTouched()', () => {
    it('returns true when field is touched', () => {
      component.form.get('action')?.markAsTouched();
      expect(component.isFieldTouched('action')).toBe(true);
    });

    it('returns false when field is not touched', () => {
      component.form.get('action')?.markAsUntouched();
      expect(component.isFieldTouched('action')).toBe(false);
    });

    it('returns false for non-existent field', () => {
      expect(component.isFieldTouched('nonexistent')).toBe(false);
    });
  });

  describe('hasError()', () => {
    it('returns true when field has error and is touched', () => {
      component.form.get('action')?.setErrors({ required: true });
      component.form.get('action')?.markAsTouched();
      expect(component.hasError('action', 'required')).toBe(true);
    });

    it('returns false when field has error but not touched', () => {
      component.form.get('action')?.setErrors({ required: true });
      expect(component.hasError('action', 'required')).toBe(false);
    });
  });
});
