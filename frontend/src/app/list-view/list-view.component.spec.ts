import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { ListViewComponent } from './list-view.component';
import { PoleSummaryResponse } from '../interfaces/pole-summary-response';
import { PoleInterface } from '../interfaces/pole-interface';

// ── Leaflet mock ──────────────────────────────────────────────────────────────
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
    };
    return self;
  };
  function FeatureGroup() { return stub(); }
  function DrawControl() { return stub(); }
  const L = {
    map: vi.fn(stub), layerGroup: vi.fn(stub),
    featureGroup: vi.fn(stub), FeatureGroup,
    icon: vi.fn(() => ({})), tileLayer: vi.fn(stub), marker: vi.fn(stub),
    control: { layers: vi.fn(stub), scale: vi.fn(stub) },
    Control: { extend: vi.fn(), Draw: DrawControl },
    Draw: { Event: { CREATED: 'draw:created', DELETED: 'draw:deleted', EDITED: 'draw:edited' } },
  };
  return { ...L, default: L };
});
vi.mock('leaflet-draw', () => ({ default: {} }));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const SUMMARY: PoleSummaryResponse = {
  dates: [
    { capturedDate: 1710460800000, count: 3 }, // 2024-03-15
    { capturedDate: 1710374400000, count: 2 }, // 2024-03-14
  ],
  countyData: [
    { county: 'Oslo', municipalities: ['Sentrum', 'Alna'] },
    { county: 'Akershus', municipalities: ['Bærum', 'Asker'] },
  ],
  availableCounties: ['Oslo', 'Akershus'],
  availableMunicipalities: ['Sentrum', 'Alna', 'Bærum', 'Asker'],
};

const POLE: PoleInterface = {
  id: 'pole1',
  capturedDate: '1710460800000',
  county: 'Oslo',
  municipality: 'Sentrum',
  images: [
    { imageId: 'img1', capturedDate: 1710460800000 },
    { imageId: 'img2', capturedDate: 1710547200000 },
  ],
};

const PAGED_RESPONSE = { content: [POLE], hasMore: false, totalElements: 1 };

const INSPECTORS_RESPONSE = {
  success: true, message: 'OK',
  data: [{
    id: 'i1', userName: 'lars', firstName: 'Lars', lastName: 'Hansen',
    email: 'lars@test.com', phone: '12345678', county: 'Oslo',
    role: 'Inspector', createdAt: '2024-01-01',
  }],
};

