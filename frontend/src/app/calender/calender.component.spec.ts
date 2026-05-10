import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { CalenderComponent } from './calender.component';
import { PolesService } from '../service/poles.service';
import { PlanCaptureService } from '../service/plan-capture.service';

vi.mock('leaflet', () => {
  const s = () => {
    const o: any = {};
    ['addTo', 'setPosition', 'addLayer', 'removeLayer', 'clearLayers', 'on', 'off', 'remove', 'fitBounds', 'setView', 'bindPopup', 'openPopup', 'setIcon'].forEach(
      (m) => (o[m] = vi.fn(() => o)),
    );
    o.getLatLng = vi.fn(() => ({ lat: 0, lng: 0 }));
    o.getBounds = vi.fn(() => ({ toBBoxString: () => '' }));
    return o;
  };
  const L: any = {
    map: vi.fn(s), layerGroup: vi.fn(s), featureGroup: vi.fn(s),
    FeatureGroup: function () { return s(); },
    icon: vi.fn(() => ({})), tileLayer: vi.fn(s), marker: vi.fn(s),
    control: { layers: vi.fn(s), scale: vi.fn(s) },
    Control: { extend: vi.fn(), Draw: function () { return s(); } },
    Draw: { Event: { CREATED: 'draw:created', DELETED: 'draw:deleted', EDITED: 'draw:edited' } },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

const D = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const MAY = new Date(2025, 4, 1);
const T10 = new Date(2025, 4, 10).getTime();
const T20 = new Date(2025, 4, 20).getTime();
const SUMMARY = {
  dates: [{ capturedDate: T10, count: 15 }, { capturedDate: T20, count: 7 }],
  countyData: [], availableCounties: [], availableMunicipalities: [],
};
const CAPTURES = [
  { id: 'c1', poles: ['p1', 'p2', 'p3'], startDate: new Date(2025, 4, 5).getTime(), endDate: new Date(2025, 4, 15).getTime(), createdDate: 0 },
  { id: 'c2', poles: ['p4', 'p5'], startDate: T20, endDate: T20, createdDate: 0 },
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
    polesService = TestBed.inject(PolesService);
    planCaptureService = TestBed.inject(PlanCaptureService);
    router = TestBed.inject(Router);
    vi.spyOn(polesService, 'getSummary').mockReturnValue(of(SUMMARY) as any);
    vi.spyOn(planCaptureService, 'getCaptures').mockReturnValue(of(CAPTURES) as any);
    fixture = TestBed.createComponent(CalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    component.currentMonth = MAY;
    component.buildCalendar();
    component.buildTimeline();
  });
  afterEach(() => vi.clearAllMocks());

  it('should create', () => expect(component).toBeTruthy());

  describe('buildCalendar()', () => {
    it('produces 42 days with 31 in current month', () => {
      expect(component.calendarDays).toHaveLength(42);
      expect(component.calendarDays.filter((d) => d.isCurrentMonth)).toHaveLength(31);
    });
    it('marks hasInspection from summary', () => {
      expect(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 10))?.hasInspection).toBe(true);
      expect(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 20))?.hasInspection).toBe(true);
    });
    it('places start / end markers at capture boundaries', () => {
      expect(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 5))?.captureMarkers).toContainEqual({ num: 1, type: 'start' });
      expect(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 15))?.captureMarkers).toContainEqual({ num: 1, type: 'end' });
    });
    it('single-day capture gets only a start marker', () => {
      const m = component.calendarDays.find((d) => d.dateStr === D(2025, 5, 20))?.captureMarkers ?? [];
      expect(m.some((x) => x.type === 'start' && x.num === 2)).toBe(true);
      expect(m.some((x) => x.type === 'end' && x.num === 2)).toBe(false);
    });
    it('marks isSelected on selected date only', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.buildCalendar();
      expect(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 10))?.isSelected).toBe(true);
      expect(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 11))?.isSelected).toBe(false);
    });
  });

  describe('selectDay()', () => {
    it('sets selectedDate for a current-month day', () => {
      component.selectDay(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 10) && d.isCurrentMonth)!);
      expect(component.selectedDate?.getDate()).toBe(10);
    });
    it('deselects when same day clicked twice', () => {
      const day = component.calendarDays.find((d) => d.dateStr === D(2025, 5, 10) && d.isCurrentMonth)!;
      component.selectDay(day);
      component.selectDay(component.calendarDays.find((d) => d.dateStr === D(2025, 5, 10))!);
      expect(component.selectedDate).toBeNull();
    });
    it('ignores fill days outside current month', () => {
      component.selectDay(component.calendarDays.find((d) => !d.isCurrentMonth)!);
      expect(component.selectedDate).toBeNull();
    });
    it('clearSelection() nulls selectedDate', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.clearSelection();
      expect(component.selectedDate).toBeNull();
    });
  });

  describe('buildTimeline() — selected date', () => {
    it('shows inspection with poleCount from summary', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.buildTimeline();
      expect(component.timelineItems.find((i) => i.type === 'inspection')?.poleCount).toBe(15);
    });
    it('captureRelation "starts" on capture start date', () => {
      component.selectedDate = new Date(2025, 4, 5);
      component.buildTimeline();
      expect(component.timelineItems.find((i) => i.captureNum === 1)?.captureRelation).toBe('starts');
    });
    it('captureRelation "ends" on capture end date', () => {
      component.selectedDate = new Date(2025, 4, 15);
      component.buildTimeline();
      expect(component.timelineItems.find((i) => i.captureNum === 1)?.captureRelation).toBe('ends');
    });
    it('captureRelation "starts & ends" for single-day capture', () => {
      component.selectedDate = new Date(2025, 4, 20);
      component.buildTimeline();
      expect(component.timelineItems.find((i) => i.captureNum === 2)?.captureRelation).toBe('starts & ends');
    });
  });

  describe('buildTimeline() — month overview', () => {
    beforeEach(() => {
      component.selectedDate = null;
      component.buildTimeline();
    });
    it('includes all inspections and captures in month', () => {
      expect(component.timelineItems.filter((i) => i.type === 'inspection')).toHaveLength(2);
      expect(component.timelineItems.filter((i) => i.type === 'capture')).toHaveLength(2);
    });
    it('items sorted by timestamp ascending', () => {
      const ts = component.timelineItems.map((i) => i.timestamp);
      expect(ts).toEqual([...ts].sort((a, b) => a - b));
    });
    it('excludes captures entirely outside month', () => {
      component.captures = [{ id: 'x', poles: [], startDate: new Date(2025, 6, 1).getTime(), endDate: new Date(2025, 6, 10).getTime(), createdDate: 0 }];
      component.buildTimeline();
      expect(component.timelineItems.filter((i) => i.type === 'capture')).toHaveLength(0);
    });
    it('poleCount comes from inspectionCounts', () => {
      expect(component.timelineItems.find((i) => i.timestamp === T10)?.poleCount).toBe(15);
      expect(component.timelineItems.find((i) => i.timestamp === T20)?.poleCount).toBe(7);
    });
  });

  describe('prevMonth() / nextMonth()', () => {
    it('prevMonth decrements month and clears selection', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.prevMonth();
      expect(component.currentMonth.getMonth()).toBe(3);
      expect(component.selectedDate).toBeNull();
    });
    it('nextMonth increments month and clears selection', () => {
      component.selectedDate = new Date(2025, 4, 10);
      component.nextMonth();
      expect(component.currentMonth.getMonth()).toBe(5);
      expect(component.selectedDate).toBeNull();
    });
  });

  describe('handleItemClick()', () => {
    it('navigates to /map/:timestamp for inspection', () => {
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.handleItemClick({ type: 'inspection', timestamp: T10, subtitle: '', color: '', poleCount: 0 });
      expect(spy).toHaveBeenCalledWith(['/map', T10]);
    });
    it('does not navigate for capture', () => {
      const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.handleItemClick({ type: 'capture', timestamp: T10, subtitle: '', color: '', poleCount: 0 });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit data loading', () => {
    it('populates inspectionDates and counts from summary', () => {
      expect(component.inspectionDates.has(D(2025, 5, 10))).toBe(true);
      expect(component.inspectionCounts.get(D(2025, 5, 10))).toBe(15);
      expect(component.inspectionCounts.get(D(2025, 5, 20))).toBe(7);
    });
    it('sets loadError when getSummary fails', async () => {
      vi.spyOn(polesService, 'getSummary').mockReturnValue(throwError(() => new Error('fail')) as any);
      await component.ngOnInit();
      expect(component.loadError).toBeTruthy();
    });
  });
});
