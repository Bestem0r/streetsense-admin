import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
  filteredData = this.polesData;
  allDates: string[] = [];
  showAllDates = false;
  groupedData = new Map<string, PoleWithComputed[]>();
  cachedSortedDates: string[] = [];
  openDate: string | null = sessionStorage.getItem('openDate');
  focusedPole: string | null = null;
  selectedDate: string | null = sessionStorage.getItem('selectedDate');
  isFilterOpen = false;
  selectedFilters: string[] = JSON.parse(
    sessionStorage.getItem('selectedFilters') || '[]',
  );
  filterOptions = [
    { label: 'Inspected', value: 'inspected' },
    { label: 'Not Inspected', value: 'not_inspected' },
    { label: 'Area 1', value: 'area_1' },
    { label: 'Area 2', value: 'area_2' },
    { label: 'Area 3', value: 'area_3' },
  ];
  private polesService = inject(PolesService);
  private router = inject(Router);

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
    const dateMap = new Map<string, PoleWithComputed[]>();

    this.polesData.forEach((pole) => {
      if (!pole._dateStr) return;

      if (!dateMap.has(pole._dateStr)) {
        dateMap.set(pole._dateStr, []);
      }

      dateMap.get(pole._dateStr)!.push(pole);
    });

    this.groupedData = dateMap;

    this.allDates = Array.from(dateMap.keys()).sort(
      (a, b) => this.parseDate(b) - this.parseDate(a),
    );

    this.cachedSortedDates = this.allDates;
    this.filteredData = this.polesData;
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
      this.filteredData = this.polesData;
      this.selectedDate = null;
      this.openDate = null;
      return;
    }

    this.selectedDate = date;
    this.filteredData = this.groupedData.get(date) || [];
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
    return isNaN(d.getTime()) ? 'Invalid Date' : days[d.getDay()];
  }
  extractAndSortDates(data: PoleInterface[]): string[] {
    const dates = data
      .filter(
        (p): p is PoleInterface & { capturedDate: string } => !!p.capturedDate,
      )
      .map((p) => {
        const d = new Date(p.capturedDate);
        return d.toLocaleDateString('no-NO');
      });

    const unique = [...new Set(dates)];

    const parse = (d: string) => {
      const [day, month, year] = d.split('.').map(Number);
      return new Date(year, month - 1, day).getTime();
    };

    return unique.sort((a, b) => parse(b) - parse(a));
  }
  navigateTo(pole: PoleInterface) {
    const coordinates = pole.location?.coordinates;

    if (!coordinates) return;
    this.router.navigate([`pole-details/${pole.id}`]);
  }

  setFocusedPole(id: string) {
    this.focusedPole = this.focusedPole === id ? null : id;
    sessionStorage.setItem('focusedPole', this.focusedPole || '');
  }

  toggleFilters() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  toggleFilterOption(value: string) {
    const index = this.selectedFilters.indexOf(value);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);

      sessionStorage.setItem(
        'selectedFilters',
        JSON.stringify(this.selectedFilters),
      );
    } else {
      this.selectedFilters.push(value);
      sessionStorage.setItem(
        'selectedFilters',
        JSON.stringify(this.selectedFilters),
      );
    }
  }

  applyFilters() {
    this.isFilterOpen = false;
  }

  resetFilters() {
    this.selectedFilters = [];
    sessionStorage.removeItem('selectedFilters');
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
