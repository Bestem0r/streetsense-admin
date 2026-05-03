import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core'; // useful for typechecking
import dayGridPlugin from '@fullcalendar/daygrid';
import { lastValueFrom } from 'rxjs';
import { NavComponent } from '../navbar/nav.component';
import { PolesService } from '../service/poles.service';
import { PlanCaptureService } from '../service/plan-capture.service';
import { normalizeDate } from '../utils/dateNormalizer';

@Component({
  selector: 'app-calender',
  imports: [FullCalendarModule, MatIconModule, NavComponent],
  templateUrl: './calender.component.html',
  styleUrl: './calender.component.scss',
})
export class CalenderComponent implements OnInit {
  polesEvents: any[] = [];
  allEvents: any[] = [];

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin],
    events: [],
    eventClick: this.handlePoleEventClick.bind(this),
  };

  private polesService = inject(PolesService);
  private planCaptureService = inject(PlanCaptureService);
  private router = inject(Router);

  ngOnInit() {
    this.getCapturedDates();
    this.getPlannedCaptures();
  }

  getCapturedDates = async () => {
    const data: any = await lastValueFrom(this.polesService.getCapturedDates());
    if (data?.capturedDates?.length) {
      this.polesEvents = data.capturedDates
        .map((raw: string) => {
          const normalized = normalizeDate(raw);
          if (!normalized) return null;

          return {
            title: 'poles inspection',
            date: normalized,
            id: Date.parse(normalized),
            display: 'list-item',
            color: '#22c55e',
          };
        })
        .filter(Boolean);

      this.allEvents = [...this.allEvents, ...this.polesEvents];
      this.calendarOptions.events = [...this.allEvents];
    }
  };

  async getPlannedCaptures() {
    const captures = await lastValueFrom(this.planCaptureService.getCaptures());

    const plannedEvents = captures.map((capture) => {
      const start = new Date(capture.startDate);
      const end = new Date(capture.endDate);
      end.setDate(end.getDate() + 1);

      return {
        title: `Deadline: ${end.toLocaleDateString('no-NO')}`,
        start,
        id: capture.id,
        display: 'block',
        allDay: true,
        color: this.getColorFromId(capture.id),
      };
    });

    this.allEvents = [...this.allEvents, ...plannedEvents];
    this.calendarOptions.events = [...this.allEvents];
  }

  async handlePoleEventClick(evt: any) {
    const eventTimestamp = evt.event._def.publicId;
    this.router.navigate(['/map', eventTimestamp]);
  }

  // midlertidig funksjon til jeg har en bedre løsning.
  getColorFromId(id: string) {
    const colors = [
      '#3b82f6',
      '#22c55e',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#14b8a6',
    ];

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
