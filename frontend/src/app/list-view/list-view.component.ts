import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatExpansionModule, MatAccordion } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PolesInterface } from '../interfaces/poles-interface';
import { PolesService } from '../service/poles.service';
import { MapViewComponent } from '../map-view/map-view.component';
import { NavComponent } from '../navbar/nav.component';
import { Router } from '@angular/router';

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
  ],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss',
})
export class ListViewComponent implements OnInit {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  polesData: PolesInterface[] = [];
  filteredData = this.polesData;
  groupedData = new Map<string, PolesInterface[]>();
  openDate: string | null = null;
  focusedPole: string | null = null;
  selectedDate: string | null = null;
  isFilterOpen = false;
  selectedFilters: string[] = [];
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
      this.groupByDate();
    });
  }

  toggleAccordion(date: string) {
    this.openDate = this.openDate === date ? null : date;
    this.selectedDate = date;
  }

  groupByDate(date: string | null = null) {
    this.groupedData.clear();

    if (date === 'ALL' || date === null) {
      this.openDate = null;
      this.selectedDate = null;
      this.polesData.forEach((pole) => {
        if (pole.capturedDate) {
          const date = new Date(pole.capturedDate).toISOString().split('T')[0];

          if (!this.groupedData.has(date)) {
            this.groupedData.set(date, []);
          }

          this.groupedData.get(date)?.push(pole);
        }
      });
      this.filteredData = this.polesData;
    } else {
      this.selectedDate = date;
      this.polesData.forEach((pole) => {
        if (pole.capturedDate) {
          const poleDate = new Date(pole.capturedDate)
            .toISOString()
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
    }
  }

  get sortedDates(): string[] {
    return Array.from(this.groupedData.keys()).sort((a, b) =>
      b.localeCompare(a),
    );
  }

  getPolesByDate(date: string): PolesInterface[] {
    return this.groupedData.get(date) || [];
  }

  get visibleDates(): string[] {
    const dates = this.polesData
      .filter((p) => p.capturedDate)
      .map((p) =>
        p.capturedDate
          ? new Date(p.capturedDate).toISOString().split('T')[0]
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

  expandAll() {
    this.openDate = 'ALL';
  }

  collapseAll() {
    this.openDate = null;
  }
  navigateTo(pole: PolesInterface) {
    const coordinates = pole.location?.coordinates;

    if (!coordinates) return;
    this.router.navigate([`pole-details/${pole.id}`]);
  }

  showMoreDates() {
    this.openDate = 'ALL';
  }

  setFocusedPole(id: string) {
    this.focusedPole = this.focusedPole === id ? null : id;
  }

  toggleFilters() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  toggleFilterOption(value: string) {
    const index = this.selectedFilters.indexOf(value);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);
    } else {
      this.selectedFilters.push(value);
    }
  }

  /* applyFilters() {
    this.filterData();
  }

  */
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
