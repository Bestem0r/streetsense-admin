import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { PoleInterface } from '../interfaces/pole-interface';
import { PoleSummaryResponse } from '../interfaces/pole-summary-response';
import { MapViewComponent } from '../map-view/map-view.component';
import { NavComponent } from '../navbar/nav.component';
import { PolesService } from '../service/poles.service';
import { InspectorService, Inspector } from '../service/inspector.service';

interface PoleWithComputed extends PoleInterface {
  _dateObj: Date;
  _dateStr: string;
}

//TODO: capture date fra selv objecetet burde fjernes.

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MapViewComponent,
    MatIcon,
    NavComponent,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss',
})
export class ListViewComponent implements OnInit {
  summaryData: PoleSummaryResponse | null = null;
  polesData: PoleWithComputed[] = [];
  filteredData: PoleWithComputed[] = [];
  allDates: string[] = [];
  showAllDates = false;
  loadedPolesByRequest = new Map<string, PoleWithComputed[]>();
  dateCounts = new Map<string, number>();
  openDate: string | null = this.normalizeStoredDate(
    sessionStorage.getItem('openDate'),
  );
  focusedPole: string | null = null;
  selectedDate: string | null = this.normalizeStoredDate(
    sessionStorage.getItem('selectedDate'),
  );
  isFilterOpen = false;
  showScrollTopButton = false;
  pageState = new Map<
    string,
    { page: number; hasMore: boolean; loading: boolean; totalElements: number }
  >();

  // Filter state
  selectedCounties: string[] = [];
  selectedMunicipalities: string[] = [];
  selectedStatuses: string[] = [];
  countySearch = '';
  municipalitySearch = '';

