import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { SimpleChange } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { LeafletMapComponent } from './leaflet-map.component';
import { PoleInterface } from '../interfaces/pole-interface';
import { CreateCaptureDialogComponent } from '../create-capture-dialog/create-capture-dialog.component';

// ── Leaflet mock ──────────────────────────────────────────────────────────────
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
      addControl: vi.fn(() => self),
      removeControl: vi.fn(() => self),
      remove: vi.fn(() => self),
      fitBounds: vi.fn(() => self),
      setView: vi.fn(() => self),
      getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
      bindPopup: vi.fn(() => self),
      openPopup: vi.fn(() => self),
      setIcon: vi.fn(() => self),
      getBounds: vi.fn(() => ({ toBBoxString: () => '' })),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      flyTo: vi.fn(),
      latLngToContainerPoint: vi.fn(() => ({ x: 100, y: 200 })),
    };
    return self;
  };

  function FeatureGroup() { return stub(); }
  function DrawRectangle() {
    return { enable: vi.fn(), disable: vi.fn() };
  }

  const L = {
    map: vi.fn(stub),
    layerGroup: vi.fn(stub),
    featureGroup: vi.fn(stub),
    FeatureGroup,
    icon: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
    tileLayer: vi.fn(stub),
    marker: vi.fn(stub),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    DomEvent: { stopPropagation: vi.fn() },
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: {
      extend: vi.fn(),
      Draw: function DrawControl() { return stub(); },
    },
    Draw: {
      Event: {
        CREATED: 'draw:created',
        DELETED: 'draw:deleted',
        EDITED: 'draw:edited',
        DRAWSTOP: 'draw:drawstop',
      },
      Rectangle: DrawRectangle,
    },
  };

  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const POLE: PoleInterface = {
  id: 'p1',
  capturedDate: '1710460800000',
  location: { type: 'Point', coordinates: [10.7, 59.9] },
};

const POLE_WITH_INSPECTOR: PoleInterface = {
  id: 'p2',
  location: { type: 'Point', coordinates: [10.8, 59.85] },
  assignedInspector: 'i1',
};

function makeBounds(containsFn: (latlng: any) => boolean) {
  return {
    contains: vi.fn(containsFn),
    getCenter: vi.fn(() => ({ lat: 59.9, lng: 10.7 })),
  } as any;
}

