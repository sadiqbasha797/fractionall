import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Revenvue } from './revenvue';

describe('Revenvue', () => {
  let component: Revenvue;
  let fixture: ComponentFixture<Revenvue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Revenvue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Revenvue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
