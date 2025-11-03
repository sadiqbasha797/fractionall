# Email Notification Preferences - Quick API Reference

## Endpoints

### 1. Get User's Email Preferences

```http
GET /api/users/email-notifications/preferences
Authorization: Bearer {user_token}
```

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

### 2. Update Email Preferences

```http
PUT /api/users/email-notifications/preferences
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "enabled": false,
  "tokenPurchase": true,
  "bookNowToken": false,
  "amcPayment": true,
  "booking": false,
  "kyc": true,
  "refund": true,
  "sharedMember": true
}
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "emailNotifications": {
      "enabled": false,
      "tokenPurchase": true,
      "bookNowToken": false,
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

## Notification Types

| Field | Description |
|-------|-------------|
| `enabled` | Master switch - disables ALL emails when false |
| `tokenPurchase` | Waitlist token purchase confirmations |
| `bookNowToken` | Book now token purchase confirmations |
| `amcPayment` | AMC payment confirmations |
| `booking` | Booking confirmations |
| `kyc` | KYC status updates and reminders |
| `refund` | Refund status notifications |
| `sharedMember` | Shared member approval/rejection notifications |

## cURL Examples

### Get Preferences
```bash
curl -X GET http://localhost:3000/api/users/email-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Disable All Notifications
```bash
curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### Disable Only Token Notifications
```bash
curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tokenPurchase": false, "bookNowToken": false}'
```

### Enable All Notifications
```bash
curl -X PUT http://localhost:3000/api/users/email-notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "tokenPurchase": true,
    "bookNowToken": true,
    "amcPayment": true,
    "booking": true,
    "kyc": true,
    "refund": true,
    "sharedMember": true
  }'
```

## Testing

Run the test script:
```bash
cd backend
node test-email-preferences.js
```

## Notes

- All fields are optional in the update request
- Only provided fields will be updated
- Default value for all preferences is `true`
- When `enabled` is `false`, no emails are sent regardless of individual settings
- Backward compatible - users without preferences get all emails by default
