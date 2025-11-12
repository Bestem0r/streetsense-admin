import { Component, OnInit } from '@angular/core';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core'; // useful for typechecking
import dayGridPlugin from '@fullcalendar/daygrid';
import { PolesService } from '../service/poles.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calender',
  imports: [FullCalendarModule],
  templateUrl: './calender.component.html',
  styleUrl: './calender.component.scss'
})
export class CalenderComponent {

  polesEvents: any[] = [];

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin],
    events: [],
    eventClick: this.handlePoleEventClick.bind(this)
  };

  constructor(private polesService: PolesService, private router: Router) {

  }

  ngOnInit() {
    this.getCapturedDates();
  }

  getCapturedDates = async () => {
    const data: any = await this.polesService.getCapturedDates().toPromise();
    if (data && data.capturedDates && data.capturedDates.length > 0) {
      data.capturedDates.forEach((cdate: any) => {
        const event = { title: 'poles inspection', date: cdate, id: Date.parse(cdate) }
        this.polesEvents.push(event);
      });

      this.calendarOptions.events = [...this.polesEvents];
    }
  }


  async handlePoleEventClick(evt: any) {
    const eventTimestamp = evt.event._def.publicId
    this.router.navigate(['/map', eventTimestamp]);
  }
}
