import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

import { PoleInterface } from '../interfaces/pole-interface';
import { MapViewComponent } from '../map-view/map-view.component';
import { NavComponent } from '../navbar/nav.component';
import { PolesService } from '../service/poles.service';

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
    MatExpansionModule,
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
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  polesData: PoleWithComputed[] = [];
  filteredData: PoleWithComputed[] = [];
  allDates: string[] = [];
  showAllDates = false;
  groupedData = new Map<string, PoleWithComputed[]>();
  cachedSortedDates: string[] = [];
  openDate: string | null = sessionStorage.getItem('openDate');
  focusedPole: string | null = null;
  selectedDate: string | null = sessionStorage.getItem('selectedDate');
  isFilterOpen = false;

  // Filter state
  selectedCounties: string[] = [];
  selectedMunicipalities: string[] = [];
  selectedStatuses: string[] = [];
  countySearch = '';
  municipalitySearch = '';

  private polesService = inject(PolesService);
  private router = inject(Router);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isFilterOpen && !target.closest('[data-filter-panel]')) {
      this.isFilterOpen = false;
    }
  }

  ngOnInit() {
    this.polesService.getPoles().subscribe((data) => {
      this.polesData = data.map((p) => ({
        ...p,
        _dateObj: new Date(p.capturedDate!),
        _dateStr: new Date(p.capturedDate!).toLocaleDateString('no-NO'),
      }));
      this.initializeData();
    });
  }

  initializeData() {
    this.filteredData = this.polesData;
    this.rebuildGroupedData(this.polesData);
  }

  private rebuildGroupedData(data: PoleWithComputed[]) {
    const dateMap = new Map<string, PoleWithComputed[]>();
    data.forEach((pole) => {
      if (!pole._dateStr) return;
      if (!dateMap.has(pole._dateStr)) dateMap.set(pole._dateStr, []);
      dateMap.get(pole._dateStr)!.push(pole);
    });
    this.groupedData = dateMap;
    this.allDates = Array.from(dateMap.keys()).sort(
      (a, b) => this.parseDate(b) - this.parseDate(a),
    );
    this.cachedSortedDates = this.allDates;
    if (this.selectedDate && !this.allDates.includes(this.selectedDate)) {
      this.selectedDate = null;
      this.openDate = null;
    }
  }

  /**
   * Extracts unique counties from the pole data
   *
   */
  get availableCounties(): string[] {
    const counties = new Set(
      this.polesData.map((p) => p.county).filter(Boolean) as string[],
    );
    return [...counties].sort();
  }

  /**
   * Extracts unique municipalities from the pole data, if counties are selected, only returns municipalities within those counties.
   *
   */
  get availableMunicipalities(): string[] {
    const source = this.selectedCounties.length
      ? this.polesData.filter((p) => this.selectedCounties.includes(p.county!))
      : this.polesData;
    const munis = new Set(
      source.map((p) => p.municipality).filter(Boolean) as string[],
    );
    return [...munis].sort();
  }

  get filteredCountyOptions(): string[] {
    const q = this.countySearch.toLowerCase();
    return this.availableCounties.filter((c) => c.toLowerCase().includes(q));
  }

  get filteredMunicipalityOptions(): string[] {
    const q = this.municipalitySearch.toLowerCase();
    return this.availableMunicipalities.filter((m) =>
      m.toLowerCase().includes(q),
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

  parseDate(date: string): number {
    const [day, month, year] = date.split('.').map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  toggleAccordion(date: string) {
    this.openDate = this.openDate === date ? null : date;
    sessionStorage.setItem('openDate', date || '');
  }

  groupByDate(date: string | null = null) {
    if (!date) {
      this.selectedDate = null;
      this.openDate = null;
      return;
    }
    this.selectedDate = date;
    this.openDate = date;
  }

  get sortedDates(): string[] {
    return this.cachedSortedDates;
  }

  getPolesByDate(date: string): PoleWithComputed[] {
    return this.groupedData.get(date) || [];
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
    const d = new Date(this.parseDate(date));
    return isNaN(d.getTime()) ? '' : days[d.getDay()];
  }

  navigateTo(pole: PoleInterface) {
    if (!pole.location?.coordinates) return;
    this.router.navigate([`pole-details/${pole.id}`]);
  }

  setFocusedPole(id: string) {
    this.focusedPole = this.focusedPole === id ? null : id;
    sessionStorage.setItem('focusedPole', this.focusedPole || '');
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
          this.polesData
            .filter((p) => this.selectedCounties.includes(p.county!))
            .map((p) => p.municipality),
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
    let result = this.polesData;

    if (this.selectedCounties.length) {
      result = result.filter((p) => this.selectedCounties.includes(p.county!));
    }
    if (this.selectedMunicipalities.length) {
      result = result.filter((p) =>
        this.selectedMunicipalities.includes(p.municipality!),
      );
    }
    if (this.selectedStatuses.length) {
      result = result.filter((p) => {
        const status = p.images?.[0]?.inspectionStatus?.toLowerCase();
        return this.selectedStatuses.some((s) => {
          if (s === 'inspected') return status === 'inspected';
          if (s === 'not_inspected')
            return !status || status === 'not inspected';
          return false;
        });
      });
    }

    this.filteredData = result;
    this.rebuildGroupedData(result);
  }

  resetFilters() {
    this.selectedCounties = [];
    this.selectedMunicipalities = [];
    this.selectedStatuses = [];
    this.countySearch = '';
    this.municipalitySearch = '';
    this.filteredData = this.polesData;
    this.rebuildGroupedData(this.polesData);
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
}
