import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Amc } from './amc';

describe('Amc', () => {
  let component: Amc;
  let fixture: ComponentFixture<Amc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Amc]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Amc);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
