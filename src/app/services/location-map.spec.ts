import { TestBed } from '@angular/core/testing';

import { LocationMap } from './location-map';

describe('LocationMap', () => {
  let service: LocationMap;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationMap);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
