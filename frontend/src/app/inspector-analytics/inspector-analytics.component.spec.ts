import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { InspectorAnalyticsComponent } from './inspector-analytics.component';
import { InspectorService, Inspector } from '../service/inspector.service';
import { PolesService, InspectorStats } from '../service/poles.service';

vi.mock('chart.js', () => {
  const ChartMock = vi.fn().mockImplementation(() => ({ destroy: vi.fn() }));
  (ChartMock as any).register = vi.fn();
  return { Chart: ChartMock, registerables: [] };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const INSPECTOR_ID = 'insp-1';

const INSPECTOR: Inspector = {
  id: INSPECTOR_ID,
  firstName: 'Lars',
  lastName: 'Hansen',
  email: 'lars@example.com',
};

const mockStats: InspectorStats = {
  totalAssigned: 50,
  inspectedCount: 30,
  byAction: [
    { action: 'Replace', count: 8 },
    { action: 'Reposition/Realign', count: 5 },
    { action: 'No Action needed', count: 12 },
    { action: 'Not Inspected', count: 20 },
  ],
  byCounty: [{ county: 'Troms', count: 30 }, { county: 'Oslo', count: 20 }],
  byMunicipality: [{ municipality: 'Tromsø', count: 25 }],
  recentActivity: [
    { poleId: 'p1', county: 'Troms', action: 'Replace', inspectionDate: 1710547200000 },
    { poleId: 'p2', county: 'Oslo', action: 'No Action needed', inspectionDate: 1710460800000 },
  ],
};

const mockInspectorService = { getInspectorById: vi.fn() };
const mockPolesService = { getInspectorStats: vi.fn() };
const mockRouter = { navigate: vi.fn() };

const mockActivatedRoute = {
  snapshot: { paramMap: { get: vi.fn(() => INSPECTOR_ID) } },
};

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('InspectorAnalyticsComponent', () => {
  let component: InspectorAnalyticsComponent;
  let fixture: ComponentFixture<InspectorAnalyticsComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInspectorService.getInspectorById.mockReturnValue(of(INSPECTOR));
    mockPolesService.getInspectorStats.mockReturnValue(of(mockStats));

    await TestBed.configureTestingModule({
      imports: [InspectorAnalyticsComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: InspectorService, useValue: mockInspectorService },
        { provide: PolesService, useValue: mockPolesService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InspectorAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  // ── ngOnInit ───────────────────────────────────────────────────────────────
  describe('ngOnInit()', () => {
    it('reads inspector id from route', () => {
      expect(mockInspectorService.getInspectorById).toHaveBeenCalledWith(INSPECTOR_ID);
      expect(mockPolesService.getInspectorStats).toHaveBeenCalledWith(INSPECTOR_ID);
    });

    it('sets inspector on success', () => {
      expect(component.inspector?.id).toBe(INSPECTOR_ID);
    });

    it('sets isLoading false on success', () => {
      expect(component.isLoading).toBe(false);
    });

    it('navigates to /inspectors when inspector is null', () => {
      mockInspectorService.getInspectorById.mockReturnValue(of(undefined));
      component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/inspectors']);
    });

    it('sets isLoading false on error', () => {
      mockInspectorService.getInspectorById.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.isLoading).toBe(false);
    });
  });

  // ── computeStats ───────────────────────────────────────────────────────────
  describe('computeStats() — via ngOnInit', () => {
    it('sets totalAssigned', () => {
      expect(component.totalAssigned).toBe(50);
    });

    it('sets inspectedCount', () => {
      expect(component.inspectedCount).toBe(30);
    });

    it('sets pendingCount = totalAssigned - inspectedCount', () => {
      expect(component.pendingCount).toBe(20);
    });

    it('actionsNeeded excludes No Action needed and Not Inspected', () => {
      // Replace(8) + Reposition/Realign(5) = 13
      expect(component.actionsNeeded).toBe(13);
    });

    it('actionBreakdown excludes No Action needed and Not Inspected', () => {
      const actions = component.actionBreakdown.map((a) => a.action);
      expect(actions).not.toContain('No Action needed');
      expect(actions).not.toContain('Not Inspected');
    });

    it('actionBreakdown sorted by count descending', () => {
      const counts = component.actionBreakdown.map((a) => a.count);
      expect(counts).toEqual([...counts].sort((a, b) => b - a));
    });

    it('sets recentActivity from stats', () => {
      expect(component.recentActivity).toEqual(mockStats.recentActivity);
    });
  });

  // ── goBack ─────────────────────────────────────────────────────────────────
  describe('goBack()', () => {
    it('navigates to /inspectors', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/inspectors']);
    });
  });

  // ── getInitials ────────────────────────────────────────────────────────────
  describe('getInitials()', () => {
    it('returns uppercase initials from firstName and lastName', () => {
      expect(component.getInitials('Lars', 'Hansen')).toBe('LH');
    });

    it('returns first initial only when lastName missing', () => {
      expect(component.getInitials('Lars', undefined)).toBe('L');
    });

    it('returns empty string when both missing', () => {
      expect(component.getInitials(undefined, undefined)).toBe('');
    });
  });

  // ── getAvatarColor ─────────────────────────────────────────────────────────
  describe('getAvatarColor()', () => {
    const VALID = ['bg-sky-700', 'bg-indigo-700', 'bg-emerald-700', 'bg-violet-700', 'bg-rose-700', 'bg-amber-700'];

    it('returns a valid avatar color class', () => {
      expect(VALID).toContain(component.getAvatarColor(INSPECTOR_ID));
    });

    it('is deterministic for same id', () => {
      expect(component.getAvatarColor(INSPECTOR_ID)).toBe(component.getAvatarColor(INSPECTOR_ID));
    });
  });

  // ── getActionClass ─────────────────────────────────────────────────────────
  describe('getActionClass()', () => {
    it('Not assessed → muted grey with border', () => {
      expect(component.getActionClass('Not assessed')).toContain('border-slate-200');
    });

    it('No Action needed → slate', () => {
      expect(component.getActionClass('No Action needed')).toContain('bg-slate-100');
    });

    it('Replace → red', () => {
      expect(component.getActionClass('Replace')).toContain('red');
    });

    it('Reposition/Realign → blue', () => {
      expect(component.getActionClass('Reposition/Realign')).toContain('blue');
    });

    it('Missing → amber', () => {
      expect(component.getActionClass('Missing pole')).toContain('amber');
    });

    it('unknown → slate fallback', () => {
      expect(component.getActionClass('Unknown action')).toContain('bg-slate-100');
    });
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────────────
  describe('ngOnDestroy()', () => {
    it('does not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