describe('LeafletMapComponent', () => {
  let component: LeafletMapComponent;
  let fixture: ComponentFixture<LeafletMapComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  const dialogRefMock = { afterClosed: vi.fn(() => of(false)) };
  const dialogMock = { open: vi.fn(() => dialogRefMock) };

  beforeEach(async () => {
    dialogMock.open.mockClear();
    dialogRefMock.afterClosed.mockReturnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [LeafletMapComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MatDialog, useValue: dialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeafletMapComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => expect(component).toBeTruthy());

  // ── Initial state ──────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('drawingActive is false', () => expect(component.drawingActive).toBe(false));
    it('hasSelection is false', () => expect(component.hasSelection).toBe(false));
    it('showLayerMenu is false', () => expect(component.showLayerMenu).toBe(false));
    it('activeLayer defaults to Kartverket', () => expect(component.activeLayer).toBe('Kartverket'));
    it('layerNames has 3 options', () => {
      expect(component.layerNames).toEqual(['Kartverket', 'OpenStreetMap', 'Satellite']);
    });
    it('selectedPoles is empty', () => expect(component.selectedPoles.size).toBe(0));
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────────────
  describe('ngOnDestroy()', () => {
    it('calls map.remove()', () => {
      const mapSpy = component['map'];
      component.ngOnDestroy();
      expect(mapSpy.remove).toHaveBeenCalled();
    });

    it('sets map to undefined', () => {
      component.ngOnDestroy();
      expect(component['map']).toBeUndefined();
    });
  });

  // ── ngOnChanges ────────────────────────────────────────────────────────────
  describe('ngOnChanges()', () => {
    it('clears and redraws markerLayer when poles change', () => {
      const markerLayer = component['markerLayer'];
      component.poles = [POLE];
      component.ngOnChanges({ poles: new SimpleChange([], [POLE], false) });
      expect(markerLayer.clearLayers).toHaveBeenCalled();
    });

    it('does not crash when poles change but map is null', () => {
      component['map'] = null;
      expect(() =>
        component.ngOnChanges({ poles: new SimpleChange([], [POLE], false) }),
      ).not.toThrow();
    });

    it('redraws markers when focusedPole changes', () => {
      const markerLayer = component['markerLayer'];
      const before = (markerLayer.clearLayers as ReturnType<typeof vi.fn>).mock.calls.length;
      component.poles = [POLE];
      component.focusedPole = 'p1';
      component.ngOnChanges({ focusedPole: new SimpleChange(null, 'p1', false) });
      const after = (markerLayer.clearLayers as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(after).toBeGreaterThan(before);
    });

    it('does not redraw when focusedPole changes but map is null', () => {
      component['map'] = null;
      expect(() =>
        component.ngOnChanges({ focusedPole: new SimpleChange(null, 'p1', false) }),
      ).not.toThrow();
    });
  });

  // ── Zoom ───────────────────────────────────────────────────────────────────
  describe('zoomIn()', () => {
    it('calls map.zoomIn()', () => {
      component.zoomIn();
      expect(component['map'].zoomIn).toHaveBeenCalled();
    });
  });

  describe('zoomOut()', () => {
    it('calls map.zoomOut()', () => {
      component.zoomOut();
      expect(component['map'].zoomOut).toHaveBeenCalled();
    });
  });

  // ── setLayer ───────────────────────────────────────────────────────────────
  describe('setLayer()', () => {
    it('changes activeLayer', () => {
      component.setLayer('OpenStreetMap');
      expect(component.activeLayer).toBe('OpenStreetMap');
    });

    it('closes layer menu after switching', () => {
      component.showLayerMenu = true;
      component.setLayer('OpenStreetMap');
      expect(component.showLayerMenu).toBe(false);
    });

    it('closes menu without switching when same layer selected', () => {
      component.showLayerMenu = true;
      component.setLayer('Kartverket');
      expect(component.activeLayer).toBe('Kartverket');
      expect(component.showLayerMenu).toBe(false);
    });

    it('calls map.removeLayer for the previous tile layer', () => {
      component.setLayer('OpenStreetMap');
      expect(component['map'].removeLayer).toHaveBeenCalled();
    });
  });

  // ── toggleDrawMode ─────────────────────────────────────────────────────────
  describe('toggleDrawMode()', () => {
    it('sets drawingActive to true', () => {
      component.toggleDrawMode();
      expect(component.drawingActive).toBe(true);
    });

    it('sets drawingActive to false on second call', () => {
      component.toggleDrawMode();
      component.toggleDrawMode();
      expect(component.drawingActive).toBe(false);
    });

    it('calls drawHandler.disable when deactivating', () => {
      component.toggleDrawMode();
      const handler = component['drawHandler'];
      component.toggleDrawMode();
      expect(handler.disable).toHaveBeenCalled();
    });

    it('nulls out drawHandler after deactivation', () => {
      component.toggleDrawMode();
      component.toggleDrawMode();
      expect(component['drawHandler']).toBeNull();
    });
  });

  // ── clearSelection ─────────────────────────────────────────────────────────
  describe('clearSelection()', () => {
    it('calls drawnItems.clearLayers()', () => {
      const drawnItems = component['drawnItems'];
      component.clearSelection();
      expect(drawnItems.clearLayers).toHaveBeenCalled();
    });
  });

  // ── handleBoxSelection ─────────────────────────────────────────────────────
  describe('handleBoxSelection()', () => {
    it('adds pole inside bounds to selectedPoles', () => {
      component.poles = [POLE];
      component.handleBoxSelection(makeBounds(() => true));
      expect(component.selectedPoles.has('p1')).toBe(true);
    });

    it('does not add pole outside bounds', () => {
      component.poles = [POLE];
      component.handleBoxSelection(makeBounds(() => false));
      expect(component.selectedPoles.has('p1')).toBe(false);
    });

    it('skips poles without location', () => {
      component.poles = [{ id: 'noLoc' }];
      expect(() => component.handleBoxSelection(makeBounds(() => true))).not.toThrow();
      expect(component.selectedPoles.size).toBe(0);
    });

    it('shows selection actions when poles selected', () => {
      component.poles = [POLE];
      component.handleBoxSelection(makeBounds(() => true));
      expect(component.showSelectionActions).toBe(true);
    });

    it('sets selectionCount to number of matched poles', () => {
      component.poles = [
        POLE,
        { id: 'p99', location: { type: 'Point', coordinates: [10.75, 59.92] } },
      ];
      component.handleBoxSelection(makeBounds(() => true));
      expect(component.selectionCount).toBe(2);
    });

    it('sets toolbarPos from map.latLngToContainerPoint', () => {
      component.poles = [POLE];
      component.handleBoxSelection(makeBounds(() => true));
      expect(component.toolbarPos).toEqual({ x: 100, y: 200 });
    });

    it('clears hasSelection when no poles in bounds', () => {
      component.poles = [POLE];
      component.handleBoxSelection(makeBounds(() => false));
      expect(component.hasSelection).toBe(false);
    });

    it('clears previous selection before evaluating new bounds', () => {
      component.poles = [POLE];
      component.selectedPoles.add('old-id');
      component.handleBoxSelection(makeBounds(() => false));
      expect(component.selectedPoles.has('old-id')).toBe(false);
    });
  });

  // ── assignInspectorLabel ───────────────────────────────────────────────────
  describe('assignInspectorLabel', () => {
    it('returns "Assign Inspector" when no inspector on selected pole', () => {
      component.poles = [POLE];
      component.selectedPoles.add('p1');
      expect(component.assignInspectorLabel).toBe('Assign Inspector');
    });

    it('returns "Change Inspector" when all selected poles have inspector', () => {
      component.poles = [POLE_WITH_INSPECTOR];
      component.selectedPoles.add('p2');
      expect(component.assignInspectorLabel).toBe('Change Inspector');
    });

    it('returns "Assign Inspector" when selection is empty', () => {
      component.poles = [POLE_WITH_INSPECTOR];
      expect(component.assignInspectorLabel).toBe('Assign Inspector');
    });

    it('returns "Assign Inspector" when mixed assignment in selection', () => {
      component.poles = [POLE, POLE_WITH_INSPECTOR];
      component.selectedPoles.add('p1');
      component.selectedPoles.add('p2');
      expect(component.assignInspectorLabel).toBe('Assign Inspector');
    });
  });

  // ── assignToInspector ──────────────────────────────────────────────────────
  describe('assignToInspector()', () => {
    it('sets showAssignDialog to true', () => {
      component.assignToInspector();
      expect(component.showAssignDialog).toBe(true);
    });

    it('hides selection actions', () => {
      component.showSelectionActions = true;
      component.assignToInspector();
      expect(component.showSelectionActions).toBe(false);
    });
  });

  // ── viewImage ──────────────────────────────────────────────────────────────
  describe('viewImage()', () => {
    it('navigates to /pole-details/:id', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.viewImage('p1');
      expect(spy).toHaveBeenCalledWith(['/pole-details', 'p1']);
    });
  });

  // ── planNewCapture ─────────────────────────────────────────────────────────
  describe('planNewCapture()', () => {
    it('opens CreateCaptureDialog with selected pole ids', () => {
      component.selectedPoles.add('p1');
      component.planNewCapture();
      expect(dialogMock.open).toHaveBeenCalledWith(
        CreateCaptureDialogComponent,
        expect.objectContaining({ data: { poleIds: ['p1'] } }),
      );
    });

    it('hides selection actions', () => {
      component.showSelectionActions = true;
      component.planNewCapture();
      expect(component.showSelectionActions).toBe(false);
    });

    it('emits captureCreated when dialog confirms', () => {
      dialogRefMock.afterClosed.mockReturnValue(of(true));
      let emitted = false;
      component.captureCreated.subscribe(() => (emitted = true));
      component.planNewCapture();
      httpMock.expectOne((r) => r.url.includes('/notifications')).flush([]);
      expect(emitted).toBe(true);
    });

    it('does not emit captureCreated when dialog is cancelled', () => {
      let emitted = false;
      component.captureCreated.subscribe(() => (emitted = true));
      component.planNewCapture();
      expect(emitted).toBe(false);
    });

    it('calls notificationService.refresh when dialog confirms', () => {
      dialogRefMock.afterClosed.mockReturnValue(of(true));
      component.planNewCapture();
      const req = httpMock.expectOne((r) => r.url.includes('/notifications'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  // ── onInspectorSelected ────────────────────────────────────────────────────
  describe('onInspectorSelected()', () => {
    const INSPECTOR: any = { id: 'insp1', firstName: 'Ali', lastName: 'Doe' };

    it('hides assign dialog', () => {
      component.showAssignDialog = true;
      component.poles = [POLE];
      component.selectedPoles.add('p1');
      component.onInspectorSelected(INSPECTOR);
      httpMock.expectOne((r) => r.url.includes('/poles')).flush({});
      expect(component.showAssignDialog).toBe(false);
    });

    it('calls updatePole for each selected pole with inspector id', () => {
      component.poles = [POLE];
      component.selectedPoles.add('p1');
      component.onInspectorSelected(INSPECTOR);
      const req = httpMock.expectOne((r) => r.url.includes('/poles'));
      expect(req.request.body?.assignedInspector).toBe('insp1');
      req.flush({});
    });

    it('calls drawnItems.clearLayers after update', () => {
      const drawnItems = component['drawnItems'];
      component.poles = [POLE];
      component.selectedPoles.add('p1');
      component.onInspectorSelected(INSPECTOR);
      httpMock.expectOne((r) => r.url.includes('/poles')).flush({});
      expect(drawnItems.clearLayers).toHaveBeenCalled();
    });

    it('does not call updatePole for unrecognised pole id', () => {
      component.poles = [POLE];
      component.selectedPoles.add('unknown-id');
      component.onInspectorSelected(INSPECTOR);
      httpMock.expectNone((r) => r.url.includes('/poles'));
    });
  });
});
