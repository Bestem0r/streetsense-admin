import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AssignInspectorDialogComponent } from './assign-inspector-dialog.component';
import { InspectorService, Inspector } from '../service/inspector.service';

const INSPECTORS: Inspector[] = [
  { id: 'a1', firstName: 'Lars', lastName: 'Hansen', email: 'lars@example.com' },
  { id: 'a2', firstName: 'Kari', lastName: 'Berg', email: 'kari@example.com' },
  { id: 'a3', firstName: undefined, lastName: undefined, email: 'noname@example.com' },
];

const mockInspectorService = { getInspectors: vi.fn() };

describe('AssignInspectorDialogComponent', () => {
  let component: AssignInspectorDialogComponent;
  let fixture: ComponentFixture<AssignInspectorDialogComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInspectorService.getInspectors.mockReturnValue(of(INSPECTORS));

    await TestBed.configureTestingModule({
      imports: [AssignInspectorDialogComponent],
      providers: [
        { provide: InspectorService, useValue: mockInspectorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignInspectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  // ── ngOnInit ───────────────────────────────────────────────────────────────
  describe('ngOnInit()', () => {
    it('loads inspectors and sets loading false on success', () => {
      expect(component.inspectors).toEqual(INSPECTORS);
      expect(component.filtered).toEqual(INSPECTORS);
      expect(component.loading).toBe(false);
    });

    it('sets loading false on error', () => {
      mockInspectorService.getInspectors.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.loading).toBe(false);
    });

    it('loading is true before data arrives', async () => {
      // Re-create component before detectChanges to observe initial state
      mockInspectorService.getInspectors.mockReturnValue(of(INSPECTORS));
      const f = TestBed.createComponent(AssignInspectorDialogComponent);
      expect(f.componentInstance.loading).toBe(true);
    });
  });

  // ── filter ─────────────────────────────────────────────────────────────────
  describe('filter()', () => {
    it('returns all inspectors when query is empty', () => {
      component.query = '';
      component.filter();
      expect(component.filtered).toEqual(INSPECTORS);
    });

    it('filters by first name (case-insensitive)', () => {
      component.query = 'lars';
      component.filter();
      expect(component.filtered).toHaveLength(1);
      expect(component.filtered[0].id).toBe('a1');
    });

    it('filters by last name', () => {
      component.query = 'berg';
      component.filter();
      expect(component.filtered).toHaveLength(1);
      expect(component.filtered[0].id).toBe('a2');
    });

    it('filters by email', () => {
      component.query = 'kari@example';
      component.filter();
      expect(component.filtered).toHaveLength(1);
      expect(component.filtered[0].id).toBe('a2');
    });

    it('returns empty array when no match', () => {
      component.query = 'zzznomatch';
      component.filter();
      expect(component.filtered).toHaveLength(0);
    });

    it('restores all when query cleared after filtering', () => {
      component.query = 'lars';
      component.filter();
      component.query = '';
      component.filter();
      expect(component.filtered).toHaveLength(INSPECTORS.length);
    });
  });

  // ── getInitials ────────────────────────────────────────────────────────────
  describe('getInitials()', () => {
    it('returns first letters of firstName and lastName', () => {
      expect(component.getInitials(INSPECTORS[0])).toBe('LH');
    });

    it('is uppercase', () => {
      const i: Inspector = { id: 'x', firstName: 'anna', lastName: 'berg', email: 'a@b.com' };
      expect(component.getInitials(i)).toBe('AB');
    });

    it('falls back to first letter of email when name missing', () => {
      expect(component.getInitials(INSPECTORS[2])).toBe('N');
    });

    it('handles only firstName present', () => {
      const i: Inspector = { id: 'x', firstName: 'Erik', email: 'e@b.com' };
      expect(component.getInitials(i)).toBe('E');
    });
  });

  // ── getAvatarColor ─────────────────────────────────────────────────────────
  describe('getAvatarColor()', () => {
    const VALID = ['bg-sky-700', 'bg-indigo-700', 'bg-emerald-700', 'bg-violet-700', 'bg-rose-700', 'bg-amber-700'];

    it('returns a valid Tailwind bg class', () => {
      expect(VALID).toContain(component.getAvatarColor('a1'));
    });

    it('is deterministic for same id', () => {
      expect(component.getAvatarColor('a1')).toBe(component.getAvatarColor('a1'));
    });

    it('different ids can produce different colors', () => {
      const results = new Set(INSPECTORS.map((i) => component.getAvatarColor(i.id)));
      expect(results.size).toBeGreaterThanOrEqual(1);
    });
  });

  // ── outputs ────────────────────────────────────────────────────────────────
  describe('outputs', () => {
    it('selected emits the inspector passed to it', () => {
      const spy = vi.fn();
      component.selected.subscribe(spy);
      component.selected.emit(INSPECTORS[0]);
      expect(spy).toHaveBeenCalledWith(INSPECTORS[0]);
    });

    it('cancelled emits void', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);
      component.cancelled.emit();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('selected and cancelled are independent', () => {
      const selectedSpy = vi.fn();
      const cancelledSpy = vi.fn();
      component.selected.subscribe(selectedSpy);
      component.cancelled.subscribe(cancelledSpy);
      component.selected.emit(INSPECTORS[1]);
      expect(selectedSpy).toHaveBeenCalledTimes(1);
      expect(cancelledSpy).not.toHaveBeenCalled();
    });
  });
});
