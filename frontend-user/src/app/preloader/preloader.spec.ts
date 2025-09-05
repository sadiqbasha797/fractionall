import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreloaderComponent } from './preloader';

describe('PreloaderComponent', () => {
  let component: PreloaderComponent;
  let fixture: ComponentFixture<PreloaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreloaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreloaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show preloader when showPreloader is true', () => {
    component.showPreloader = true;
    fixture.detectChanges();
    
    const preloaderElement = fixture.nativeElement.querySelector('.preloader-overlay');
    expect(preloaderElement).toBeTruthy();
  });

  it('should hide preloader when showPreloader is false', () => {
    component.showPreloader = false;
    fixture.detectChanges();
    
    const preloaderElement = fixture.nativeElement.querySelector('.preloader-overlay');
    expect(preloaderElement).toBeFalsy();
  });

  it('should display preloader gif', () => {
    component.showPreloader = true;
    fixture.detectChanges();
    
    const gifElement = fixture.nativeElement.querySelector('.preloader-gif');
    expect(gifElement).toBeTruthy();
    expect(gifElement.src).toContain('preloader.gif');
  });

  it('should display loading text', () => {
    component.showPreloader = true;
    fixture.detectChanges();
    
    const textElement = fixture.nativeElement.querySelector('.preloader-text');
    expect(textElement).toBeTruthy();
    expect(textElement.textContent).toContain('Loading...');
  });
});
