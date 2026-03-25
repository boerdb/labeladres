import { TestBed } from '@angular/core/testing';

import { Personen } from './personen';

describe('Personen', () => {
  let service: Personen;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Personen);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