describe('ListViewComponent', () => {
  let component: ListViewComponent;
  let fixture: ComponentFixture<ListViewComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ListViewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ListViewComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function init(summary: PoleSummaryResponse = SUMMARY) {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.includes('/users')).flush(INSPECTORS_RESPONSE);
    httpMock.expectOne((r) => r.url.includes('/summary')).flush(summary);
  }

  function flushPoles() {
    httpMock
      .expectOne((r) => r.url.includes('/poles') && !r.url.includes('/summary'))
      .flush(PAGED_RESPONSE);
  }

  it('should create', () => {
    init();
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ───────────────────────────────────────────────────────────────
  describe('ngOnInit()', () => {
    it('populates allDates sorted newest-first', () => {
      init();
      expect(component.allDates[0]).toBe('2024-03-15');
      expect(component.allDates[1]).toBe('2024-03-14');
    });

    it('populates dateCounts from summary', () => {
      init();
      expect(component.dateCounts.get('2024-03-15')).toBe(3);
      expect(component.dateCounts.get('2024-03-14')).toBe(2);
    });

    it('sets summaryData', () => {
      init();
      expect(component.summaryData?.availableCounties).toEqual(['Oslo', 'Akershus']);
    });

    it('does not call getPolesByDate when openDate is null', () => {
      init();
      httpMock.expectNone((r) => r.url.includes('/poles') && !r.url.includes('/summary'));
    });

    it('loads poles when sessionStorage has a stored openDate that exists in summary', () => {
      sessionStorage.setItem('openDate', '2024-03-15');
      const localFixture = TestBed.createComponent(ListViewComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();
      httpMock.expectOne((r) => r.url.includes('/users')).flush(INSPECTORS_RESPONSE);
      httpMock.expectOne((r) => r.url.includes('/summary')).flush(SUMMARY);
      httpMock.expectOne((r) => r.url.includes('/poles') && !r.url.includes('/summary')).flush(PAGED_RESPONSE);
      expect(localComponent.openDate).toBe('2024-03-15');
    });

    it('normalizes dot-format date from sessionStorage', () => {
      sessionStorage.setItem('openDate', '15.03.2024');
      const localFixture = TestBed.createComponent(ListViewComponent);
      const localComponent = localFixture.componentInstance;
      expect(localComponent.openDate).toBe('2024-03-15');
      localFixture.detectChanges();
      httpMock.expectOne((r) => r.url.includes('/users')).flush(INSPECTORS_RESPONSE);
      httpMock.expectOne((r) => r.url.includes('/summary')).flush(SUMMARY);
      httpMock.expectOne((r) => r.url.includes('/poles') && !r.url.includes('/summary')).flush(PAGED_RESPONSE);
    });
  });

  // ── Date helpers ───────────────────────────────────────────────────────────
  describe('parseIsoDate()', () => {
    it('returns epoch ms for ISO date', () => {
      init();
      expect(component.parseIsoDate('2024-03-15')).toBe(new Date('2024-03-15T00:00:00Z').getTime());
    });
  });

  describe('formatDateLabel()', () => {
    it('formats ISO date to Norwegian dd.MM.yyyy', () => {
      init();
      const label = component.formatDateLabel('2024-03-15');
      expect(label).toContain('15');
      expect(label).toContain('03');
      expect(label).toContain('2024');
    });
  });

  describe('dayOfWeek()', () => {
    it('returns Friday for 2024-03-15', () => {
      init();
      expect(component.dayOfWeek('2024-03-15')).toBe('Friday');
    });

    it('returns empty string for invalid date', () => {
      init();
      expect(component.dayOfWeek('not-a-date')).toBe('');
    });
  });

  // ── Computed getters ───────────────────────────────────────────────────────
  describe('availableCounties', () => {
    it('returns counties from summaryData', () => {
      init();
      expect(component.availableCounties).toEqual(['Oslo', 'Akershus']);
    });

    it('returns empty array when summaryData is null', () => {
      init();
      component.summaryData = null;
      expect(component.availableCounties).toEqual([]);
    });
  });

  describe('availableMunicipalities', () => {
    it('returns all municipalities when no county selected', () => {
      init();
      expect(component.availableMunicipalities).toEqual(['Sentrum', 'Alna', 'Bærum', 'Asker']);
    });

    it('returns only municipalities for selected county', () => {
      init();
      component.selectedCounties = ['Oslo'];
      expect(component.availableMunicipalities).toEqual(['Alna', 'Sentrum']);
    });
  });

  describe('filteredCountyOptions', () => {
    it('returns all when search is empty', () => {
      init();
      expect(component.filteredCountyOptions.length).toBe(2);
    });

    it('filters case-insensitively', () => {
      init();
      component.countySearch = 'OSLO';
      expect(component.filteredCountyOptions).toEqual(['Oslo']);
    });

    it('returns empty when no match', () => {
      init();
      component.countySearch = 'zzz';
      expect(component.filteredCountyOptions).toEqual([]);
    });
  });

  describe('filteredMunicipalityOptions', () => {
    it('filters case-insensitively', () => {
      init();
      component.municipalitySearch = 'SENTRUM';
      expect(component.filteredMunicipalityOptions).toEqual(['Sentrum']);
    });
  });

  describe('activeFilterCount', () => {
    it('starts at 0', () => {
      init();
      expect(component.activeFilterCount).toBe(0);
    });

    it('sums counties + municipalities + statuses', () => {
      init();
      component.selectedCounties = ['Oslo'];
      component.selectedMunicipalities = ['Sentrum'];
      component.selectedStatuses = ['inspected', 'notInspected'];
      expect(component.activeFilterCount).toBe(4);
    });
  });

  describe('activeFilterChips', () => {
    it('builds chip for each active filter type', () => {
      init();
      component.selectedStatuses = ['inspected'];
      component.selectedCounties = ['Oslo'];
      component.selectedMunicipalities = ['Sentrum'];
      const chips = component.activeFilterChips;
      expect(chips.length).toBe(3);
      expect(chips.find((c) => c.type === 'status')?.label).toBe('Inspected');
      expect(chips.find((c) => c.type === 'county')?.label).toBe('Oslo');
      expect(chips.find((c) => c.type === 'municipality')?.label).toBe('Sentrum');
    });

    it('labels uninspected status correctly', () => {
      init();
      component.selectedStatuses = ['notInspected'];
      expect(component.activeFilterChips[0].label).toBe('Not Inspected');
    });
  });

  describe('visibleDates / remainingDates / showMoreDates / showLessDates', () => {
    const MANY_DATES: PoleSummaryResponse = {
      ...SUMMARY,
      dates: Array.from({ length: 6 }, (_, i) => ({
        capturedDate: 1710460800000 - i * 86400000,
        count: 1,
      })),
    };

    it('visibleDates returns 4 by default when more than 4 dates', () => {
      init(MANY_DATES);
      expect(component.visibleDates.length).toBe(4);
    });

    it('remainingDates returns surplus count', () => {
      init(MANY_DATES);
      expect(component.remainingDates).toBe(2);
    });

    it('showMoreDates() shows all', () => {
      init(MANY_DATES);
      component.showMoreDates();
      expect(component.visibleDates.length).toBe(6);
    });

    it('showLessDates() reverts to 4', () => {
      init(MANY_DATES);
      component.showMoreDates();
      component.showLessDates();
      expect(component.visibleDates.length).toBe(4);
    });
  });

  describe('totalVisiblePoles', () => {
    it('returns filteredData length', () => {
      init();
      (component as any).filteredData = [POLE, POLE];
      expect(component.totalVisiblePoles).toBe(2);
    });
  });

  // ── Toggle methods ─────────────────────────────────────────────────────────
  describe('toggleStatus()', () => {
    it('adds status when not selected', () => {
      init();
      component.toggleStatus('inspected');
      expect(component.selectedStatuses).toContain('inspected');
    });

    it('removes status when already selected', () => {
      init();
      component.selectedStatuses = ['inspected'];
      component.toggleStatus('inspected');
      expect(component.selectedStatuses).not.toContain('inspected');
    });
  });

  describe('toggleCounty()', () => {
    it('adds county', () => {
      init();
      component.toggleCounty('Oslo');
      expect(component.selectedCounties).toContain('Oslo');
    });

    it('removes county', () => {
      init();
      component.selectedCounties = ['Oslo'];
      component.toggleCounty('Oslo');
      expect(component.selectedCounties).not.toContain('Oslo');
    });

    it('removes municipalities not in remaining counties when county deselected', () => {
      init();
      component.selectedCounties = ['Oslo', 'Akershus'];
      component.selectedMunicipalities = ['Sentrum', 'Bærum'];
      component.toggleCounty('Oslo');
      expect(component.selectedMunicipalities).not.toContain('Sentrum');
      expect(component.selectedMunicipalities).toContain('Bærum');
    });
  });

  describe('toggleMunicipality()', () => {
    it('adds municipality', () => {
      init();
      component.toggleMunicipality('Sentrum');
      expect(component.selectedMunicipalities).toContain('Sentrum');
    });

    it('removes municipality when already selected', () => {
      init();
      component.selectedMunicipalities = ['Sentrum'];
      component.toggleMunicipality('Sentrum');
      expect(component.selectedMunicipalities).not.toContain('Sentrum');
    });
  });

  describe('setFocusedPole()', () => {
    it('sets focusedPole', () => {
      init();
      component.setFocusedPole('pole1');
      expect(component.focusedPole).toBe('pole1');
    });

    it('toggles off when same id called twice', () => {
      init();
      component.setFocusedPole('pole1');
      component.setFocusedPole('pole1');
      expect(component.focusedPole).toBeNull();
    });
  });

  describe('toggleFilters()', () => {
    it('opens filter panel', () => {
      init();
      component.toggleFilters({ stopPropagation: vi.fn() } as unknown as MouseEvent);
      expect(component.isFilterOpen).toBe(true);
    });

    it('closes filter panel on second toggle', () => {
      init();
      const e = { stopPropagation: vi.fn() } as unknown as MouseEvent;
      component.toggleFilters(e);
      component.toggleFilters(e);
      expect(component.isFilterOpen).toBe(false);
    });
  });

  // ── Accordion ──────────────────────────────────────────────────────────────
  describe('toggleAccordion()', () => {
    it('sets openDate, selectedDate and sessionStorage', () => {
      init();
      component.toggleAccordion('2024-03-15');
      flushPoles();
      expect(component.openDate).toBe('2024-03-15');
      expect(component.selectedDate).toBe('2024-03-15');
      expect(sessionStorage.getItem('openDate')).toBe('2024-03-15');
    });

    it('closes when same date toggled again', () => {
      init();
      component.toggleAccordion('2024-03-15');
      flushPoles();
      component.toggleAccordion('2024-03-15');
      expect(component.openDate).toBeNull();
      expect(sessionStorage.getItem('openDate')).toBeNull();
    });

    it('populates filteredData after poles load', () => {
      init();
      component.toggleAccordion('2024-03-15');
      flushPoles();
      expect(component.filteredData.length).toBe(1);
      expect(component.filteredData[0].id).toBe('pole1');
    });

    it('uses cache on re-open — no second HTTP request', () => {
      init();
      component.toggleAccordion('2024-03-15');
      flushPoles();
      component.toggleAccordion('2024-03-15'); // close
      component.toggleAccordion('2024-03-15'); // re-open from cache
      httpMock.expectNone((r) => r.url.includes('/poles') && !r.url.includes('/summary'));
    });
  });

  describe('groupByDate()', () => {
    it('sets openDate and selectedDate', () => {
      init();
      component.groupByDate('2024-03-15');
      flushPoles();
      expect(component.openDate).toBe('2024-03-15');
      expect(component.selectedDate).toBe('2024-03-15');
    });

    it('clears state when null passed', () => {
      init();
      component.openDate = '2024-03-15';
      component.groupByDate(null);
      expect(component.openDate).toBeNull();
      expect(component.filteredData).toEqual([]);
    });
  });

  // ── Filter operations ──────────────────────────────────────────────────────
  describe('applyFilters()', () => {
    it('closes panel and re-fetches summary', () => {
      init();
      component.isFilterOpen = true;
      component.applyFilters();
      expect(component.isFilterOpen).toBe(false);
      httpMock.expectOne((r) => r.url.includes('/summary')).flush(SUMMARY);
    });
  });

  describe('resetFilters()', () => {
    it('clears all filter selections', () => {
      init();
      component.selectedCounties = ['Oslo'];
      component.selectedMunicipalities = ['Sentrum'];
      component.selectedStatuses = ['inspected'];
      component.countySearch = 'x';
      component.municipalitySearch = 'y';
      component.resetFilters();
      httpMock.expectOne((r) => r.url.includes('/summary')).flush(SUMMARY);
      expect(component.selectedCounties).toEqual([]);
      expect(component.selectedMunicipalities).toEqual([]);
      expect(component.selectedStatuses).toEqual([]);
      expect(component.countySearch).toBe('');
      expect(component.municipalitySearch).toBe('');
    });
  });

  describe('removeChip()', () => {
    it('removes status chip and re-fetches', () => {
      init();
      component.selectedStatuses = ['inspected'];
      component.removeChip({ type: 'status', value: 'inspected' });
      httpMock.expectOne((r) => r.url.includes('/summary')).flush(SUMMARY);
      expect(component.selectedStatuses).not.toContain('inspected');
    });

    it('removes county chip and re-fetches', () => {
      init();
      component.selectedCounties = ['Oslo'];
      component.removeChip({ type: 'county', value: 'Oslo' });
      httpMock.expectOne((r) => r.url.includes('/summary')).flush(SUMMARY);
      expect(component.selectedCounties).not.toContain('Oslo');
    });

    it('removes municipality chip and re-fetches', () => {
      init();
      component.selectedMunicipalities = ['Sentrum'];
      component.removeChip({ type: 'municipality', value: 'Sentrum' });
      httpMock.expectOne((r) => r.url.includes('/summary')).flush(SUMMARY);
      expect(component.selectedMunicipalities).not.toContain('Sentrum');
    });
  });

  // ── Image helpers ──────────────────────────────────────────────────────────
  describe('getLatestImg()', () => {
    it('returns image with highest capturedDate', () => {
      init();
      expect(component.getLatestImg(POLE)?.imageId).toBe('img2');
    });

    it('returns null when pole has no images', () => {
      init();
      expect(component.getLatestImg({ id: 'p2' })).toBeNull();
    });
  });

  describe('getLatestImageId()', () => {
    it('returns imageId of newest image', () => {
      init();
      expect(component.getLatestImageId(POLE)).toBe('img2');
    });

    it('returns empty string when no images', () => {
      init();
      expect(component.getLatestImageId({ id: 'p2' })).toBe('');
    });
  });

  // ── Inspector name ─────────────────────────────────────────────────────────
  describe('getInspectorName()', () => {
    it('returns full name for known inspector', () => {
      init();
      expect(component.getInspectorName('i1')).toBe('Lars Hansen');
    });

    it('returns empty string for unknown id', () => {
      init();
      expect(component.getInspectorName('unknown')).toBe('');
    });

    it('returns empty string when id is undefined', () => {
      init();
      expect(component.getInspectorName(undefined)).toBe('');
    });
  });

  // ── Page-state helpers ─────────────────────────────────────────────────────
  describe('getDateCount()', () => {
    it('returns count from dateCounts before any poles loaded', () => {
      init();
      expect(component.getDateCount('2024-03-15')).toBe(3);
    });

    it('returns totalElements from pageState after poles loaded', () => {
      init();
      component.toggleAccordion('2024-03-15');
      flushPoles();
      expect(component.getDateCount('2024-03-15')).toBe(1);
    });
  });

  describe('isLoadingDate()', () => {
    it('returns false for unknown date', () => {
      init();
      expect(component.isLoadingDate('2024-03-15')).toBe(false);
    });
  });

  describe('hasMoreForDate()', () => {
    it('returns false when no pageState exists', () => {
      init();
      expect(component.hasMoreForDate('2024-03-15')).toBe(false);
    });

    it('returns false when PAGED_RESPONSE.hasMore is false', () => {
      init();
      component.toggleAccordion('2024-03-15');
      flushPoles();
      expect(component.hasMoreForDate('2024-03-15')).toBe(false);
    });
  });

  // ── onDocumentClick ────────────────────────────────────────────────────────
  describe('onDocumentClick()', () => {
    it('closes filter panel when clicking outside', () => {
      init();
      component.isFilterOpen = true;
      const outside = document.createElement('div');
      component.onDocumentClick({ target: outside } as unknown as MouseEvent);
      expect(component.isFilterOpen).toBe(false);
    });

    it('keeps filter open when clicking inside data-filter-panel', () => {
      init();
      component.isFilterOpen = true;
      const panel = document.createElement('div');
      panel.setAttribute('data-filter-panel', 'true');
      const inside = document.createElement('span');
      panel.appendChild(inside);
      document.body.appendChild(panel);
      component.onDocumentClick({ target: inside } as unknown as MouseEvent);
      expect(component.isFilterOpen).toBe(true);
      document.body.removeChild(panel);
    });
  });
});
