# KYC Reminder System Documentation

## Overview

The KYC Reminder System automatically sends daily reminder notifications to users who have pending KYC verification status. This system ensures that users complete their KYC verification process to access all platform features.

## Features

- **Automatic Daily Reminders**: Sends reminders once per day to users with pending KYC status
- **Dual Notification System**: Sends both email and web/in-app notifications
- **Smart Filtering**: Only sends reminders to active users who have been registered for at least 1 day
- **Admin Controls**: Manual trigger and management capabilities for administrators
- **Notification Integration**: Integrates with the existing notification system
- **Scheduled Execution**: Runs automatically via cron job at 11:00 AM daily

## API Endpoints

### 1. Trigger KYC Reminder Check (Manual)
```
POST /api/kyc-reminders/trigger-check
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "remindersSent": 5,
    "totalChecked": 12
  },
  "message": "KYC reminder check completed successfully"
}
```

### 2. Get Users Needing KYC Reminders
```
GET /api/kyc-reminders/users-needing-reminders
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "users": [
      {
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "kycStatus": "pending"
        },
        "daysSinceRegistration": 3
      }
    ]
  },
  "message": "Users needing KYC reminders retrieved successfully"
}
```

### 3. Send Reminder to Specific User
```
POST /api/kyc-reminders/send-reminder/:userId
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "success": true,
    "daysSinceRegistration": 3
  },
  "message": "KYC reminder sent successfully"
}
```

## File Structure

```
backend/
├── controllers/
│   └── kycReminderController.js    # API controllers
├── routes/
│   └── kycReminderRoutes.js        # API routes
├── utils/
│   ├── kycReminderService.js       # Core business logic
│   └── notificationService.js      # Updated with KYC reminder methods
├── scripts/
│   └── kycReminderScheduler.js    # Cron scheduler
└── index.js                        # Updated with KYC reminder routes
```

## Core Components

### 1. KYCReminderService (`backend/utils/kycReminderService.js`)

**Main Methods:**
- `checkAndSendReminders()`: Checks all users with pending KYC and sends reminders
- `getUsersNeedingKYCReminders()`: Returns list of users who need reminders
- `sendReminderForUser(userId)`: Sends reminder to a specific user

**Logic:**
- Filters users with `kycStatus: 'pending'` and `status: 'active'`
- Only sends reminders to users registered for at least 1 day
- Calculates days since registration for personalized messages

### 2. KYCReminderController (`backend/controllers/kycReminderController.js`)

**Endpoints:**
- `triggerKYCReminderCheck`: Manual trigger for testing/admin use
- `getUsersNeedingKYCReminders`: Admin view of users needing reminders
- `sendReminderForUser`: Send reminder to specific user

**Security:**
- All endpoints require admin or superadmin authentication
- Proper error handling and validation

### 3. KYCReminderScheduler (`backend/scripts/kycReminderScheduler.js`)

**Features:**
- Runs daily at 11:00 AM (Asia/Kolkata timezone)
- Automatic authentication with admin credentials
- Token refresh on expiration
- Comprehensive logging

**Configuration:**
```javascript
const KYC_REMINDER_CONFIG = {
  reminderCheckCron: '0 11 * * *', // Daily at 11 AM
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  adminCredentials: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  }
};
```

## Notification Details

### KYC Reminder Notifications
The system sends **both email and web notifications** to ensure maximum visibility:

#### Web/In-App Notification
- **Type**: `kyc_reminder`
- **Priority**: `medium`
- **Title**: "📋 KYC Verification Reminder"
- **Message**: Personalized message with user's name and days since registration
- **Metadata**: Includes user details and reminder type

#### Email Notification
- **Subject**: "📋 Complete Your KYC Verification - Fraction"
- **Template**: Professional HTML email with branding
- **Content**: Detailed explanation of benefits and direct link to KYC completion
- **Personalization**: User name, registration date, and days since registration

### Example Web Notification
```json
{
  "type": "kyc_reminder",
  "title": "📋 KYC Verification Reminder",
  "message": "Hi John! Please complete your KYC verification to access all features and start booking cars. Your account was created 3 days ago.",
  "metadata": {
    "userName": "John",
    "daysSinceRegistration": 3,
    "reminderType": "kyc_pending"
  }
}
```

### Example Email Content
- **Subject**: "📋 Complete Your KYC Verification - Fraction"
- **Content**: Professional HTML email with:
  - Personalized greeting with user's name
  - Days since registration
  - Benefits of completing KYC
  - Direct link to KYC verification page
  - Support contact information

