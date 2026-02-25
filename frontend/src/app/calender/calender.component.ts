import { Component, OnInit } from '@angular/core';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core'; // useful for typechecking
import dayGridPlugin from '@fullcalendar/daygrid';
import { PolesService } from '../service/poles.service';
import { normalizeDate } from '../utils/dateNormalizer';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-calender',
  imports: [FullCalendarModule],
  templateUrl: './calender.component.html',
  styleUrl: './calender.component.scss',
})
export class CalenderComponent {
  polesEvents: any[] = [];

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin],
    events: [],
    eventClick: this.handlePoleEventClick.bind(this),
  };

  constructor(
    private polesService: PolesService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.getCapturedDates();
  }

  getCapturedDates = async () => {
    const data: any = await lastValueFrom(this.polesService.getCapturedDates());
    if (data?.capturedDates?.length) {
      this.polesEvents = data.capturedDates
        .map((raw: string) => {
          const normalized = normalizeDate(raw);
          console.log(`Raw: ${raw} => Normalized: ${normalized}`);
          if (!normalized) return null;

          return {
            title: 'poles inspection',
            date: normalized,
            id: Date.parse(normalized),
          };
        })
        .filter(Boolean);

      this.calendarOptions.events = [...this.polesEvents];
    }
  };
  async handlePoleEventClick(evt: any) {
    const eventTimestamp = evt.event._def.publicId;
    console.log('Event clicked with timestamp:', eventTimestamp);
    this.router.navigate(['/map', eventTimestamp]);
  }
}
