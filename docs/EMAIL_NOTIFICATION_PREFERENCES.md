# Email Notification Preferences

## Overview

Users can now control which email notifications they receive from the Fraction platform. This feature allows users to opt-out of specific types of email notifications or disable all email notifications entirely.

## Features

### User Preferences

Users can control the following email notification types:

1. **Global Toggle** (`enabled`): Master switch to enable/disable all email notifications
2. **Token Purchase** (`tokenPurchase`): Notifications for waitlist token purchases
3. **Book Now Token** (`bookNowToken`): Notifications for book now token purchases
4. **AMC Payment** (`amcPayment`): Notifications for AMC payment confirmations
5. **Booking** (`booking`): Notifications for booking confirmations
6. **KYC** (`kyc`): Notifications for KYC status updates and reminders
7. **Refund** (`refund`): Notifications for refund status updates
8. **Shared Member** (`sharedMember`): Notifications for shared member approvals/rejections

### Default Settings

By default, all email notifications are **enabled** for new users. This ensures backward compatibility and that users don't miss important communications.

## API Endpoints

### Get Email Notification Preferences

**Endpoint:** `GET /api/users/email-notifications/preferences`

**Authentication:** Required (User token)

**Response:**
```json
{
  "status": "success",
  "body": {
    "emailNotifications": {
      "enabled": true,
      "tokenPurchase": true,
      "bookNowToken": true,
      "amcPayment": true,
      "booking": true,
      "kyc": true,
      "refund": true,
      "sharedMember": true
    }
  },
  "message": "Email notification preferences retrieved successfully"
}
```

### Update Email Notification Preferences

**Endpoint:** `PUT /api/users/email-notifications/preferences`

**Authentication:** Required (User token)

**Request Body:**
```json
{
  "enabled": true,
  "tokenPurchase": false,
  "bookNowToken": true,
  "amcPayment": true,
  "booking": false,
  "kyc": true,
  "refund": true,
  "sharedMember": true
}
```

**Notes:**
- All fields are optional
- Only provided fields will be updated
- Boolean values only (true/false)

**Response:**
```json
{
  "status": "success",
  "body": {
    "emailNotifications": {
      "enabled": true,
      "tokenPurchase": false,
      "bookNowToken": true,
      "amcPayment": true,
      "booking": false,
      "kyc": true,
      "refund": true,
      "sharedMember": true
    }
  },
  "message": "Email notification preferences updated successfully"
}
```

## Database Schema

### User Model Update

The `User` model has been updated with the following field:

```javascript
emailNotifications: {
  enabled: { type: Boolean, default: true },
  tokenPurchase: { type: Boolean, default: true },
  bookNowToken: { type: Boolean, default: true },
  amcPayment: { type: Boolean, default: true },
  booking: { type: Boolean, default: true },
  kyc: { type: Boolean, default: true },
  refund: { type: Boolean, default: true },
  sharedMember: { type: Boolean, default: true }
}
```

## Implementation Details

### Email Service Updates

The `emailService.js` has been updated with a helper function `shouldSendEmail()` that:

1. Checks if the user has email notifications enabled globally
2. Checks if the specific notification type is enabled
3. Returns `true` if email should be sent, `false` otherwise
4. Provides backward compatibility for users without preferences set

### Affected Email Functions

The following email functions now check user preferences before sending:

- `sendWelcomeEmail()`
- `sendKycApprovedEmail()`
- `sendKycRejectedEmail()`
- `sendKycReminderEmail()`
- `sendTokenPurchaseConfirmationEmail()`
- `sendBookNowTokenPurchaseConfirmationEmail()`
- `sendAMCPaymentConfirmationEmail()`
- `sendBookingConfirmationEmail()`
- `sendRefundInitiated()`
- `sendRefundProcessed()`
- `sendRefundSuccessful()`
- `sendSharedMemberApprovedNotification()`

### Skipped Email Response

When an email is skipped due to user preferences, the email function returns:

```javascript
{
  success: true,
  skipped: true,
  message: 'Notification type disabled for user'
}
```

This allows calling code to distinguish between successful sends and skipped emails.

## Usage Examples

### Example 1: Disable All Email Notifications

```javascript
// Frontend API call
const response = await fetch('/api/users/email-notifications/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    enabled: false
  })
});
```

### Example 2: Disable Only Token Purchase Notifications

```javascript
const response = await fetch('/api/users/email-notifications/preferences', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tokenPurchase: false,
    bookNowToken: false
  })
});
```

### Example 3: Get Current Preferences

```javascript
const response = await fetch('/api/users/email-notifications/preferences', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const data = await response.json();
console.log(data.body.emailNotifications);
```

## Frontend Integration

### Recommended UI Components

1. **Settings Page Section**
   - Master toggle for all notifications
   - Individual toggles for each notification type
   - Clear descriptions for each notification type
   - Save button to update preferences

2. **User Profile Menu**
   - Quick link to notification settings
   - Badge showing if notifications are disabled

3. **First-time User Onboarding**
   - Inform users about notification preferences
   - Link to settings page

### Example UI Structure

```
Email Notifications
├── Enable Email Notifications [Toggle: ON]
│
├── Notification Types (only shown if master toggle is ON)
│   ├── Token Purchases [Toggle: ON]
│   ├── Book Now Tokens [Toggle: ON]
│   ├── AMC Payments [Toggle: ON]
│   ├── Bookings [Toggle: ON]
│   ├── KYC Updates [Toggle: ON]
│   ├── Refunds [Toggle: ON]
│   └── Shared Members [Toggle: ON]
│
└── [Save Preferences Button]
```

## Backward Compatibility

- Existing users without `emailNotifications` field will have all notifications enabled by default
- The system gracefully handles missing preference data
- No database migration required - preferences are created on first update

## Testing

### Manual Testing

1. **Test Disabling All Notifications:**
   ```bash
   curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"enabled": false}'
   ```

2. **Test Disabling Specific Notification:**
   ```bash
   curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"tokenPurchase": false}'
   ```

3. **Test Getting Preferences:**
   ```bash
   curl -X GET http://localhost:3000/api/users/email-notifications/preferences \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Automated Testing

Test scenarios to implement:

1. User can retrieve default preferences
2. User can update individual preferences
3. User can disable all notifications with master toggle
4. Emails are not sent when preferences are disabled
5. Emails are sent when preferences are enabled
6. Backward compatibility with users without preferences

## Security Considerations

- Only authenticated users can access their own preferences
- Preferences are tied to user account
- No sensitive data exposed in preferences
- Standard authentication middleware applies

## Future Enhancements

Potential improvements for future versions:

1. **Email Frequency Control**
   - Daily digest option
   - Weekly summary option

2. **Notification Channels**
   - SMS notifications
   - Push notifications
   - In-app notifications

3. **Advanced Preferences**
   - Time-based preferences (e.g., no emails after 10 PM)
   - Priority levels for different notification types

4. **Admin Features**
   - View user notification preferences
   - Send important notifications regardless of preferences
   - Analytics on notification opt-out rates

## Support

For issues or questions:
- Check logs for email skipping messages
- Verify user preferences in database
- Test with different preference combinations

---

**Last Updated:** December 2024
**Version:** 1.0.0
**Maintainer:** Fraction Development Team
