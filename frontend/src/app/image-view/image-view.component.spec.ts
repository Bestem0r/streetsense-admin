import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ImageViewComponent } from './image-view.component';
import { PolesService } from '../service/poles.service';
import { InspectorService, Inspector } from '../service/inspector.service';
import { PoleInterface } from '../interfaces/pole-interface';

vi.mock('leaflet', () => {
  const stub = () => {
    const self: any = {
      addTo: vi.fn(() => self), on: vi.fn(() => self), off: vi.fn(() => self),
      remove: vi.fn(() => self), setView: vi.fn(() => self), fitBounds: vi.fn(() => self),
      addLayer: vi.fn(() => self), removeLayer: vi.fn(() => self),
      clearLayers: vi.fn(() => self), bindPopup: vi.fn(() => self),
      openPopup: vi.fn(() => self), setIcon: vi.fn(() => self),
      getBounds: vi.fn(() => ({
        toBBoxString: () => '', contains: vi.fn(() => false),
        getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
      })),
    };
    return self;
  };
  const L: any = {
    map: vi.fn(stub), layerGroup: vi.fn(stub), featureGroup: vi.fn(stub),
    FeatureGroup: function () { return stub(); },
    icon: vi.fn(() => ({})), divIcon: vi.fn(() => ({})),
    tileLayer: vi.fn(stub), marker: vi.fn(stub), latLng: vi.fn(stub),
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: { extend: vi.fn(), Draw: function () { return stub(); } },
    Draw: { Event: { CREATED: 'draw:created', DRAWSTOP: 'draw:drawstop' } },
    DomEvent: { stopPropagation: vi.fn() },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const POLE_ID = 'pole-123';

const INSPECTOR: Inspector = {
  id: 'insp-1', firstName: 'Lars', lastName: 'Hansen', email: 'lars@example.com',
};

const mockPole: PoleInterface = {
  id: POLE_ID,
  county: 'Troms',
  assignedInspector: INSPECTOR.id,
  images: [
    { imageId: 'img-b', capturedDate: 1710547200000, inspectionStatus: 'Inspected', action: 'Replace' },
    { imageId: 'img-a', capturedDate: 1710460800000, inspectionStatus: 'Inspected', action: 'No Action needed' },
    { imageId: 'img-c', capturedDate: 1710633600000, inspectionStatus: 'Not Inspected', action: '' },
  ],
};

const mockPolesService = { getPoleById: vi.fn() };
const mockInspectorService = { getInspectorById: vi.fn() };
const mockActivatedRoute = {
  paramMap: of(convertToParamMap({ id: POLE_ID })),
};

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('ImageViewComponent', () => {
  let component: ImageViewComponent;
  let fixture: ComponentFixture<ImageViewComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPolesService.getPoleById.mockReturnValue(of(mockPole));
    mockInspectorService.getInspectorById.mockReturnValue(of(INSPECTOR));
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [ImageViewComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: PolesService, useValue: mockPolesService },
        { provide: InspectorService, useValue: mockInspectorService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  // ── ngOnInit ───────────────────────────────────────────────────────────────
  describe('ngOnInit()', () => {
    it('reads pole id from route paramMap', () => {
      expect(component.id).toBe(POLE_ID);
    });

    it('calls getPoleById with route id', () => {
      expect(mockPolesService.getPoleById).toHaveBeenCalledWith(POLE_ID);
    });

    it('sets poles to single-element array', () => {
      expect(component.poles).toHaveLength(1);
      expect(component.poles[0].id).toBe(POLE_ID);
    });

    it('loads inspector when pole has assignedInspector', () => {
      expect(mockInspectorService.getInspectorById).toHaveBeenCalledWith(INSPECTOR.id);
      expect(component.assignedInspector?.id).toBe(INSPECTOR.id);
    });

    it('skips inspector load when pole has no assignedInspector', () => {
      vi.clearAllMocks();
      mockPolesService.getPoleById.mockReturnValue(of({ ...mockPole, assignedInspector: undefined }));
      component.ngOnInit();
      expect(mockInspectorService.getInspectorById).not.toHaveBeenCalled();
    });

    it('sets imgUrl from first sorted image', () => {
      expect(component.imgUrl).toContain('img-c');
      expect(component.imgUrl).toContain('.jpg');
    });
  });

  // ── sortImagesByDate ───────────────────────────────────────────────────────
  describe('sortImagesByDate()', () => {
    it('sorts images descending by capturedDate', () => {
      const dates = component.Images.map((img) => +img.capturedDate);
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('most recent image is first', () => {
      expect(component.Images[0].imageId).toBe('img-c');
    });

    it('oldest image is last', () => {
      expect(component.Images[component.Images.length - 1].imageId).toBe('img-a');
    });

    it('does nothing when poleData has no images', () => {
      component.poleData = { id: 'x' };
      component.Images = [];
      component.sortImagesByDate();
      expect(component.Images).toHaveLength(0);
    });
  });

  // ── openImage / closeImage ─────────────────────────────────────────────────
  describe('openImage()', () => {
    it('sets selectedIndex', () => {
      component.openImage(1);
      expect(component.selectedIndex).toBe(1);
    });

    it('sets selectedIndex to 0', () => {
      component.openImage(0);
      expect(component.selectedIndex).toBe(0);
    });
  });

  describe('closeImage()', () => {
    it('sets selectedIndex to null', () => {
      component.selectedIndex = 1;
      component.closeImage();
      expect(component.selectedIndex).toBeNull();
    });
  });

  // ── selectedImage getter ───────────────────────────────────────────────────
  describe('selectedImage', () => {
    it('returns null when selectedIndex is null', () => {
      component.selectedIndex = null;
      expect(component.selectedImage).toBeNull();
    });

    it('returns image at selectedIndex 0', () => {
      component.openImage(0);
      expect(component.selectedImage).toBe(component.Images[0]);
    });

    it('returns image at selectedIndex 1', () => {
      component.openImage(1);
      expect(component.selectedImage).toBe(component.Images[1]);
    });
  });

  // ── nextImage ──────────────────────────────────────────────────────────────
  describe('nextImage()', () => {
    it('does nothing when selectedIndex is null', () => {
      component.selectedIndex = null;
      component.nextImage();
      expect(component.selectedIndex).toBeNull();
    });

    it('advances to next index', () => {
      component.openImage(0);
      component.nextImage();
      expect(component.selectedIndex).toBe(1);
    });

    it('wraps from last to first', () => {
      component.openImage(component.Images.length - 1);
      component.nextImage();
      expect(component.selectedIndex).toBe(0);
    });
  });

  // ── prevImage ──────────────────────────────────────────────────────────────
  describe('prevImage()', () => {
    it('does nothing when selectedIndex is null', () => {
      component.selectedIndex = null;
      component.prevImage();
      expect(component.selectedIndex).toBeNull();
    });

    it('goes to previous index', () => {
      component.openImage(2);
      component.prevImage();
      expect(component.selectedIndex).toBe(1);
    });

    it('wraps from first to last', () => {
      component.openImage(0);
      component.prevImage();
      expect(component.selectedIndex).toBe(component.Images.length - 1);
    });
  });

  // ── onImageError ───────────────────────────────────────────────────────────
  describe('onImageError()', () => {
    it('sets img src to placeholder', () => {
      const img = document.createElement('img');
      component.onImageError({ target: img } as unknown as Event);
      expect(img.src).toContain('assets/placeholder.svg');
    });
  });
});
