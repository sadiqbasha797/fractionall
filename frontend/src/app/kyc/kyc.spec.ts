import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Kyc } from './kyc';

describe('Kyc', () => {
  let component: Kyc;
  let fixture: ComponentFixture<Kyc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kyc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Kyc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
