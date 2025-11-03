# Frontend Implementation Example - Email Notification Preferences

## Angular Component Example

### 1. Service (`email-preferences.service.ts`)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface EmailNotificationPreferences {
  enabled: boolean;
  tokenPurchase: boolean;
  bookNowToken: boolean;
  amcPayment: boolean;
  booking: boolean;
  kyc: boolean;
  refund: boolean;
  sharedMember: boolean;
}

export interface PreferencesResponse {
  status: string;
  body: {
    emailNotifications: EmailNotificationPreferences;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailPreferencesService {
  private apiUrl = `${environment.apiUrl}/users/email-notifications/preferences`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getPreferences(): Observable<PreferencesResponse> {
    return this.http.get<PreferencesResponse>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  updatePreferences(preferences: Partial<EmailNotificationPreferences>): Observable<PreferencesResponse> {
    return this.http.put<PreferencesResponse>(this.apiUrl, preferences, {
      headers: this.getHeaders()
    });
  }
}
```

### 2. Component (`email-preferences.component.ts`)

```typescript
import { Component, OnInit } from '@angular/core';
import { EmailPreferencesService, EmailNotificationPreferences } from './email-preferences.service';

@Component({
  selector: 'app-email-preferences',
  templateUrl: './email-preferences.component.html',
  styleUrls: ['./email-preferences.component.css']
})
export class EmailPreferencesComponent implements OnInit {
  preferences: EmailNotificationPreferences = {
    enabled: true,
    tokenPurchase: true,
    bookNowToken: true,
    amcPayment: true,
    booking: true,
    kyc: true,
    refund: true,
    sharedMember: true
  };

  loading = false;
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  notificationTypes = [
    { key: 'tokenPurchase', label: 'Token Purchase Confirmations', description: 'Get notified when you purchase a waitlist token' },
    { key: 'bookNowToken', label: 'Book Now Token Confirmations', description: 'Get notified when you purchase a book now token' },
    { key: 'amcPayment', label: 'AMC Payment Confirmations', description: 'Get notified about AMC payment confirmations' },
    { key: 'booking', label: 'Booking Confirmations', description: 'Get notified when you make a booking' },
    { key: 'kyc', label: 'KYC Updates', description: 'Get notified about KYC status changes and reminders' },
    { key: 'refund', label: 'Refund Notifications', description: 'Get notified about refund status updates' },
    { key: 'sharedMember', label: 'Shared Member Updates', description: 'Get notified about shared member approvals' }
  ];

  constructor(private preferencesService: EmailPreferencesService) {}

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.loading = true;
    this.preferencesService.getPreferences().subscribe({
      next: (response) => {
        this.preferences = response.body.emailNotifications;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
        this.showMessage('Failed to load preferences', 'error');
        this.loading = false;
      }
    });
  }

  onMasterToggleChange(): void {
    // When master toggle is turned off, optionally disable all sub-toggles
    if (!this.preferences.enabled) {
      // You can choose to keep individual preferences or reset them
      // For now, we'll keep them so when user re-enables, their choices are preserved
    }
  }

  savePreferences(): void {
    this.saving = true;
    this.preferencesService.updatePreferences(this.preferences).subscribe({
      next: (response) => {
        this.preferences = response.body.emailNotifications;
        this.showMessage('Preferences saved successfully!', 'success');
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving preferences:', error);
        this.showMessage('Failed to save preferences', 'error');
        this.saving = false;
      }
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
```

### 3. Template (`email-preferences.component.html`)

```html
<div class="email-preferences-container">
  <div class="preferences-header">
    <h2>Email Notification Preferences</h2>
    <p class="subtitle">Choose which email notifications you want to receive</p>
  </div>

  <div *ngIf="loading" class="loading-spinner">
    <p>Loading preferences...</p>
  </div>

  <div *ngIf="!loading" class="preferences-content">
    <!-- Master Toggle -->
    <div class="preference-item master-toggle">
      <div class="preference-info">
        <h3>Email Notifications</h3>
        <p>Enable or disable all email notifications</p>
      </div>
      <label class="toggle-switch">
        <input 
          type="checkbox" 
          [(ngModel)]="preferences.enabled"
          (change)="onMasterToggleChange()"
        />
        <span class="slider"></span>
      </label>
    </div>

    <!-- Individual Notification Types -->
    <div class="notification-types" [class.disabled]="!preferences.enabled">
      <h3>Notification Types</h3>
      <p class="info-text" *ngIf="!preferences.enabled">
        Enable email notifications above to customize individual notification types
      </p>

      <div 
        *ngFor="let type of notificationTypes" 
        class="preference-item"
        [class.disabled]="!preferences.enabled"
      >
        <div class="preference-info">
          <h4>{{ type.label }}</h4>
          <p>{{ type.description }}</p>
        </div>
        <label class="toggle-switch">
          <input 
            type="checkbox" 
            [(ngModel)]="preferences[type.key]"
            [disabled]="!preferences.enabled"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Save Button -->
    <div class="actions">
      <button 
        class="btn-save" 
        (click)="savePreferences()"
        [disabled]="saving"
      >
        {{ saving ? 'Saving...' : 'Save Preferences' }}
      </button>
    </div>

    <!-- Message Display -->
    <div 
      *ngIf="message" 
      class="message"
      [class.success]="messageType === 'success'"
      [class.error]="messageType === 'error'"
    >
      {{ message }}
    </div>
  </div>
</div>
```

### 4. Styles (`email-preferences.component.css`)

```css
.email-preferences-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.preferences-header {
  margin-bottom: 30px;
}

.preferences-header h2 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
}

.loading-spinner {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.preference-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preference-item.master-toggle {
  background: #f8f9fa;
  border: 2px solid #3498db;
}

.preference-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.preference-info h3 {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.preference-info h4 {
  font-size: 16px;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.preference-info p {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.notification-types {
  margin-top: 30px;
}

.notification-types h3 {
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 16px;
}

.notification-types.disabled {
  opacity: 0.6;
}

.info-text {
  color: #e67e22;
  font-size: 14px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fef5e7;
  border-radius: 4px;
}

/* Toggle Switch Styles */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3498db;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

input:disabled + .slider {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Actions */
.actions {
  margin-top: 30px;
  text-align: center;
}

.btn-save {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 40px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-save:hover:not(:disabled) {
  background: #2980b9;
}

.btn-save:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Message */
.message {
  margin-top: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
```

## React Component Example (Bonus)

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface EmailPreferences {
  enabled: boolean;
  tokenPurchase: boolean;
  bookNowToken: boolean;
  amcPayment: boolean;
  booking: boolean;
  kyc: boolean;
  refund: boolean;
  sharedMember: boolean;
}

const EmailPreferencesComponent: React.FC = () => {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    enabled: true,
    tokenPurchase: true,
    bookNowToken: true,
    amcPayment: true,
    booking: true,
    kyc: true,
    refund: true,
    sharedMember: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/email-notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data.body.emailNotifications);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        '/api/users/email-notifications/preferences',
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreferences(response.data.body.emailNotifications);
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="email-preferences">
      <h2>Email Notification Preferences</h2>
      
      <div className="master-toggle">
        <label>
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={(e) => updatePreference('enabled', e.target.checked)}
          />
          Enable Email Notifications
        </label>
      </div>

      <div className={`notification-types ${!preferences.enabled ? 'disabled' : ''}`}>
        {Object.entries(preferences).map(([key, value]) => {
          if (key === 'enabled') return null;
          return (
            <div key={key} className="preference-item">
              <label>
                <input
                  type="checkbox"
                  checked={value}
                  disabled={!preferences.enabled}
                  onChange={(e) => updatePreference(key as keyof EmailPreferences, e.target.checked)}
                />
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            </div>
          );
        })}
      </div>

      <button onClick={savePreferences} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>

      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default EmailPreferencesComponent;
```

## Integration Steps

1. **Add to User Settings/Profile Page**
   - Create a new tab or section for "Email Preferences"
   - Import and use the component

2. **Add to Navigation**
   ```typescript
   {
     path: 'settings/email-preferences',
     component: EmailPreferencesComponent,
     canActivate: [AuthGuard]
   }
   ```

3. **Test the Integration**
   - Load preferences on component init
   - Toggle individual preferences
   - Save and verify changes persist
   - Test with master toggle on/off

## Best Practices

- ✅ Show loading state while fetching preferences
- ✅ Disable individual toggles when master toggle is off
- ✅ Provide clear descriptions for each notification type
- ✅ Show success/error messages after saving
- ✅ Preserve individual preferences when master toggle is turned off
- ✅ Use proper error handling
- ✅ Add confirmation before disabling all notifications

---

**Note:** Adjust the API URL and authentication method based on your frontend setup.
