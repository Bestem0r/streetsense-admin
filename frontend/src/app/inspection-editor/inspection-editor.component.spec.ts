import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { InspectionEditorComponent } from './inspection-editor.component';
import { PolesService } from '../service/poles.service';
import { Toast } from '../utils/toast';
import { PoleInterface } from '../interfaces/pole-interface';

vi.mock('leaflet', () => {
  const stub = () => {
    const self: any = {
      addTo: vi.fn(() => self),
      setPosition: vi.fn(() => self),
      addLayer: vi.fn(() => self),
      removeLayer: vi.fn(() => self),
      clearLayers: vi.fn(() => self),
      on: vi.fn(() => self),
      off: vi.fn(() => self),
      remove: vi.fn(() => self),
      fitBounds: vi.fn(() => self),
      flyTo: vi.fn(() => self),
      setView: vi.fn(() => self),
      zoomIn: vi.fn(() => self),
      zoomOut: vi.fn(() => self),
      latLng: vi.fn(() => self),
      getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
      bindPopup: vi.fn(() => self),
      openPopup: vi.fn(() => self),
      setIcon: vi.fn(() => self),
      getBounds: vi.fn(() => ({
        toBBoxString: () => '',
        contains: vi.fn(() => false),
        getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
      })),
      latLngToContainerPoint: vi.fn(() => ({ x: 0, y: 0 })),
    };
    return self;
  };
  const L = {
    map: vi.fn(stub),
    layerGroup: vi.fn(stub),
    featureGroup: vi.fn(stub),
    FeatureGroup: function () {
      return stub();
    },
    icon: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
    tileLayer: vi.fn(stub),
    marker: vi.fn(stub),
    latLng: vi.fn(stub),
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: {
      extend: vi.fn(),
      Draw: function () {
        return stub();
      },
    },
    Draw: { Event: { CREATED: 'draw:created', DRAWSTOP: 'draw:drawstop' } },
    DomEvent: { stopPropagation: vi.fn() },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));
const POLE_ID = 'pole-123';
const IMAGE_ID = 'image-456';

const mockPole: PoleInterface = {
  id: POLE_ID,
  images: [
    {
      imageId: IMAGE_ID,
      capturedDate: 1715000000000,
      inspectionDate: 1715100000000,
      inspectionStatus: 'inspected',
      action: 'No action needed',
      assignedInspector: '1',
      notes: 'Test notes',
    },
  ],
};

const mockPolesService = {
  getPoleById: vi.fn(),
  updatePole: vi.fn(),
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
    mockActivatedRoute.snapshot.paramMap.get.mockImplementation(
      (key: string) =>
        key === 'id' ? POLE_ID : key === 'imageId' ? IMAGE_ID : null,
    );
    mockPolesService.getPoleById.mockReturnValue(of(mockPole));
    mockPolesService.updatePole.mockReturnValue(of({ status: 200 }));

    await TestBed.configureTestingModule({
      imports: [InspectionEditorComponent],
      providers: [
        { provide: PolesService, useValue: mockPolesService },
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
    it('reads imageId from route and calls getPoleById', () => {
      expect(component.imageId).toBe(IMAGE_ID);
      expect(mockPolesService.getPoleById).toHaveBeenCalledWith(POLE_ID);
    });

    it('sets selectedPole on success', () => {
      expect(component.selectedPole?.id).toBe(POLE_ID);
    });
  });
  describe('loadPoleData()', () => {
    it('sets errorMessage when no poleId in route', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
      component.loadPoleData();
      expect(component.errorMessage).toBe('No pole ID provided');
      expect(component.isLoading).toBe(false);
    });

    it('sets errorMessage on service error', () => {
      mockActivatedRoute.snapshot.paramMap.get.mockImplementation(
        (key: string) => (key === 'id' ? POLE_ID : null),
      );
      mockPolesService.getPoleById.mockReturnValue(
        throwError(() => new Error('Network error')),
      );
      component.loadPoleData();
      expect(component.errorMessage).toBe('Failed to load pole details');
      expect(component.isLoading).toBe(false);
    });
  });
  describe('initializeForm()', () => {
    it('status and action are required', () => {
      component.form.get('status')?.setValue('');
      component.form.get('action')?.setValue('');
      expect(component.form.get('status')?.hasError('required')).toBe(true);
      expect(component.form.get('action')?.hasError('required')).toBe(true);
    });

    it('notes has maxLength of 500', () => {
      component.form.get('notes')?.setValue('a'.repeat(501));
      expect(component.form.get('notes')?.hasError('maxlength')).toBe(true);
    });
  });
  describe('prepopulateForm()', () => {
    it('patches form values from pole image', () => {
      expect(component.form.get('status')?.value).toBe('inspected');
      expect(component.form.get('action')?.value).toBe('No action needed');
      expect(component.form.get('notes')?.value).toBe('Test notes');
    });

    it('sets selectedInspector by matching inspector id', () => {
      expect(component.selectedInspector?.id).toBe(1);
      expect(component.selectedInspector?.name).toBe('John Anderson');
    });

    it('does nothing when pole has no images', () => {
      const poleNoImages: PoleInterface = { id: 'x' };
      component.prepopulateForm(poleNoImages);
      expect(component.selectedInspector?.id).toBe(1); // unchanged
    });
  });

  describe('formatDateForInput()', () => {
    it('returns empty string for falsy input', () => {
      expect(component.formatDateForInput(undefined)).toBe('');
      expect(component.formatDateForInput(0)).toBe('');
    });

    it('formats a numeric timestamp to YYYY-MM-DD', () => {
      const ts = new Date(2025, 4, 10).getTime();
      const result = component.formatDateForInput(ts);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toContain('2025');
    });

  });

  describe('formatDateForSubmit()', () => {
    it('returns 0 for empty string', () => {
      expect(component.formatDateForSubmit('')).toBe(0);
    });

    it('converts date string to unix ms timestamp', () => {
      const result = component.formatDateForSubmit('2025-05-10');
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });
  });

  describe('filterInspectors()', () => {
    const makeEvent = (value: string) =>
      ({ target: { value } }) as unknown as Event;

    it('returns all inspectors on empty input', () => {
      component.filterInspectors(makeEvent(''));
      expect(component.filteredInspectors).toHaveLength(4);
    });

    it('filters by name (case-insensitive)', () => {
      component.filterInspectors(makeEvent('john'));
      expect(component.filteredInspectors).toHaveLength(1);
      expect(component.filteredInspectors[0].name).toBe('John Anderson');
    });

    it('filters by email', () => {
      component.filterInspectors(makeEvent('sarah.jensen'));
      expect(component.filteredInspectors).toHaveLength(1);
      expect(component.filteredInspectors[0].name).toBe('Sarah Jensen');
    });

  });
  describe('selectInspector()', () => {
    it('sets selectedInspector, updates form, hides dropdown, marks modified', () => {
      const inspector = { id: 2, name: 'Sarah Jensen', email: 'sarah@example.com' };
      component.selectInspector(inspector);
      expect(component.selectedInspector).toBe(inspector);
      expect(component.form.get('inspector')?.value).toBe(2);
      expect(component.showInspectorDropdown).toBe(false);
      expect(component.isModified).toBe(true);
    });
  });
  describe('showDropdown()', () => {
    it('shows dropdown and loads all inspectors', () => {
      component.showDropdown();
      expect(component.showInspectorDropdown).toBe(true);
      expect(component.filteredInspectors).toHaveLength(4);
    });
  });

  describe('hideDropdown()', () => {
    it('hides dropdown after 200ms', () => {
      vi.useFakeTimers();
      component.showInspectorDropdown = true;
      component.hideDropdown();
      expect(component.showInspectorDropdown).toBe(true);
      vi.advanceTimersByTime(200);
      expect(component.showInspectorDropdown).toBe(false);
      vi.useRealTimers();
    });
  });
  describe('getInitials()', () => {
    it('returns uppercase initials from name', () => {
      expect(component.getInitials('John Anderson')).toBe('JA');
      expect(component.getInitials('Sarah Jensen')).toBe('SJ');
      expect(component.getInitials('Mike')).toBe('M');
    });
  });
  describe('onSubmit()', () => {
    beforeEach(() => {
      component.form.setValue({
        inspectionDate: '2025-05-10',
        status: 'inspected',
        action: 'No action needed',
        inspector: '1',
        notes: 'Notes',
      });
    });

    it('marks all controls touched when form is invalid', () => {
      component.form.get('status')?.setValue('');
      component.onSubmit();
      expect(component.form.get('status')?.touched).toBe(true);
    });

    it('returns early when selectedPole has no images', () => {
      component.selectedPole = { id: 'x' };
      component.onSubmit();
      expect(mockPolesService.updatePole).not.toHaveBeenCalled();
    });

    it('calls updatePole with updated image data on valid submit', () => {
      component.onSubmit();
      expect(mockPolesService.updatePole).toHaveBeenCalledOnce();
      const updatedPole: PoleInterface =
        mockPolesService.updatePole.mock.calls[0][0];
      expect(updatedPole.images?.[0].inspectionStatus).toBe('inspected');
      expect(updatedPole.images?.[0].action).toBe('No action needed');
      expect(updatedPole.images?.[0].notes).toBe('Notes');
    });

    it('shows toast and resets flags on success', () => {
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

  describe('hasError()', () => {
    it('returns true when field has error and is touched', () => {
      component.form.get('status')?.setErrors({ required: true });
      component.form.get('status')?.markAsTouched();
      expect(component.hasError('status', 'required')).toBe(true);
    });

    it('returns false when field has error but is not touched or dirty', () => {
      component.form.get('status')?.setErrors({ required: true });
      expect(component.hasError('status', 'required')).toBe(false);
    });

  });

  describe('cancelChanges()', () => {
    it('opens modal only when isModified is true', () => {
      component.isModified = false;
      component.cancelChanges();
      expect(component.isCancelModalOpen).toBe(false);

      component.isModified = true;
      component.cancelChanges();
      expect(component.isCancelModalOpen).toBe(true);
    });
  });

  describe('discardChanges()', () => {
    it('restores saved form values and clears flags', () => {
      component.form.patchValue({ notes: 'edited' });
      component.isModified = true;
      component.isCancelModalOpen = true;
      component.discardChanges();
      expect(component.isModified).toBe(false);
      expect(component.isCancelModalOpen).toBe(false);
    });
  });

  describe('notesLength', () => {
    it('returns character count of notes field', () => {
      component.form.get('notes')?.setValue('hello');
      expect(component.notesLength).toBe(5);
    });

  });

  describe('getCurrentImage()', () => {
    it('returns image matching imageId', () => {
      const img = component.getCurrentImage();
      expect(img?.imageId).toBe(IMAGE_ID);
    });

    it('returns null when selectedPole has no images', () => {
      component.selectedPole = { id: 'x' };
      expect(component.getCurrentImage()).toBeNull();
    });

    it('returns undefined when no image matches imageId', () => {
      component.imageId = 'no-match';
      expect(component.getCurrentImage()).toBeUndefined();
    });
  });

  describe('isFieldInvalid()', () => {
    it('returns true when inspectionDate field and pickedDate is empty', () => {
      component.pickedDate = '';
      expect(component.isFieldInvalid('inspectionDate')).toBe(true);
    });

    it('returns false for other fields regardless', () => {
      expect(component.isFieldInvalid('status')).toBe(false);
    });
  });

  describe('getErrorMessage()', () => {
    it('returns date required message when pickedDate is empty', () => {
      component.pickedDate = '';
      expect(component.getErrorMessage('inspectionDate')).toBe(
        'Inspection Date is required',
      );
    });

    it('returns generic message for other fields', () => {
      expect(component.getErrorMessage('status')).toBe('Invalid input');
    });
  });
});
