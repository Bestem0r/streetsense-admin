import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import { PolesService, DashboardStats } from '../service/poles.service';
import { InspectorService, Inspector } from '../service/inspector.service';

vi.mock('chart.js', () => {
  const ChartMock = vi.fn().mockImplementation(() => ({ destroy: vi.fn() }));
  (ChartMock as any).register = vi.fn();
  return { Chart: ChartMock, registerables: [] };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const INSPECTOR: Inspector = {
  id: 'insp-1',
  firstName: 'Lars',
  lastName: 'Hansen',
  email: 'lars@example.com',
};

const mockStats: DashboardStats = {
  totalPoles: 100,
  inspectedCount: 75,
  captureDates: [
    { capturedDate: 1710460800000, count: 10 },
    { capturedDate: 1710547200000, count: 15 },
  ],
  byCounty: [{ county: 'Troms', count: 60 }, { county: 'Oslo', count: 40 }],
  byInspector: [{ inspectorId: 'insp-1', inspected: 50, pending: 25 }],
  recentInspections: [
    { poleId: 'p1', county: 'Troms', action: 'Replace', assignedInspector: 'insp-1', inspectionDate: 1710547200000 },
    { poleId: 'p2', county: 'Oslo', action: '', assignedInspector: 'insp-unknown', inspectionDate: 1710460800000 },
  ],
};

const mockPolesService = { getDashboardStats: vi.fn() };
const mockInspectorService = { getInspectors: vi.fn() };

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('AnalyticsDashboardComponent', () => {
  let component: AnalyticsDashboardComponent;
  let fixture: ComponentFixture<AnalyticsDashboardComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPolesService.getDashboardStats.mockReturnValue(of(mockStats));
    mockInspectorService.getInspectors.mockReturnValue(of([INSPECTOR]));

    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: PolesService, useValue: mockPolesService },
        { provide: InspectorService, useValue: mockInspectorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  // ── ngOnInit ───────────────────────────────────────────────────────────────
  describe('ngOnInit()', () => {
    it('sets totalPoles from stats', () => {
      expect(component.totalPoles).toBe(100);
    });

    it('sets inspectedCount from stats', () => {
      expect(component.inspectedCount).toBe(75);
    });

    it('sets totalCaptureDates from captureDates.length', () => {
      expect(component.totalCaptureDates).toBe(2);
    });

    it('sets activeInspectors from inspectors.length', () => {
      expect(component.activeInspectors).toBe(1);
    });

    it('computes inspectionRate as percentage', () => {
      expect(component.inspectionRate).toBe(75);
    });

    it('inspectionRate is 0 when totalPoles is 0', () => {
      const emptyStats: DashboardStats = { ...mockStats, totalPoles: 0, inspectedCount: 0 };
      mockPolesService.getDashboardStats.mockReturnValue(of(emptyStats));
      component.ngOnInit();
      expect(component.inspectionRate).toBe(0);
    });

    it('sets isLoading to false on success', () => {
      expect(component.isLoading).toBe(false);
    });

    it('sets isLoading to false on error', () => {
      mockPolesService.getDashboardStats.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.isLoading).toBe(false);
    });
  });

  // ── recentActivity mapping ─────────────────────────────────────────────────
  describe('recentActivity', () => {
    it('maps inspector id to full name', () => {
      const row = component.recentActivity.find((r) => r.poleId === 'p1');
      expect(row?.inspectorName).toBe('Lars Hansen');
    });

    it('falls back to — when inspector not found', () => {
      const row = component.recentActivity.find((r) => r.poleId === 'p2');
      expect(row?.inspectorName).toBe('—');
    });

    it('falls back to Not assessed when action is empty', () => {
      const row = component.recentActivity.find((r) => r.poleId === 'p2');
      expect(row?.action).toBe('Not assessed');
    });

    it('preserves inspectorId on each row', () => {
      const row = component.recentActivity.find((r) => r.poleId === 'p1');
      expect(row?.inspectorId).toBe('insp-1');
    });
  });

  // ── getActionClass ─────────────────────────────────────────────────────────
  describe('getActionClass()', () => {
    it('Not assessed → muted grey with border', () => {
      expect(component.getActionClass('Not assessed')).toContain('border-slate-200');
    });

    it('No Action needed → gray', () => {
      expect(component.getActionClass('No Action needed')).toContain('bg-gray-100');
    });

    it('Reposition/Realign → blue', () => {
      expect(component.getActionClass('Reposition/Realign')).toContain('blue');
    });

    it('Replace → red', () => {
      expect(component.getActionClass('Replace')).toContain('red');
    });

    it('unknown action → slate fallback', () => {
      expect(component.getActionClass('Something else')).toContain('bg-slate-100');
    });
  });

  // ── getInitials ────────────────────────────────────────────────────────────
  describe('getInitials()', () => {
    it('returns uppercase initials from two words', () => {
      expect(component.getInitials('Lars Hansen')).toBe('LH');
    });

    it('returns single initial for one word', () => {
      expect(component.getInitials('Lars')).toBe('L');
    });

    it('returns at most 2 initials', () => {
      expect(component.getInitials('Lars Anders Hansen')).toBe('LA');
    });

    it('handles empty string', () => {
      expect(component.getInitials('')).toBe('');
    });
  });

  // ── getAvatarColor ─────────────────────────────────────────────────────────
  describe('getAvatarColor()', () => {
    const VALID = ['bg-sky-700', 'bg-indigo-700', 'bg-emerald-700', 'bg-violet-700', 'bg-rose-700', 'bg-amber-700'];

    it('returns a valid avatar color class', () => {
      expect(VALID).toContain(component.getAvatarColor('insp-1'));
    });

    it('is deterministic for same id', () => {
      expect(component.getAvatarColor('insp-1')).toBe(component.getAvatarColor('insp-1'));
    });
  });

  // ── ngOnDestroy ────────────────────────────────────────────────────────────
  describe('ngOnDestroy()', () => {
    it('does not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
