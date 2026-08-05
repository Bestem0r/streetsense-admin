import { TestBed } from '@angular/core/testing';
import { PersonService } from './person.service';

describe('PersonService', () => {
  let service: PersonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  describe('getPerson()', () => {
    it('returns an object with name and age', () => {
      const person = service.getPerson();
      expect(person).toHaveProperty('name');
      expect(person).toHaveProperty('age');
    });

    it('returns John Doe with age 30', () => {
      const person = service.getPerson();
      expect(person.name).toBe('John Doe');
      expect(person.age).toBe(30);
    });

    it('returns the same value on repeated calls', () => {
      expect(service.getPerson()).toEqual(service.getPerson());
    });
  });
});
