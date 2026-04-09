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

  polesData: PoleInterface[] = [];
  filteredData = this.polesData;
  groupedData = new Map<string, PoleInterface[]>();
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
      this.polesData = data;
      this.groupByDate(this.selectedDate);
    });
  }

  toggleAccordion(date: string) {
    this.openDate = this.openDate === date ? null : date;
    sessionStorage.setItem('openDate', date || '');
  }

  groupByDate(date: string | null = null) {
    this.groupedData.clear();

    if (date === 'ALL' || date === null) {
      sessionStorage.removeItem('openDate');
      this.selectedDate = null;
      this.focusedPole = null;
      sessionStorage.removeItem('selectedDate');
      this.polesData.forEach((pole) => {
        if (pole.capturedDate) {
          const date = new Date(pole.capturedDate)
            .toLocaleDateString()
            .split('T')[0];

          if (!this.groupedData.has(date)) {
            this.groupedData.set(date, []);
          }

          this.groupedData.get(date)?.push(pole);
        }
      });
      this.filteredData = this.polesData;
    } else {
      this.selectedDate = date;
      sessionStorage.setItem('selectedDate', date);
      this.focusedPole = null;
      this.polesData.forEach((pole) => {
        if (pole.capturedDate) {
          const poleDate = new Date(pole.capturedDate)
            .toLocaleDateString()
            .split('T')[0];
          if (poleDate === date) {
            if (!this.groupedData.has(date)) {
              this.groupedData.set(date, []);
            }
            this.groupedData.get(date)?.push(pole);
          }
        }
      });
      this.filteredData = this.groupedData.get(date) || [];
      this.openDate = date;
      sessionStorage.setItem('openDate', date);
    }
  }

  get sortedDates(): string[] {
    return Array.from(this.groupedData.keys()).sort((a, b) =>
      b.localeCompare(a),
    );
  }

  getPolesByDate(date: string): PoleInterface[] {
    return this.groupedData.get(date) || [];
  }

  get visibleDates(): string[] {
    const dates = this.polesData
      .filter((p) => p.capturedDate)
      .map((p) =>
        p.capturedDate
          ? new Date(p.capturedDate).toLocaleDateString().split('T')[0]
          : '',
      );

    const uniqueDates = [...new Set(dates)];

    uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return uniqueDates.slice(0, 4);
  }
  get remainingDates(): number {
    return Math.max(this.sortedDates.length - 3, 0);
  }
  get totalVisiblePoles(): number {
    return this.filteredData.length;
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
    const dayIndex = new Date(date).getDay();
    return days[dayIndex];
  }

  navigateTo(pole: PoleInterface) {
    const coordinates = pole.location?.coordinates;

    if (!coordinates) return;
    this.router.navigate([`pole-details/${pole.id}`]);
  }

  showMoreDates() {
    this.openDate = 'ALL';
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
      // also add to session storage
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
    if (!pole.images || pole.images.length === 0) return '';

    let latestImageId = '';
    let latestDate = 0;

    pole.images.forEach((image) => {
      const captureDate =
        typeof image.capturedDate === 'string'
          ? parseInt(image.capturedDate)
          : (image.capturedDate ?? 0);

      if (captureDate > latestDate) {
        latestDate = captureDate;
        latestImageId = image.imageId || '';
      }
    });

    return latestImageId;
  }
}
