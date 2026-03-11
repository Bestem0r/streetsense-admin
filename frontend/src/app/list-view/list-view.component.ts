import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule, MatAccordion } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PolesInterface } from '../interfaces/poles-interface';
import { PolesService } from '../service/poles.service';
import { MapViewComponent } from '../map-view/map-view.component';
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
  ],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss',
})
export class ListViewComponent implements OnInit {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  polesData: PolesInterface[] = [];
  groupedData = new Map<string, PolesInterface[]>();
  openDate: string | null = null;
  private polesService = inject(PolesService);
  private router = inject(Router);

  ngOnInit() {
    this.polesService.getPoles().subscribe((data) => {
      this.polesData = data;
      this.groupByDate();
      console.log('Fetched poles data:', this.polesData);
    });
  }

  toggleAccordion(date: string) {
    this.openDate = this.openDate === date ? null : date;
  }

  groupByDate() {
    this.groupedData.clear();

    this.polesData.forEach((pole) => {
      if (pole.capturedDate) {
        const date = new Date(pole.capturedDate).toISOString().split('T')[0];

        if (!this.groupedData.has(date)) {
          this.groupedData.set(date, []);
        }

        this.groupedData.get(date)?.push(pole);
      }
    });
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
    return this.sortedDates.slice(0, 4);
  }
  get remainingDates(): number {
    return Math.max(this.sortedDates.length - 3, 0);
  }
  get totalUniquePoles(): number {
    return new Set(this.polesData.map((pole) => pole.id)).size;
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
  navigateTo(date: string, pole: PolesInterface) {
    const coordinates = pole.location?.coordinates;

    if (!coordinates) return;

    const lat = coordinates[1];
    const lng = coordinates[0];

    const poleData = {
      id: pole.id,
      lat: lat,
      lng: lng,
    };

    localStorage.setItem('poleData', JSON.stringify(poleData));

    const formattedDate = new Date(date).getTime();

    this.router.navigate([`image/${formattedDate}/${pole.id}`]);
  }
}
