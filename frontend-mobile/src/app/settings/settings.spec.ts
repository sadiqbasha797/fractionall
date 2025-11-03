import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { SettingsComponent } from './settings';
import { UserService } from '../services/user.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let userService: jasmine.SpyObj<UserService>;

  const mockPreferences = {
    enabled: true,
    tokenPurchase: true,
    bookNowToken: true,
    amcPayment: true,
    booking: true,
    kyc: true,
    refund: true,
    sharedMember: true
  };

  const mockResponse = {
    status: 'success',
    body: {
      emailNotifications: mockPreferences
    },
    message: 'Email notification preferences retrieved successfully'
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getEmailNotificationPreferences',
      'updateEmailNotificationPreferences'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load preferences on init', () => {
    userService.getEmailNotificationPreferences.and.returnValue(of(mockResponse));
    
    component.ngOnInit();
    
    expect(userService.getEmailNotificationPreferences).toHaveBeenCalled();
    expect(component.preferences).toEqual(mockPreferences);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading preferences', () => {
    userService.getEmailNotificationPreferences.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    
    component.ngOnInit();
    
    expect(component.loading).toBeFalse();
    expect(component.message).toContain('Failed to load preferences');
    expect(component.messageType).toBe('error');
  });

  it('should save preferences successfully', () => {
    userService.updateEmailNotificationPreferences.and.returnValue(of(mockResponse));
    
    component.savePreferences();
    
    expect(userService.updateEmailNotificationPreferences).toHaveBeenCalledWith(component.preferences);
    expect(component.saving).toBeFalse();
    expect(component.message).toContain('successfully');
    expect(component.messageType).toBe('success');
  });

  it('should handle error when saving preferences', () => {
    userService.updateEmailNotificationPreferences.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    
    component.savePreferences();
    
    expect(component.saving).toBeFalse();
    expect(component.message).toContain('Failed to save preferences');
    expect(component.messageType).toBe('error');
  });

  it('should have correct notification types', () => {
    expect(component.notificationTypes.length).toBe(7);
    expect(component.notificationTypes[0].key).toBe('tokenPurchase');
    expect(component.notificationTypes[0].label).toContain('Token Purchase');
  });

  it('should clear message after timeout', (done) => {
    component.message = 'Test message';
    component['showMessage']('New message', 'success');
    
    expect(component.message).toBe('New message');
    
    setTimeout(() => {
      expect(component.message).toBe('');
      done();
    }, 5100);
  });
});
