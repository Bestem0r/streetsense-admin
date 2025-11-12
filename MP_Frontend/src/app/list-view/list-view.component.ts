import { Component } from '@angular/core';
import { PersonService } from '../service/person.service';

@Component({
  selector: 'app-list-view',
  imports: [],
  providers: [PersonService],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss'
})
export class ListViewComponent {
  persons: any;

  constructor(private personService: PersonService) { }

  ngOnInit() {
    this.getPersons();
  }

  getPersons() {
    this.persons = this.personService.getPerson();

  }
}