  readonly todayMs = Date.now();
  private polesService = inject(PolesService);
  private inspectorService = inject(InspectorService);
  private inspectorMap = new Map<string, Inspector>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isFilterOpen && !target.closest('[data-filter-panel]')) {
      this.isFilterOpen = false;
    }
  }

  ngOnInit() {
    this.inspectorService.getInspectors().subscribe((list) => {
      list.forEach((i) => this.inspectorMap.set(i.id, i));
    });
    this.fetchSummary(() => {
      if (this.openDate) {
        this.loadPolesForDate(this.openDate);
      } else {
        this.filteredData = [];
        this.polesData = [];
      }
    });
  }

  private fetchSummary(onComplete?: () => void) {
    this.polesService
      .getSummary(this.selectedCounties, this.selectedMunicipalities)
      .subscribe((summary) => {
        this.summaryData = summary;

        this.allDates = summary.dates
          .map((dateCount) => this.toIsoDate(dateCount.capturedDate))
          .sort(
            (left, right) => this.parseIsoDate(right) - this.parseIsoDate(left),
          );

        this.dateCounts.clear();
        summary.dates.forEach((dateCount) => {
          this.dateCounts.set(
            this.toIsoDate(dateCount.capturedDate),
            dateCount.count,
          );
        });

        if (this.openDate && !this.allDates.includes(this.openDate)) {
          this.openDate = null;
          sessionStorage.removeItem('openDate');
        }
        if (this.selectedDate && !this.allDates.includes(this.selectedDate)) {
          this.selectedDate = null;
          sessionStorage.removeItem('selectedDate');
        }
        if (!this.selectedDate && this.openDate) {
          this.selectedDate = this.openDate;
        }

        onComplete?.();
      });
  }

  get availableCounties(): string[] {
    return this.summaryData?.availableCounties ?? [];
  }

  get availableMunicipalities(): string[] {
    if (!this.summaryData) {
      return [];
    }

    if (!this.selectedCounties.length) {
      return this.summaryData.availableMunicipalities;
    }

    return this.getMunicipalitiesForCounties(this.selectedCounties);
  }

  get filteredCountyOptions(): string[] {
    const q = this.countySearch.toLowerCase();
    return this.availableCounties.filter((county) =>
      county.toLowerCase().includes(q),
    );
  }

  get filteredMunicipalityOptions(): string[] {
    const q = this.municipalitySearch.toLowerCase();
    return this.availableMunicipalities.filter((municipality) =>
      municipality.toLowerCase().includes(q),
    );
  }

  get activeFilterCount(): number {
    return (
      this.selectedCounties.length +
      this.selectedMunicipalities.length +
      this.selectedStatuses.length
    );
  }

  get activeFilterChips(): { label: string; type: string; value: string }[] {
    const chips: { label: string; type: string; value: string }[] = [];
    this.selectedStatuses.forEach((s) =>
      chips.push({
        label: s === 'inspected' ? 'Inspected' : 'Not Inspected',
        type: 'status',
        value: s,
      }),
    );
    this.selectedCounties.forEach((c) =>
      chips.push({ label: c, type: 'county', value: c }),
    );
    this.selectedMunicipalities.forEach((m) =>
      chips.push({ label: m, type: 'municipality', value: m }),
    );
    return chips;
  }

  parseIsoDate(date: string): number {
    return new Date(`${date}T00:00:00Z`).getTime();
  }

  toggleAccordion(date: string) {
    if (this.openDate === date) {
      this.openDate = null;
      this.showScrollTopButton = false;
      if (this.selectedDate === date) {
        this.selectedDate = null;
      }
      sessionStorage.removeItem('openDate');
      if (!this.selectedDate) {
        sessionStorage.removeItem('selectedDate');
      }
      this.filteredData = [];
      return;
    }

    this.openDate = date;
    this.selectedDate = date;
    sessionStorage.setItem('openDate', date);
    sessionStorage.setItem('selectedDate', date);
    this.loadPolesForDate(date);
  }

  groupByDate(date: string | null = null) {
    if (!date) {
      this.selectedDate = null;
      this.openDate = null;
      this.filteredData = [];
      sessionStorage.removeItem('openDate');
      sessionStorage.removeItem('selectedDate');
      return;
    }
    this.selectedDate = date;
    this.openDate = date;
    sessionStorage.setItem('selectedDate', date);
    sessionStorage.setItem('openDate', date);
    this.loadPolesForDate(date);
  }

  get sortedDates(): string[] {
    return this.allDates;
  }

  getPolesByDate(date: string): PoleWithComputed[] {
    return this.loadedPolesByRequest.get(this.buildRequestKey(date)) || [];
  }

  getDateCount(date: string): number {
    const requestKey = this.buildRequestKey(date);
    const state = this.pageState.get(requestKey);
    if (state && state.totalElements > 0) {
      return state.totalElements;
    }
    return this.dateCounts.get(date) ?? 0;
  }

  get visibleDates(): string[] {
    return this.showAllDates ? this.allDates : this.allDates.slice(0, 4);
  }

  get remainingDates(): number {
    return Math.max(this.allDates.length - 4, 0);
  }

  get totalVisiblePoles(): number {
    return this.filteredData.length;
  }

  showMoreDates() {
    this.showAllDates = true;
  }

  showLessDates() {
    this.showAllDates = false;
  }

  formatDateLabel(date: string): string {
    return new Intl.DateTimeFormat('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(`${date}T00:00:00Z`));
  }

  dayOfWeek(date: string): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const d = new Date(`${date}T00:00:00Z`);
    return isNaN(d.getTime()) ? '' : days[d.getDay()];
  }

  onListScroll(event: Event) {
    const container = event.target as HTMLElement;
    this.showScrollTopButton = container.scrollTop > 150;

    if (!this.openDate) return;
    const requestKey = this.buildRequestKey(this.openDate);
    const state = this.pageState.get(requestKey);
    if (!state || state.loading || !state.hasMore) return;

    const sentinel = document.getElementById(`sentinel-${this.openDate}`);
    if (!sentinel) return;
    const sentinelTop = sentinel.getBoundingClientRect().top;
    const containerBottom = container.getBoundingClientRect().bottom;
    if (sentinelTop <= containerBottom + 200) {
      this.loadPageForDate(this.openDate, state.page + 1);
    }
  }

  scrollToAccordion(date: string) {
    document
      .getElementById(`accordion-${date}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setFocusedPole(id: string) {
    this.focusedPole = this.focusedPole === id ? null : id;
  }

  toggleFilters(event: MouseEvent) {
    event.stopPropagation();
    this.isFilterOpen = !this.isFilterOpen;
  }

  toggleStatus(value: string) {
    const i = this.selectedStatuses.indexOf(value);
    if (i > -1) this.selectedStatuses.splice(i, 1);
    else this.selectedStatuses.push(value);
  }

  /**
   * Toggles the selection of a county.
   * If the county is already selected, it will be removed from the selection.
   * If it's not selected, it will be added.
   * When a county is deselected, any municipalities that are not within the remaining selected counties will also be deselected.
   * @param county  The county to toggle
   */
  toggleCounty(county: string) {
    const i = this.selectedCounties.indexOf(county);
    if (i > -1) {
      this.selectedCounties.splice(i, 1);
      if (this.selectedCounties.length) {
        const valid = new Set(
          this.getMunicipalitiesForCounties(this.selectedCounties),
        );
        this.selectedMunicipalities = this.selectedMunicipalities.filter((m) =>
          valid.has(m),
        );
      }
    } else {
      this.selectedCounties.push(county);
    }
  }

  toggleMunicipality(municipality: string) {
    const i = this.selectedMunicipalities.indexOf(municipality);
    if (i > -1) this.selectedMunicipalities.splice(i, 1);
    else this.selectedMunicipalities.push(municipality);
  }

  /**
   * Removes a filter chip based on its type and value.
   * @param chip  The chip to remove, containing its type (status, county, municipality) and value.
   */
  removeChip(chip: { type: string; value: string }) {
    if (chip.type === 'status') this.toggleStatus(chip.value);
    else if (chip.type === 'county') this.toggleCounty(chip.value);
    else if (chip.type === 'municipality') this.toggleMunicipality(chip.value);
    this.applyFilters();
  }

  applyFilters() {
    this.isFilterOpen = false;
    this.fetchSummary(() => {
      if (this.openDate) this.loadPolesForDate(this.openDate);
    });
  }

  resetFilters() {
    this.selectedCounties = [];
    this.selectedMunicipalities = [];
    this.selectedStatuses = [];
    this.countySearch = '';
    this.municipalitySearch = '';
    this.fetchSummary(() => {
      if (this.openDate) this.loadPolesForDate(this.openDate);
      else this.filteredData = [];
    });
  }

  getLatestImg(pole: PoleInterface) {
    if (!pole.images?.length) return null;
    return pole.images.reduce((a, b) =>
      +(b.capturedDate ?? 0) > +(a.capturedDate ?? 0) ? b : a,
    );
  }

  getInspectorName(id?: string): string {
    if (!id) return '';
    const i = this.inspectorMap.get(id);
    if (!i) return '';
    return `${i.firstName ?? ''} ${i.lastName ?? ''}`.trim() || i.email;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/placeholder.svg';
  }

  getLatestImageId(pole: PoleInterface): string {
    return (
      pole.images?.reduce(
        (latest, img) => {
          const date =
            typeof img.capturedDate === 'string'
              ? parseInt(img.capturedDate)
              : (img.capturedDate ?? 0);
          return date > latest.date ? { id: img.imageId || '', date } : latest;
        },
        { id: '', date: 0 },
      ).id || ''
    );
  }

  isLoadingDate(date: string): boolean {
    return this.pageState.get(this.buildRequestKey(date))?.loading ?? false;
  }

  hasMoreForDate(date: string): boolean {
    const state = this.pageState.get(this.buildRequestKey(date));
    return state ? state.hasMore : false;
  }

  private loadPolesForDate(date: string, forceRefresh = false) {
    const requestKey = this.buildRequestKey(date);
    if (!forceRefresh && this.loadedPolesByRequest.has(requestKey)) {
      const cached = this.loadedPolesByRequest.get(requestKey) || [];
      this.polesData = cached;
      this.filteredData = cached;
      return;
    }
    if (forceRefresh) {
      this.loadedPolesByRequest.delete(requestKey);
      this.pageState.delete(requestKey);
    }
    this.loadPageForDate(date, 0);
  }

  private loadPageForDate(date: string, page: number) {
    const requestKey = this.buildRequestKey(date);
    const state = this.pageState.get(requestKey);

    if (state?.loading) return;
    if (page > 0 && state && !state.hasMore) return;

    this.pageState.set(requestKey, {
      page,
      hasMore: true,
      loading: true,
      totalElements: state?.totalElements ?? 0,
    });

    if (page === 0 && this.openDate === date) {
      this.polesData = [];
      this.filteredData = [];
    }

    this.polesService
      .getPolesByDate(
        date,
        this.selectedCounties,
        this.selectedMunicipalities,
        page,
        10,
      )
      .subscribe({
        next: (data) => {
          const computed = data.content.map((pole) =>
            this.withComputedDate(pole),
          );
          const existing =
            page === 0 ? [] : this.loadedPolesByRequest.get(requestKey) || [];
          const merged = [...existing, ...computed];
          this.loadedPolesByRequest.set(requestKey, merged);
          this.pageState.set(requestKey, {
            page,
            hasMore: data.hasMore,
            loading: false,
            totalElements: data.totalElements,
          });
          if (this.openDate === date) {
            this.polesData = merged;
            this.filteredData = merged;
          }
        },
        error: () => {
          const prev = this.pageState.get(requestKey);
          this.pageState.set(requestKey, {
            page: Math.max(0, (prev?.page ?? 1) - 1),
            hasMore: false,
            loading: false,
            totalElements: prev?.totalElements ?? 0,
          });
        },
      });
  }

  private buildRequestKey(date: string): string {
    const sortedCounties = [...this.selectedCounties].sort();
    const sortedMunicipalities = [...this.selectedMunicipalities].sort();
    const sortedStatuses = [...this.selectedStatuses].sort();

    return [
      date,
      sortedCounties.join(','),
      sortedMunicipalities.join(','),
      sortedStatuses.join(','),
    ].join('::');
  }

  private withComputedDate(pole: PoleInterface): PoleWithComputed {
    const millis = this.toEpochMillis(pole.capturedDate);
    return {
      ...pole,
      _dateObj: new Date(millis),
      _dateStr: new Date(millis).toISOString().slice(0, 10),
    };
  }

  private getMunicipalitiesForCounties(counties: string[]): string[] {
    if (!this.summaryData || !counties.length) {
      return this.summaryData?.availableMunicipalities ?? [];
    }

    return this.summaryData.countyData
      .filter((entry) => counties.includes(entry.county))
      .flatMap((entry) => entry.municipalities)
      .filter(
        (municipality, index, all) =>
          municipality && all.indexOf(municipality) === index,
      )
      .sort();
  }

  private toEpochMillis(value?: string | number): number {
    if (value === undefined || value === null) {
      return 0;
    }

    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return numeric < 100000000000 ? numeric * 1000 : numeric;
  }

  private toIsoDate(value: number): string {
    return new Date(this.toEpochMillis(value)).toISOString().slice(0, 10);
  }

  private normalizeStoredDate(value: string | null): string | null {
    if (!value) {
      return null;
    }

    if (value.includes('-')) {
      return value;
    }

    if (value.includes('.')) {
      const parts = value.split('.').map(Number);
      if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
        const [day, month, year] = parts;
        return new Date(Date.UTC(year, month - 1, day))
          .toISOString()
          .slice(0, 10);
      }
    }

    return value;
  }
}
