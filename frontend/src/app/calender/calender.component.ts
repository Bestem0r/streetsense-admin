import { Component, inject, OnInit } from '@angular/core';
import { NgClass, UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { NavComponent } from '../navbar/nav.component';
import { PolesService } from '../service/poles.service';
import { PlanCaptureService } from '../service/plan-capture.service';
import { CaptureInterface } from '../interfaces/Capture-interface';
import { PoleSummaryResponse } from '../interfaces/pole-summary-response';

interface CaptureMarker {
  num: number;
  type: 'start' | 'end';
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasInspection: boolean;
  captureMarkers: CaptureMarker[];
  isSelected: boolean;
}

interface TimelineItem {
  type: 'inspection' | 'capture';
  subtitle: string;
  color: string;
  timestamp: number;
  poleCount: number;
  captureNum?: number;
  captureRelation?: 'starts' | 'ends' | 'starts & ends';
}

@Component({
  selector: 'app-calender',
  standalone: true,
  imports: [NavComponent, NgClass, UpperCasePipe],
  templateUrl: './calender.component.html',
  styleUrl: './calender.component.scss',
})
export class CalenderComponent implements OnInit {
  inspectionDates = new Set<string>();
  inspectionTimestamps = new Map<string, number>();
  inspectionCounts = new Map<string, number>();
  captures: CaptureInterface[] = [];

  selectedDate: Date | null = null;
  currentMonth = new Date();
  calendarDays: CalendarDay[] = [];
  timelineItems: TimelineItem[] = [];

  loadError = '';

  readonly CAPTURE_COLOR = '#3b82f6';
  readonly weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  private polesService = inject(PolesService);
  private planCaptureService = inject(PlanCaptureService);
  private router = inject(Router);

  async ngOnInit() {
    await Promise.all([this.loadInspections(), this.loadCaptures()]);
    this.buildCalendar();
    this.buildTimeline();
  }

  private async loadInspections() {
    try {
      const data: PoleSummaryResponse = await lastValueFrom(this.polesService.getSummary());
      for (const entry of data.dates ?? []) {
        const dateStr = this.toDateStr(new Date(entry.capturedDate));
        this.inspectionDates.add(dateStr);
        this.inspectionTimestamps.set(dateStr, entry.capturedDate);
        this.inspectionCounts.set(dateStr, entry.count);
      }
    } catch {
      this.loadError = 'Failed to load inspection data.';
    }
  }

  private async loadCaptures() {
    try {
      const data = await lastValueFrom(this.planCaptureService.getCaptures());
      this.captures = data.sort((a, b) => a.startDate - b.startDate);
    } catch {
      this.loadError = this.loadError
        ? 'Failed to load calendar data.'
        : 'Failed to load capture data.';
    }
  }

  buildCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const todayStr = this.toDateStr(new Date());
    const markersMap = this.buildCaptureMarkersMap();
    const days: CalendarDay[] = [];

    for (let i = startDow - 1; i >= 0; i--) {
      days.push(this.makeDay(new Date(year, month, -i), false, todayStr, markersMap));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(this.makeDay(new Date(year, month, d), true, todayStr, markersMap));
    }
    for (let d = 1; days.length < 42; d++) {
      days.push(this.makeDay(new Date(year, month + 1, d), false, todayStr, markersMap));
    }

    this.calendarDays = days;
  }

  private buildCaptureMarkersMap(): Map<string, CaptureMarker[]> {
    const map = new Map<string, CaptureMarker[]>();
    this.captures.forEach((c, idx) => {
      const start = this.toDateStr(new Date(c.startDate));
      const end = this.toDateStr(new Date(c.endDate));
      if (!map.has(start)) map.set(start, []);
      map.get(start)!.push({ num: idx + 1, type: 'start' });
      if (end !== start) {
        if (!map.has(end)) map.set(end, []);
        map.get(end)!.push({ num: idx + 1, type: 'end' });
      }
    });
    return map;
  }

  private makeDay(date: Date, isCurrentMonth: boolean, todayStr: string, markersMap: Map<string, CaptureMarker[]>): CalendarDay {
    const dateStr = this.toDateStr(date);
    return {
      date,
      dateStr,
      isCurrentMonth,
      isToday: dateStr === todayStr,
      hasInspection: this.inspectionDates.has(dateStr),
      captureMarkers: markersMap.get(dateStr) ?? [],
      isSelected: this.selectedDate ? this.toDateStr(this.selectedDate) === dateStr : false,
    };
  }

  selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth) return;
    const same = this.selectedDate && this.toDateStr(this.selectedDate) === day.dateStr;
    this.selectedDate = same ? null : day.date;
    this.buildCalendar();
    this.buildTimeline();
  }

  clearSelection() {
    this.selectedDate = null;
    this.buildCalendar();
    this.buildTimeline();
  }

  buildTimeline() {
    const items: TimelineItem[] = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    if (this.selectedDate) {
      const dateStr = this.toDateStr(this.selectedDate);

      if (this.inspectionDates.has(dateStr)) {
        items.push({
          type: 'inspection',
          subtitle: this.fmtDate(this.selectedDate),
          color: '#16a34a',
          timestamp: this.inspectionTimestamps.get(dateStr)!,
          poleCount: this.inspectionCounts.get(dateStr) ?? 0,
        });
      }

      this.captures.forEach((c, idx) => {
        const start = this.toDateStr(new Date(c.startDate));
        const end = this.toDateStr(new Date(c.endDate));
        if (dateStr >= start && dateStr <= end) {
          const isStart = dateStr === start;
          const isEnd = dateStr === end;
          let captureRelation: TimelineItem['captureRelation'];
          if (isStart && isEnd) captureRelation = 'starts & ends';
          else if (isStart) captureRelation = 'starts';
          else if (isEnd) captureRelation = 'ends';

          items.push({
            type: 'capture',
            subtitle: `${this.fmtDate(new Date(c.startDate))} — ${this.fmtDate(new Date(c.endDate))}`,
            color: this.CAPTURE_COLOR,
            timestamp: c.startDate,
            poleCount: c.poles?.length ?? 0,
            captureNum: idx + 1,
            captureRelation,
          });
        }
      });
    } else {
      const mStart = this.toDateStr(new Date(year, month, 1));
      const mEnd = this.toDateStr(new Date(year, month + 1, 0));

      for (const [dateStr, ts] of this.inspectionTimestamps) {
        if (dateStr >= mStart && dateStr <= mEnd) {
          items.push({
            type: 'inspection',
            subtitle: dateStr,
            color: '#16a34a',
            timestamp: ts,
            poleCount: this.inspectionCounts.get(dateStr) ?? 0,
          });
        }
      }

      this.captures.forEach((c, idx) => {
        const start = this.toDateStr(new Date(c.startDate));
        const end = this.toDateStr(new Date(c.endDate));
        if (end >= mStart && start <= mEnd) {
          items.push({
            type: 'capture',
            subtitle: `${this.fmtDate(new Date(c.startDate))} — ${this.fmtDate(new Date(c.endDate))}`,
            color: this.CAPTURE_COLOR,
            timestamp: c.startDate,
            poleCount: c.poles?.length ?? 0,
            captureNum: idx + 1,
          });
        }
      });

      items.sort((a, b) => a.timestamp - b.timestamp);
    }

    this.timelineItems = items;
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.selectedDate = null;
    this.buildCalendar();
    this.buildTimeline();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.selectedDate = null;
    this.buildCalendar();
    this.buildTimeline();
  }

  handleItemClick(item: TimelineItem) {
    if (item.type === 'inspection') {
      this.router.navigate(['/map', item.timestamp]);
    }
  }

  getMonthLabel(): string {
    return this.currentMonth
      .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      .toUpperCase();
  }

  getSelectedLabel(): string {
    if (!this.selectedDate) return this.getMonthLabel();
    return this.selectedDate
      .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
  }

  countByType(type: 'inspection' | 'capture'): number {
    return this.timelineItems.filter((i) => i.type === type).length;
  }

  fmtDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
