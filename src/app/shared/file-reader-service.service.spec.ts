import { TestBed } from '@angular/core/testing';

import { FileReaderServiceService } from './file-reader-service.service';

describe('FileReaderServiceService', () => {
  let service: FileReaderServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileReaderServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
