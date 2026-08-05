import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { PlanCaptureRoundComponent } from './plan-capture-round.component';
import { PoleInterface } from '../interfaces/pole-interface';
import { CaptureInterface } from '../interfaces/Capture-interface';
import { Toast } from '../utils/toast';
import { CreateCaptureDialogComponent } from '../create-capture-dialog/create-capture-dialog.component';

// ── Leaflet mock (MapViewComponent dependency) ────────────────────────────────
vi.mock('leaflet', () => {
  const stub = () => {
    const self: any = {
      addTo: vi.fn(() => self), setPosition: vi.fn(() => self),
      addLayer: vi.fn(() => self), removeLayer: vi.fn(() => self),
      clearLayers: vi.fn(() => self), on: vi.fn(() => self),
      off: vi.fn(() => self), addControl: vi.fn(() => self),
      remove: vi.fn(() => self), fitBounds: vi.fn(() => self),
      setView: vi.fn(() => self), getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
      bindPopup: vi.fn(() => self), openPopup: vi.fn(() => self),
      setIcon: vi.fn(() => self),
      getBounds: vi.fn(() => ({ toBBoxString: () => '' })),
      zoomIn: vi.fn(), zoomOut: vi.fn(), flyTo: vi.fn(),
      latLngToContainerPoint: vi.fn(() => ({ x: 0, y: 0 })),
    };
    return self;
  };
  function FeatureGroup() { return stub(); }
  const L = {
    map: vi.fn(stub), layerGroup: vi.fn(stub), featureGroup: vi.fn(stub),
    FeatureGroup, icon: vi.fn(() => ({})), divIcon: vi.fn(() => ({})),
    tileLayer: vi.fn(stub), marker: vi.fn(stub),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
    DomEvent: { stopPropagation: vi.fn() },
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: { extend: vi.fn(), Draw: function () { return stub(); } },
    Draw: {
      Event: { CREATED: 'draw:created', DELETED: 'draw:deleted', EDITED: 'draw:edited', DRAWSTOP: 'draw:drawstop' },
      Rectangle: function () { return { enable: vi.fn(), disable: vi.fn() }; },
    },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const POLE_OSLO: PoleInterface = {
  id: 'p1', county: 'Oslo', municipality: 'Sentrum',
  roadCategory: 'E', roadNumber: 6,
};
const POLE_OSLO_2: PoleInterface = {
  id: 'p2', county: 'Oslo', municipality: 'Alna',
  roadCategory: 'E', roadNumber: 6,
};
const POLE_BERGEN: PoleInterface = {
  id: 'p3', county: 'Bergen', municipality: 'Bergenhus',
  roadCategory: 'E', roadNumber: 39,
};
const POLE_NO_ROAD: PoleInterface = {
  id: 'p4', county: 'Oslo', municipality: 'Sentrum',
};

const ALL_POLES = [POLE_OSLO, POLE_OSLO_2, POLE_BERGEN, POLE_NO_ROAD];

const CAPTURE: CaptureInterface = {
  id: 'c1', poles: ['p1', 'p2'],
  startDate: 1710460800000, endDate: 1710547200000, createdDate: 1710460800000,
};

describe('PlanCaptureRoundComponent', () => {
  let component: PlanCaptureRoundComponent;
  let fixture: ComponentFixture<PlanCaptureRoundComponent>;
  let httpMock: HttpTestingController;

  const dialogRefMock = { afterClosed: vi.fn(() => of(undefined)) };
  const dialogMock = { open: vi.fn(() => dialogRefMock) };
  const toastMock = { show: vi.fn() };

  beforeEach(async () => {
    dialogMock.open.mockClear();
    dialogRefMock.afterClosed.mockReturnValue(of(undefined));
    toastMock.show.mockClear();

    await TestBed.configureTestingModule({
      imports: [PlanCaptureRoundComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MatDialog, useValue: dialogMock },
        { provide: Toast, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanCaptureRoundComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function init(poles: PoleInterface[] = [], captures: CaptureInterface[] = []) {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.includes('/poles')).flush(poles);
    httpMock.expectOne((r) => r.url.includes('/captures')).flush(captures);
  }

  it('should create', () => {
    init();
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────
  describe('ngOnInit()', () => {
    it('loads poles into component.poles', () => {
      init([POLE_OSLO]);
      expect(component.poles).toEqual([POLE_OSLO]);
    });

    it('loads captures into plannedCaptures', () => {
      init([], [CAPTURE]);
      expect(component.plannedCaptures).toEqual([CAPTURE]);
    });

    it('groups poles after loading', () => {
      init([POLE_OSLO, POLE_BERGEN]);
      expect(component.groupedPoles['Oslo']).toBeDefined();
      expect(component.groupedPoles['Bergen']).toBeDefined();
    });
  });

  // ── groupPoles — flat ──────────────────────────────────────────────────────
  describe('groupPoles() — flat grouping', () => {
    beforeEach(() => init());

    it('groups by county', () => {
      component.poles = ALL_POLES;
      component.groupBy = 'county';
      component.groupPoles();
      expect(component.groupedPoles['Oslo'].length).toBe(3);
      expect(component.groupedPoles['Bergen'].length).toBe(1);
    });

    it('uses "Unknown" for poles missing county', () => {
      component.poles = [{ id: 'x' }];
      component.groupBy = 'county';
      component.groupPoles();
      expect(component.groupedPoles['Unknown']).toBeDefined();
    });

    it('groups by municipality', () => {
      component.poles = ALL_POLES;
      component.groupBy = 'municipality';
      component.groupPoles();
      expect(component.groupedPoles['Sentrum'].length).toBe(2);
      expect(component.groupedPoles['Alna'].length).toBe(1);
    });

    it('groups by road — formats as "<category> <number>"', () => {
      component.poles = [POLE_OSLO, POLE_OSLO_2];
      component.groupBy = 'road';
      component.groupPoles();
      expect(component.groupedPoles['E 6']).toBeDefined();
      expect(component.groupedPoles['E 6'].length).toBe(2);
    });

    it('groups by road — uses "Unknown Road" when road data missing', () => {
      component.poles = [POLE_NO_ROAD];
      component.groupBy = 'road';
      component.groupPoles();
      expect(component.groupedPoles['Unknown Road']).toBeDefined();
    });

    it('clears previous groupedPoles before re-grouping', () => {
      component.poles = [POLE_OSLO];
      component.groupBy = 'county';
      component.groupPoles();
      component.poles = [];
      component.groupPoles();
      expect(Object.keys(component.groupedPoles).length).toBe(0);
    });
  });

  // ── groupPoles — hierarchical ──────────────────────────────────────────────
  describe('groupPoles() — hierarchical grouping', () => {
    beforeEach(() => init());

    it('groups by county_road — creates parent/road structure', () => {
      component.poles = [POLE_OSLO, POLE_BERGEN];
      component.groupBy = 'county_road';
      component.groupPoles();
      expect(component.hierarchicalGroupedPoles['Oslo']['E 6']).toBeDefined();
      expect(component.hierarchicalGroupedPoles['Bergen']['E 39']).toBeDefined();
    });

    it('groups by municipality_road — creates parent/road structure', () => {
      component.poles = [POLE_OSLO];
      component.groupBy = 'municipality_road';
      component.groupPoles();
      expect(component.hierarchicalGroupedPoles['Sentrum']['E 6'].length).toBe(1);
    });

    it('clears hierarchicalGroupedPoles before re-grouping', () => {
      component.poles = [POLE_OSLO];
      component.groupBy = 'county_road';
      component.groupPoles();
      component.poles = [];
      component.groupPoles();
      expect(Object.keys(component.hierarchicalGroupedPoles).length).toBe(0);
    });
  });

  // ── onGroupByChange ────────────────────────────────────────────────────────
  describe('onGroupByChange()', () => {
    beforeEach(() => init([POLE_OSLO]));

    it('updates groupBy', () => {
      component.onGroupByChange('municipality');
      expect(component.groupBy).toBe('municipality');
    });

    it('clears selectedParentGroup', () => {
      component.selectedParentGroup = 'Oslo';
      component.onGroupByChange('municipality');
      expect(component.selectedParentGroup).toBeNull();
    });

    it('clears expandedGroups', () => {
      component.expandedGroups.add('Oslo');
      component.onGroupByChange('municipality');
      expect(component.expandedGroups.size).toBe(0);
    });

    it('clears expandedSubGroups', () => {
      component.expandedSubGroups.add('E 6');
      component.onGroupByChange('municipality');
      expect(component.expandedSubGroups.size).toBe(0);
    });

    it('re-groups poles under new strategy', () => {
      component.onGroupByChange('municipality');
      expect(component.groupedPoles['Sentrum']).toBeDefined();
    });
  });

  // ── groupKeys / isHierarchical ─────────────────────────────────────────────
  describe('groupKeys', () => {
    beforeEach(() => init([POLE_OSLO, POLE_BERGEN]));

    it('returns sorted flat keys for non-hierarchical groupBy', () => {
      expect(component.groupKeys).toEqual(['Bergen', 'Oslo']);
    });

    it('returns sorted parent keys for hierarchical groupBy', () => {
      component.onGroupByChange('county_road');
      expect(component.groupKeys).toEqual(['Bergen', 'Oslo']);
    });
  });

  describe('isHierarchical()', () => {
    beforeEach(() => init());

    it('returns false for county', () => {
      component.groupBy = 'county';
      expect(component.isHierarchical()).toBe(false);
    });

    it('returns true for county_road', () => {
      component.groupBy = 'county_road';
      expect(component.isHierarchical()).toBe(true);
    });

    it('returns true for municipality_road', () => {
      component.groupBy = 'municipality_road';
      expect(component.isHierarchical()).toBe(true);
    });
  });

  describe('getTotalPoles()', () => {
    it('returns number of loaded poles', () => {
      init([POLE_OSLO, POLE_BERGEN]);
      expect(component.getTotalPoles()).toBe(2);
    });
  });

  // ── Group / subGroup / polesList toggles ───────────────────────────────────
  describe('toggleGroup / isGroupExpanded', () => {
    beforeEach(() => init());

    it('expands group', () => {
      component.toggleGroup('Oslo');
      expect(component.isGroupExpanded('Oslo')).toBe(true);
    });

    it('collapses group when toggled again', () => {
      component.toggleGroup('Oslo');
      component.toggleGroup('Oslo');
      expect(component.isGroupExpanded('Oslo')).toBe(false);
    });
  });

  describe('toggleSubGroup / isSubGroupExpanded', () => {
    beforeEach(() => init());

    it('expands subgroup', () => {
      component.toggleSubGroup('E 6');
      expect(component.isSubGroupExpanded('E 6')).toBe(true);
    });

    it('collapses subgroup when toggled again', () => {
      component.toggleSubGroup('E 6');
      component.toggleSubGroup('E 6');
      expect(component.isSubGroupExpanded('E 6')).toBe(false);
    });
  });

  describe('togglePolesList / isPolesListExpanded', () => {
    beforeEach(() => init());

    it('expands poles list', () => {
      component.togglePolesList('Oslo');
      expect(component.isPolesListExpanded('Oslo')).toBe(true);
    });

    it('collapses poles list when toggled again', () => {
      component.togglePolesList('Oslo');
      component.togglePolesList('Oslo');
      expect(component.isPolesListExpanded('Oslo')).toBe(false);
    });
  });

  // ── selectParentGroup ──────────────────────────────────────────────────────
  describe('selectParentGroup()', () => {
    beforeEach(() => init());

    it('sets selectedParentGroup', () => {
      component.selectParentGroup('Oslo');
      expect(component.selectedParentGroup).toBe('Oslo');
    });

    it('toggles off when same key selected again', () => {
      component.selectParentGroup('Oslo');
      component.selectParentGroup('Oslo');
      expect(component.selectedParentGroup).toBeNull();
    });

    it('clears expandedSubGroups', () => {
      component.expandedSubGroups.add('E 6');
      component.selectParentGroup('Oslo');
      expect(component.expandedSubGroups.size).toBe(0);
    });
  });

  // ── getRoadsForParent / getParentGroupPoleCount ────────────────────────────
  describe('getRoadsForParent()', () => {
    beforeEach(() => {
      init([POLE_OSLO, POLE_OSLO_2, POLE_BERGEN]);
      component.onGroupByChange('county_road');
    });

    it('returns sorted roads for a known parent', () => {
      expect(component.getRoadsForParent('Oslo')).toEqual(['E 6']);
    });

    it('returns empty array for unknown parent', () => {
      expect(component.getRoadsForParent('Unknown')).toEqual([]);
    });
  });

  describe('getParentGroupPoleCount()', () => {
    beforeEach(() => {
      init([POLE_OSLO, POLE_OSLO_2, POLE_BERGEN]);
      component.onGroupByChange('county_road');
    });

    it('returns total pole count under parent', () => {
      expect(component.getParentGroupPoleCount('Oslo')).toBe(2);
    });

    it('returns 0 for unknown parent', () => {
      expect(component.getParentGroupPoleCount('Unknown')).toBe(0);
    });
  });

  // ── switchTab ──────────────────────────────────────────────────────────────
  describe('switchTab()', () => {
    beforeEach(() => init());

    it('switches to tab 1', () => {
      component.switchTab(1);
      expect(component.activeTab).toBe(1);
    });

    it('switches back to tab 0', () => {
      component.switchTab(1);
      component.switchTab(0);
      expect(component.activeTab).toBe(0);
    });
  });

  // ── viewCapture / stopViewing / viewedPoles ────────────────────────────────
  describe('viewCapture / stopViewing / viewedPoles', () => {
    beforeEach(() => init([POLE_OSLO, POLE_OSLO_2]));

    it('sets viewingCapture', () => {
      component.viewCapture(CAPTURE);
      expect(component.viewingCapture).toEqual(CAPTURE);
    });

    it('stopViewing clears viewingCapture', () => {
      component.viewCapture(CAPTURE);
      component.stopViewing();
      expect(component.viewingCapture).toBeNull();
    });

    it('viewedPoles returns all poles when not viewing a capture', () => {
      expect(component.viewedPoles.length).toBe(2);
    });

    it('viewedPoles returns only capture poles when viewing', () => {
      component.viewCapture(CAPTURE); // CAPTURE.poles = ['p1','p2']
      expect(component.viewedPoles.map((p) => p.id)).toEqual(['p1', 'p2']);
    });
  });

  // ── deleteCaptureRound / confirmDelete ────────────────────────────────────
  describe('deleteCaptureRound / confirmDelete', () => {
    beforeEach(() => init([], [CAPTURE]));

    it('deleteCaptureRound sets pendingDeleteId', () => {
      component.deleteCaptureRound('c1');
      expect(component.pendingDeleteId).toBe('c1');
    });

    it('confirmDelete removes capture from list', () => {
      component.deleteCaptureRound('c1');
      component.confirmDelete();
      httpMock.expectOne((r) => r.url.includes('/captures/c1')).flush(null);
      expect(component.plannedCaptures.find((c) => c.id === 'c1')).toBeUndefined();
    });

    it('confirmDelete shows success toast', () => {
      component.deleteCaptureRound('c1');
      component.confirmDelete();
      httpMock.expectOne((r) => r.url.includes('/captures/c1')).flush(null);
      expect(toastMock.show).toHaveBeenCalledWith('Capture round deleted.', 'Close', 3000);
    });

    it('confirmDelete clears viewingCapture when deleted capture was viewed', () => {
      component.viewingCapture = CAPTURE;
      component.deleteCaptureRound('c1');
      component.confirmDelete();
      httpMock.expectOne((r) => r.url.includes('/captures/c1')).flush(null);
      expect(component.viewingCapture).toBeNull();
    });

    it('confirmDelete does not clear viewingCapture for different capture', () => {
      const other: CaptureInterface = { ...CAPTURE, id: 'c2' };
      component.viewingCapture = other;
      component.deleteCaptureRound('c1');
      component.confirmDelete();
      httpMock.expectOne((r) => r.url.includes('/captures/c1')).flush(null);
      expect(component.viewingCapture).not.toBeNull();
    });

    it('confirmDelete is no-op when pendingDeleteId is null', () => {
      component.confirmDelete();
      httpMock.expectNone((r) => r.url.includes('/captures/c1'));
    });

    it('confirmDelete shows error toast on HTTP failure', () => {
      component.deleteCaptureRound('c1');
      component.confirmDelete();
      httpMock
        .expectOne((r) => r.url.includes('/captures/c1'))
        .flush('Error', { status: 500, statusText: 'Server Error' });
      expect(toastMock.show).toHaveBeenCalledWith('Failed to delete capture.', 'Close', 3000);
    });
  });

  // ── createCaptureRound ─────────────────────────────────────────────────────
  describe('createCaptureRound()', () => {
    beforeEach(() => init([POLE_OSLO, POLE_OSLO_2, POLE_BERGEN]));

    it('opens dialog with pole ids for flat group', () => {
      component.createCaptureRound('Oslo');
      expect(dialogMock.open).toHaveBeenCalledWith(
        CreateCaptureDialogComponent,
        expect.objectContaining({ data: { poleIds: ['p1', 'p2'] } }),
      );
    });

    it('opens dialog with subgroup pole ids for hierarchical + subGroupKey', () => {
      component.onGroupByChange('county_road');
      component.createCaptureRound('Oslo', 'E 6');
      expect(dialogMock.open).toHaveBeenCalledWith(
        CreateCaptureDialogComponent,
        expect.objectContaining({ data: { poleIds: expect.arrayContaining(['p1', 'p2']) } }),
      );
    });

    it('collects all poles under parent for hierarchical without subGroupKey', () => {
      component.onGroupByChange('county_road');
      component.createCaptureRound('Oslo');
      const callArgs = dialogMock.open.mock.calls[0][1];
      expect(callArgs.data.poleIds.length).toBe(2);
    });

    it('reloads captures when dialog returns a created capture', () => {
      dialogRefMock.afterClosed.mockReturnValue(of(CAPTURE));
      component.createCaptureRound('Oslo');
      httpMock.expectOne((r) => r.url.includes('/captures')).flush([CAPTURE]);
      expect(component.plannedCaptures).toEqual([CAPTURE]);
    });

    it('does not reload captures when dialog is cancelled', () => {
      component.createCaptureRound('Oslo');
      httpMock.expectNone((r) => r.url.includes('/captures'));
    });
  });

  // ── getCaptureInfo ─────────────────────────────────────────────────────────
  describe('getCaptureInfo()', () => {
    beforeEach(() => init([POLE_OSLO, POLE_OSLO_2]));

    it('extracts unique counties from capture poles', () => {
      const info = component.getCaptureInfo(CAPTURE); // CAPTURE.poles = ['p1','p2'], both Oslo
      expect(info.counties).toEqual(['Oslo']);
    });

    it('extracts unique municipalities', () => {
      const info = component.getCaptureInfo(CAPTURE);
      expect(info.municipalities).toContain('Sentrum');
      expect(info.municipalities).toContain('Alna');
    });

    it('extracts unique roads, excludes Unknown Road', () => {
      const info = component.getCaptureInfo(CAPTURE);
      expect(info.roads).toContain('E 6');
      expect(info.roads).not.toContain('Unknown Road');
    });

    it('returns empty arrays when capture has no matching poles', () => {
      const empty: CaptureInterface = { ...CAPTURE, poles: ['no-match'] };
      const info = component.getCaptureInfo(empty);
      expect(info.counties).toEqual([]);
      expect(info.municipalities).toEqual([]);
      expect(info.roads).toEqual([]);
    });
  });
});
