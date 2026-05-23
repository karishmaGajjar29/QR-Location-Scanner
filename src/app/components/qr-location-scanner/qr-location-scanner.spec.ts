import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrLocationScanner } from './qr-location-scanner';

describe('QrLocationScanner', () => {
  let component: QrLocationScanner;
  let fixture: ComponentFixture<QrLocationScanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrLocationScanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrLocationScanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