## Setup and Configuration

### 1. Environment Variables
Add these to your `.env` file:
```env
API_BASE_URL=http://localhost:3000/api
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

### 2. Running the Scheduler

**Development:**
```bash
npm run kyc-scheduler:dev
```

**Production:**
```bash
npm run kyc-scheduler
```

### 3. Manual Testing
```bash
# Test the API endpoints
curl -X POST http://localhost:3000/api/kyc-reminders/trigger-check \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

## User Experience

### For Users
1. Users receive a friendly reminder notification
2. Notification appears in their notification panel
3. Clicking the notification can direct them to KYC completion page
4. Reminders stop once KYC is submitted/approved/rejected

### For Administrators
1. Can manually trigger reminder checks
2. Can view list of users needing reminders
3. Can send individual reminders
4. Comprehensive logging for monitoring

## Monitoring and Logs

The system provides detailed logging for:
- Scheduler initialization and authentication
- Daily reminder execution results
- Individual user reminder status
- Error handling and token refresh
- API call success/failure rates

**Sample Log Output:**
```
KYC Reminder Scheduler initialized successfully
KYC Reminder Scheduler authenticated successfully
Running scheduled KYC reminder check...
Starting KYC reminder check...
KYC reminder sent to user john@example.com (both email and web) - 3 days since registration
KYC reminder check completed: 5 reminders sent to 12 users
```

## Integration Points

### With Existing Systems
- **User Model**: Uses existing `kycStatus` and `status` fields
- **Notification System**: Integrates with existing notification infrastructure
- **Authentication**: Uses existing admin authentication system
- **Logging**: Uses existing logger utility

### Database Impact
- **Read Operations**: Queries users with pending KYC status
- **Write Operations**: Creates notification records
- **No Schema Changes**: Uses existing user and notification schemas

## Error Handling

### Common Error Scenarios
1. **Authentication Failure**: Automatic retry with re-authentication
2. **User Not Found**: Graceful handling with appropriate error messages
3. **Invalid KYC Status**: Validation prevents sending reminders to non-pending users
4. **Inactive Users**: Only active users receive reminders
5. **API Failures**: Comprehensive error logging and retry mechanisms

### Error Responses
```json
{
  "status": "failed",
  "body": {},
  "message": "User KYC is not in pending status"
}
```

## Performance Considerations

- **Efficient Queries**: Uses indexed fields (`kycStatus`, `status`, `createdAt`)
- **Batch Processing**: Processes all users in a single operation
- **Minimal Database Impact**: Only creates notification records
- **Scheduled Execution**: Runs during off-peak hours (11 AM)

## Security Features

- **Admin-Only Access**: All endpoints require admin/superadmin authentication
- **Token-Based Authentication**: Secure API access with JWT tokens
- **Input Validation**: Proper validation of user IDs and parameters
- **Error Information**: Limited error details to prevent information leakage

## Future Enhancements

Potential improvements for the KYC reminder system:
1. **Escalation Logic**: Increase reminder frequency for long-pending users
2. **Email Integration**: Send email reminders in addition to in-app notifications
3. **Customizable Messages**: Allow admins to customize reminder messages
4. **Analytics Dashboard**: Track reminder effectiveness and user completion rates
5. **Smart Timing**: Send reminders at optimal times based on user activity
6. **Reminder Limits**: Prevent spam by limiting reminders per user

## Troubleshooting

### Common Issues

1. **Scheduler Not Running**
   - Check if the script is running: `ps aux | grep kycReminderScheduler`
   - Verify environment variables are set correctly
   - Check admin credentials in logs

2. **No Reminders Being Sent**
   - Verify users exist with `kycStatus: 'pending'`
   - Check if users are `status: 'active'`
   - Ensure users are registered for at least 1 day

3. **Authentication Errors**
   - Verify admin credentials in environment variables
   - Check if admin account exists and is active
   - Review authentication logs for detailed error messages

4. **API Endpoint Errors**
   - Verify admin token is valid and not expired
   - Check if user ID exists in database
   - Review error logs for specific error messages

### Debug Commands
```bash
# Check scheduler status
npm run kyc-scheduler:dev

# Test API manually
curl -X GET http://localhost:3000/api/kyc-reminders/users-needing-reminders \
  -H "Authorization: Bearer <admin_token>"

# Check logs
tail -f logs/application.log | grep "KYC"
```
