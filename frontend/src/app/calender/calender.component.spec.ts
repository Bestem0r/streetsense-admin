import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { CalenderComponent } from './calender.component';
import { PolesService } from '../service/poles.service';
import { PlanCaptureService } from '../service/plan-capture.service';

vi.mock('leaflet', () => {
  const stub = () => {
    const self: any = {
      addTo: vi.fn(() => self), setPosition: vi.fn(() => self),
      addLayer: vi.fn(() => self), removeLayer: vi.fn(() => self),
      clearLayers: vi.fn(() => self), on: vi.fn(() => self),
      off: vi.fn(() => self), remove: vi.fn(() => self),
      fitBounds: vi.fn(() => self), setView: vi.fn(() => self),
      getLatLng: vi.fn(() => ({ lat: 0, lng: 0 })),
      bindPopup: vi.fn(() => self), openPopup: vi.fn(() => self),
      setIcon: vi.fn(() => self), getBounds: vi.fn(() => ({ toBBoxString: () => '' })),
    };
    return self;
  };
  const L = {
    map: vi.fn(stub), layerGroup: vi.fn(stub), featureGroup: vi.fn(stub),
    FeatureGroup: function () { return stub(); },
    icon: vi.fn(() => ({})), tileLayer: vi.fn(stub), marker: vi.fn(stub),
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: { extend: vi.fn(), Draw: function () { return stub(); } },
    Draw: { Event: { CREATED: 'draw:created', DELETED: 'draw:deleted', EDITED: 'draw:edited' } },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

const ds = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const MAY_2025 = new Date(2025, 4, 1);
const TS_MAY_10 = new Date(2025, 4, 10).getTime();
const TS_MAY_20 = new Date(2025, 4, 20).getTime();

const mockSummary = {
  dates: [
    { capturedDate: TS_MAY_10, count: 15 },
    { capturedDate: TS_MAY_20, count: 7 },
  ],
  countyData: [], availableCounties: [], availableMunicipalities: [],
};

// cap-1: May 5–15 (multi-day, 3 poles) | cap-2: May 20–20 (single-day, 2 poles)
const mockCaptures = [
  { id: 'cap-1', poles: ['p1', 'p2', 'p3'], startDate: new Date(2025, 4, 5).getTime(),  endDate: new Date(2025, 4, 15).getTime(), createdDate: 0 },
  { id: 'cap-2', poles: ['p4', 'p5'],        startDate: new Date(2025, 4, 20).getTime(), endDate: new Date(2025, 4, 20).getTime(), createdDate: 0 },
];

describe('CalenderComponent', () => {
  let component: CalenderComponent;
  let fixture: ComponentFixture<CalenderComponent>;
  let polesService: PolesService;
  let planCaptureService: PlanCaptureService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalenderComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    polesService       = TestBed.inject(PolesService);
    planCaptureService = TestBed.inject(PlanCaptureService);
    router             = TestBed.inject(Router);

    vi.spyOn(polesService,       'getSummary').mockReturnValue(of(mockSummary) as any);
    vi.spyOn(planCaptureService, 'getCaptures').mockReturnValue(of(mockCaptures) as any);

    fixture   = TestBed.createComponent(CalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.currentMonth = MAY_2025;
    component.buildCalendar();
    component.buildTimeline();
  });

  afterEach(() => vi.clearAllMocks());

  it('should create', () => expect(component).toBeTruthy());

  // ── buildCalendar ────────────────────────────────────────────────────
  describe('buildCalendar()', () => {
    it('produces exactly 42 days with 31 in current month', () => {
      expect(component.calendarDays).toHaveLength(42);
      expect(component.calendarDays.filter(d => d.isCurrentMonth)).toHaveLength(31);
    });

    it('marks hasInspection on dates from summary', () => {
      expect(component.calendarDays.find(d => d.dateStr === ds(2025, 5, 10))?.hasInspection).toBe(true);
      expect(component.calendarDays.find(d => d.dateStr === ds(2025, 5, 20))?.hasInspection).toBe(true);
    });

    it('adds start/end markers on capture boundaries', () => {
      expect(component.calendarDays.find(d => d.dateStr === ds(2025, 5, 5))?.captureMarkers)
        .toContainEqual({ num: 1, type: 'start' });
      expect(component.calendarDays.find(d => d.dateStr === ds(2025, 5, 15))?.captureMarkers)
        .toContainEqual({ num: 1, type: 'end' });
    });

    it('single-day capture gets only start marker', () => {
      const markers = component.calendarDays.find(d => d.dateStr === ds(2025, 5, 20))?.captureMarkers ?? [];
      expect(markers.some(m => m.type === 'start' && m.num === 2)).toBe(true);
      expect(markers.some(m => m.type === 'end'   && m.num === 2)).toBe(false);
    });

    it('marks isSelected on the selected date only', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.buildCalendar();
      expect(component.calendarDays.find(d => d.dateStr === ds(2025, 5, 10))?.isSelected).toBe(true);
      expect(component.calendarDays.find(d => d.dateStr === ds(2025, 5, 11))?.isSelected).toBe(false);
    });
  });

  // ── selectDay ────────────────────────────────────────────────────────
  describe('selectDay()', () => {
    it('sets selectedDate for a current-month day', () => {
      const day = component.calendarDays.find(d => d.dateStr === ds(2025, 5, 10) && d.isCurrentMonth)!;
      component.selectDay(day);
      expect(component.selectedDate?.getDate()).toBe(10);
    });

    it('deselects when same day clicked twice', () => {
      const day = component.calendarDays.find(d => d.dateStr === ds(2025, 5, 10) && d.isCurrentMonth)!;
      component.selectDay(day);
      component.selectDay(component.calendarDays.find(d => d.dateStr === ds(2025, 5, 10))!);
      expect(component.selectedDate).toBeNull();
    });

    it('ignores non-current-month fill days', () => {
      component.selectDay(component.calendarDays.find(d => !d.isCurrentMonth)!);
      expect(component.selectedDate).toBeNull();
    });
  });

  // ── clearSelection ───────────────────────────────────────────────────
  describe('clearSelection()', () => {
    it('nulls selectedDate', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.clearSelection();
      expect(component.selectedDate).toBeNull();
    });
  });

  // ── buildTimeline — selected date ────────────────────────────────────
  describe('buildTimeline() with selected date', () => {
    it('shows inspection with poleCount from summary', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.buildTimeline();
      const insp = component.timelineItems.find(i => i.type === 'inspection');
      expect(insp?.poleCount).toBe(15);
    });

    it('captureRelation is "starts" on capture startDate', () => {
      component.selectedDate = new Date(2025, 4, 5);
      component.buildTimeline();
      expect(component.timelineItems.find(i => i.captureNum === 1)?.captureRelation).toBe('starts');
    });

    it('captureRelation is "ends" on capture endDate', () => {
      component.selectedDate = new Date(2025, 4, 15);
      component.buildTimeline();
      expect(component.timelineItems.find(i => i.captureNum === 1)?.captureRelation).toBe('ends');
    });

    it('captureRelation is "starts & ends" for single-day capture', () => {
      component.selectedDate = new Date(2025, 4, 20);
      component.buildTimeline();
      expect(component.timelineItems.find(i => i.captureNum === 2)?.captureRelation).toBe('starts & ends');
    });

    it('captureRelation is undefined for mid-range date', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.buildTimeline();
      expect(component.timelineItems.find(i => i.captureNum === 1)?.captureRelation).toBeUndefined();
    });

    it('returns empty timeline for date with no events', () => {
      component.selectedDate = new Date(2025, 4, 1);
      component.buildTimeline();
      expect(component.timelineItems).toHaveLength(0);
    });
  });

  // ── buildTimeline — month overview ───────────────────────────────────
  describe('buildTimeline() month overview', () => {
    beforeEach(() => { component.selectedDate = null; component.buildTimeline(); });

    it('includes all inspections and captures in month', () => {
      expect(component.timelineItems.filter(i => i.type === 'inspection')).toHaveLength(2);
      expect(component.timelineItems.filter(i => i.type === 'capture')).toHaveLength(2);
    });

    it('items sorted by timestamp ascending', () => {
      const ts = component.timelineItems.map(i => i.timestamp);
      expect(ts).toEqual([...ts].sort((a, b) => a - b));
    });

    it('excludes captures entirely outside month', () => {
      component.captures = [{ id: 'x', poles: [], startDate: new Date(2025, 6, 1).getTime(), endDate: new Date(2025, 6, 10).getTime(), createdDate: 0 }];
      component.buildTimeline();
      expect(component.timelineItems.filter(i => i.type === 'capture')).toHaveLength(0);
    });

    it('poleCount comes from inspectionCounts', () => {
      expect(component.timelineItems.find(i => i.timestamp === TS_MAY_10)?.poleCount).toBe(15);
      expect(component.timelineItems.find(i => i.timestamp === TS_MAY_20)?.poleCount).toBe(7);
    });
  });

  // ── prevMonth / nextMonth ────────────────────────────────────────────
  describe('prevMonth()', () => {
    it('decrements month and clears selection', () => {
      component.currentMonth  = new Date(2025, 4, 1);
      component.selectedDate  = new Date(2025, 4, 10);
      component.prevMonth();
      expect(component.currentMonth.getMonth()).toBe(3);
      expect(component.selectedDate).toBeNull();
    });

    it('wraps from January to December of previous year', () => {
      component.currentMonth = new Date(2025, 0, 1);
      component.prevMonth();
      expect(component.currentMonth.getMonth()).toBe(11);
      expect(component.currentMonth.getFullYear()).toBe(2024);
    });
  });

  describe('nextMonth()', () => {
    it('increments month and clears selection', () => {
      component.currentMonth = new Date(2025, 4, 1);
      component.selectedDate = new Date(2025, 4, 10);
      component.nextMonth();
      expect(component.currentMonth.getMonth()).toBe(5);
      expect(component.selectedDate).toBeNull();
    });

    it('wraps from December to January of next year', () => {
      component.currentMonth = new Date(2025, 11, 1);
      component.nextMonth();
      expect(component.currentMonth.getMonth()).toBe(0);
      expect(component.currentMonth.getFullYear()).toBe(2026);
    });
  });

  // ── handleItemClick ──────────────────────────────────────────────────
  describe('handleItemClick()', () => {
    it('navigates to /map/:timestamp for inspection', () => {
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.handleItemClick({ type: 'inspection', timestamp: TS_MAY_10, subtitle: '', color: '', poleCount: 0 });
      expect(spy).toHaveBeenCalledWith(['/map', TS_MAY_10]);
    });

    it('does not navigate for capture', () => {
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.handleItemClick({ type: 'capture', timestamp: TS_MAY_10, subtitle: '', color: '', poleCount: 0 });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── countByType ──────────────────────────────────────────────────────
  describe('countByType()', () => {
    it('counts both types correctly', () => {
      component.selectedDate = null;
      component.buildTimeline();
      expect(component.countByType('inspection')).toBe(2);
      expect(component.countByType('capture')).toBe(2);
    });
  });

  // ── labels ───────────────────────────────────────────────────────────
  describe('getSelectedLabel()', () => {
    it('returns month label when no date selected', () => {
      component.selectedDate = null;
      expect(component.getSelectedLabel()).toBe(component.getMonthLabel());
    });

    it('returns formatted date string when date is set', () => {
      component.selectedDate = new Date(2025, 4, 10);
      const label = component.getSelectedLabel();
      expect(label).toContain('10');
      expect(label).toContain('MAY');
      expect(label).toContain('2025');
    });
  });

  // ── ngOnInit data loading ────────────────────────────────────────────
  describe('ngOnInit data loading', () => {
    it('populates inspectionDates and counts from summary', () => {
      expect(component.inspectionDates.has(ds(2025, 5, 10))).toBe(true);
      expect(component.inspectionCounts.get(ds(2025, 5, 10))).toBe(15);
      expect(component.inspectionCounts.get(ds(2025, 5, 20))).toBe(7);
    });

    it('populates captures sorted by startDate', () => {
      expect(component.captures[0].id).toBe('cap-1');
      expect(component.captures[1].id).toBe('cap-2');
    });
  });
});
