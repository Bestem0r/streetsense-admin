import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { InspectorsComponent } from './inspectors.component';
import { InspectorService, Inspector } from '../service/inspector.service';

const INSPECTORS: Inspector[] = [
  { id: 'a1', firstName: 'Lars', lastName: 'Hansen', email: 'lars@example.com' },
  { id: 'a2', firstName: 'Kari', lastName: 'Berg', email: 'kari@example.com' },
  { id: 'a3', firstName: 'Erik', lastName: 'Dahl', email: 'erik@example.com' },
];

const mockInspectorService = {
  getInspectors: vi.fn(),
  removeInspector: vi.fn(),
};

describe('InspectorsComponent', () => {
  let component: InspectorsComponent;
  let fixture: ComponentFixture<InspectorsComponent>;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInspectorService.getInspectors.mockReturnValue(of(INSPECTORS));
    mockInspectorService.removeInspector.mockReturnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [InspectorsComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: InspectorService, useValue: mockInspectorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InspectorsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  // ── ngOnInit / loadInspectors ──────────────────────────────────────────────
  describe('loadInspectors()', () => {
    it('populates inspectors on success', () => {
      expect(component.inspectors).toEqual(INSPECTORS);
    });

    it('calls getInspectors on ngOnInit', () => {
      expect(mockInspectorService.getInspectors).toHaveBeenCalled();
    });

    it('does not throw on service error', () => {
      mockInspectorService.getInspectors.mockReturnValue(throwError(() => new Error('fail')));
      expect(() => component.loadInspectors()).not.toThrow();
    });
  });

  // ── search ─────────────────────────────────────────────────────────────────
  describe('search()', () => {
    it('reloads all inspectors when query is blank', () => {
      component.searchQuery = '';
      component.search();
      expect(mockInspectorService.getInspectors).toHaveBeenCalledTimes(2);
    });

    it('reloads all inspectors when query is whitespace', () => {
      component.searchQuery = '   ';
      component.search();
      expect(mockInspectorService.getInspectors).toHaveBeenCalledTimes(2);
    });

    it('filters by firstName (case-insensitive)', () => {
      component.searchQuery = 'lars';
      component.search();
      expect(component.inspectors).toHaveLength(1);
      expect(component.inspectors[0].id).toBe('a1');
    });

    it('filters by lastName', () => {
      component.searchQuery = 'berg';
      component.search();
      expect(component.inspectors).toHaveLength(1);
      expect(component.inspectors[0].id).toBe('a2');
    });

    it('filters by email', () => {
      component.searchQuery = 'erik@example';
      component.search();
      expect(component.inspectors).toHaveLength(1);
      expect(component.inspectors[0].id).toBe('a3');
    });

    it('returns empty when no match', () => {
      component.searchQuery = 'zzznomatch';
      component.search();
      expect(component.inspectors).toHaveLength(0);
    });
  });

  // ── removeInspector ────────────────────────────────────────────────────────
  describe('removeInspector()', () => {
    it('calls removeInspector on service with correct id', () => {
      component.removeInspector('a1');
      expect(mockInspectorService.removeInspector).toHaveBeenCalledWith('a1');
    });

    it('reloads inspectors after successful removal', () => {
      component.removeInspector('a1');
      expect(mockInspectorService.getInspectors).toHaveBeenCalledTimes(2);
    });

    it('does not throw on error', () => {
      mockInspectorService.removeInspector.mockReturnValue(throwError(() => new Error('fail')));
      expect(() => component.removeInspector('a1')).not.toThrow();
    });

    it('does not reload inspectors on error', () => {
      mockInspectorService.removeInspector.mockReturnValue(throwError(() => new Error('fail')));
      component.removeInspector('a1');
      expect(mockInspectorService.getInspectors).toHaveBeenCalledTimes(1);
    });
  });

  // ── getInitials ────────────────────────────────────────────────────────────
  describe('getInitials()', () => {
    it('returns uppercase initials from firstName and lastName', () => {
      expect(component.getInitials('Lars', 'Hansen')).toBe('LH');
    });

    it('returns single initial when lastName missing', () => {
      expect(component.getInitials('Lars', undefined)).toBe('L');
    });

    it('returns empty string when both missing', () => {
      expect(component.getInitials(undefined, undefined)).toBe('');
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
  });

  // ── viewAnalytics ──────────────────────────────────────────────────────────
  describe('viewAnalytics()', () => {
    it('navigates to /inspector-analytics/:id', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.viewAnalytics('a1');
      expect(spy).toHaveBeenCalledWith(['/inspector-analytics', 'a1']);
    });
  });

  // ── modal controls ─────────────────────────────────────────────────────────
  describe('openAddInspectorModal()', () => {
    it('sets showAddInspectorModal to true', () => {
      component.showAddInspectorModal = false;
      component.openAddInspectorModal();
      expect(component.showAddInspectorModal).toBe(true);
    });
  });

  describe('closeAddInspectorModal()', () => {
    it('sets showAddInspectorModal to false', () => {
      component.showAddInspectorModal = true;
      component.closeAddInspectorModal();
      expect(component.showAddInspectorModal).toBe(false);
    });
  });

  describe('onInspectorAdded()', () => {
    it('closes modal and reloads inspectors', () => {
      component.showAddInspectorModal = true;
      component.onInspectorAdded();
      expect(component.showAddInspectorModal).toBe(false);
      expect(mockInspectorService.getInspectors).toHaveBeenCalledTimes(2);
    });
  });
});
