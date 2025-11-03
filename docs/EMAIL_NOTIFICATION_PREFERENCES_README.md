# Email Notification Preferences Feature

## 🎯 Overview

Users can now control which email notifications they receive from the Fraction platform. This feature provides a master toggle to disable all emails and granular controls for specific notification types.

## ✅ What's Implemented

### Backend (Complete)
- ✅ Database schema updated with email preferences
- ✅ API endpoints for getting and updating preferences
- ✅ Email service checks preferences before sending
- ✅ Backward compatible with existing users
- ✅ Comprehensive documentation
- ✅ Test scripts included

### Frontend (Pending)
- 🔄 Awaiting implementation
- 📄 Complete examples provided in documentation

## 🚀 Quick Start

### Run Database Migration (Important!)

Before using the feature, run the migration to add email preferences to existing users:

1. **Verify current state:**
   ```bash
   cd backend
   node migrations/verify-email-notifications.js
   ```

2. **Run the migration:**
   ```bash
   node migrations/add-email-notifications-to-users.js
   ```

3. **Verify migration success:**
   ```bash
   node migrations/verify-email-notifications.js
   ```

### Test the Backend

1. **Run the test script:**
   ```bash
   cd backend
   node test-email-preferences.js
   ```

2. **Test API endpoints:**
   ```bash
   # Get preferences
   curl -X GET http://localhost:3000/api/users/email-notifications/preferences \
     -H "Authorization: Bearer YOUR_TOKEN"

   # Disable all notifications
   curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"enabled": false}'
   ```

## 📚 Documentation

### Main Documentation
- **[EMAIL_NOTIFICATION_PREFERENCES.md](docs/EMAIL_NOTIFICATION_PREFERENCES.md)** - Complete feature documentation
- **[EMAIL_PREFERENCES_API_QUICK_REFERENCE.md](docs/EMAIL_PREFERENCES_API_QUICK_REFERENCE.md)** - Quick API reference
- **[EMAIL_PREFERENCES_IMPLEMENTATION_SUMMARY.md](docs/EMAIL_PREFERENCES_IMPLEMENTATION_SUMMARY.md)** - Implementation details

### Frontend Integration
- **[FRONTEND_EMAIL_PREFERENCES_EXAMPLE.md](docs/FRONTEND_EMAIL_PREFERENCES_EXAMPLE.md)** - Complete Angular & React examples
- **[EMAIL_PREFERENCES_CHECKLIST.md](docs/EMAIL_PREFERENCES_CHECKLIST.md)** - Implementation checklist

## 🔧 API Endpoints

### Get Preferences
```http
GET /api/users/email-notifications/preferences
Authorization: Bearer {token}
```

### Update Preferences
```http
PUT /api/users/email-notifications/preferences
Authorization: Bearer {token}
Content-Type: application/json

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

## 📋 Notification Types

| Type | Description |
|------|-------------|
| `enabled` | Master toggle - disables ALL emails when false |
| `tokenPurchase` | Waitlist token purchase confirmations |
| `bookNowToken` | Book now token purchase confirmations |
| `amcPayment` | AMC payment confirmations |
| `booking` | Booking confirmations |
| `kyc` | KYC status updates and reminders |
| `refund` | Refund status notifications |
| `sharedMember` | Shared member approval/rejection notifications |

## 🔄 How It Works

1. **User updates preferences** via API
2. **Preferences stored** in user document
3. **Email service checks** preferences before sending
4. **If disabled**, email is skipped and logged
5. **If enabled**, email is sent normally

## 📁 Files Modified

### Backend
- `backend/models/User.js` - Added emailNotifications field
- `backend/utils/emailService.js` - Added preference checking
- `backend/controllers/userController.js` - Added preference endpoints
- `backend/routes/userRoutes.js` - Added preference routes

### Documentation
- `docs/EMAIL_NOTIFICATION_PREFERENCES.md`
- `docs/EMAIL_PREFERENCES_API_QUICK_REFERENCE.md`
- `docs/EMAIL_PREFERENCES_IMPLEMENTATION_SUMMARY.md`
- `docs/FRONTEND_EMAIL_PREFERENCES_EXAMPLE.md`
- `docs/EMAIL_PREFERENCES_CHECKLIST.md`

### Testing
- `backend/test-email-preferences.js`

## 🎨 Frontend Implementation

See **[FRONTEND_EMAIL_PREFERENCES_EXAMPLE.md](docs/FRONTEND_EMAIL_PREFERENCES_EXAMPLE.md)** for:
- Complete Angular component with service
- React component example
- Styling examples
- Integration steps

### Recommended UI
```
Email Notifications
├── [Toggle] Enable Email Notifications
│
├── Notification Types
│   ├── [Toggle] Token Purchases
│   ├── [Toggle] Book Now Tokens
│   ├── [Toggle] AMC Payments
│   ├── [Toggle] Bookings
│   ├── [Toggle] KYC Updates
│   ├── [Toggle] Refunds
│   └── [Toggle] Shared Members
│
└── [Save Button]
```

## ✨ Features

- ✅ **Master Toggle** - Disable all emails with one switch
- ✅ **Granular Control** - Choose specific notification types
- ✅ **Backward Compatible** - Works with existing users
- ✅ **Secure** - Authentication required
- ✅ **Logged** - All changes are logged
- ✅ **Flexible** - Easy to add new notification types

## 🧪 Testing

### Backend Tests
```bash
cd backend
node test-email-preferences.js
```

### Manual API Tests
```bash
# Get current preferences
curl -X GET http://localhost:3000/api/users/email-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# Disable token notifications
curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tokenPurchase": false, "bookNowToken": false}'

# Disable all notifications
curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

## 🔐 Security

- ✅ Authentication required for all endpoints
- ✅ Users can only access their own preferences
- ✅ Input validation on all fields
- ✅ Standard middleware protection

## 📊 Monitoring

Check logs for:
- `Email notifications disabled for user {email}`
- `{type} notifications disabled for user {email}`
- Preference update confirmations

## 🚀 Next Steps

1. **Frontend Implementation**
   - Create preferences component
   - Add to user settings page
   - Implement API integration
   - Add UI/UX elements

2. **Testing**
   - Integration testing
   - User acceptance testing
   - Load testing

3. **Deployment**
   - Deploy backend (ready)
   - Deploy frontend (pending)
   - Monitor logs
   - Gather feedback

## 💡 Future Enhancements

- Email frequency control (daily digest, weekly summary)
- Time-based preferences (quiet hours)
- SMS and push notification preferences
- Admin analytics dashboard
- Preference templates

## 📞 Support

For questions or issues:
1. Check the documentation in `/docs`
2. Review the test script
3. Check application logs
4. Contact the development team

## 📝 Version History

- **v1.0.0** (December 2024) - Initial implementation
  - Backend complete
  - Documentation complete
  - Frontend examples provided

---

**Status:** Backend Complete ✅ | Frontend Pending 🔄

**Maintainer:** Fraction Development Team

**Last Updated:** December 2024
