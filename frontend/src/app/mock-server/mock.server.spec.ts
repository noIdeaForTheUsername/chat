import { TestBed } from '@angular/core/testing';

import { MockServer } from './mock.server';

describe('MockServer', () => {
  let service: MockServer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockServer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
