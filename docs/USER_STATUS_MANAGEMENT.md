# User Status Management System Documentation

## Overview

The User Status Management System allows administrators and super administrators to suspend or deactivate user accounts. Suspensions are temporary (7 days) and automatically removed, while deactivations are permanent until manually reversed.

## Features

### 1. User Status Types
- **Active**: Normal user account with full access
- **Suspended**: Temporary restriction for 7 days, automatically removed
- **Deactivated**: Permanent restriction until manually reactivated

### 2. Automatic Suspension Removal
- **Cron Job**: Runs daily at 11:00 AM IST
- **Automatic Reactivation**: Suspended users are automatically reactivated after 7 days
- **Notification**: Users receive notification when suspension expires

### 3. Access Control
- **Authentication Middleware**: Checks user status before allowing access
- **Suspended Users**: Cannot access the system during suspension period
- **Deactivated Users**: Cannot access the system until manually reactivated

## Database Schema

### User Model Updates
```javascript
// User status management fields
status: { 
  type: String, 
  enum: ['active', 'suspended', 'deactivated'], 
  default: 'active' 
},
suspensionEndDate: { type: Date },
suspensionReason: { type: String },
deactivationReason: { type: String },
statusChangedBy: {
  id: { type: mongoose.Schema.Types.ObjectId },
  role: { type: String },
  name: { type: String },
  email: { type: String }
},
statusChangedAt: { type: Date }
```

## API Endpoints

### 1. Suspend User
```
POST /api/users/:userId/suspend
```
**Access**: Admin and SuperAdmin only
**Body**:
```json
{
  "reason": "Violation of terms of service"
}
```
**Response**:
```json
{
  "status": "success",
  "body": {
    "user": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "status": "suspended",
      "suspensionEndDate": "2024-01-15T00:00:00.000Z",
      "suspensionReason": "Violation of terms of service"
    }
  },
  "message": "User suspended successfully for 7 days"
}
```

### 2. Deactivate User
```
POST /api/users/:userId/deactivate
```
**Access**: Admin and SuperAdmin only
**Body**:
```json
{
  "reason": "Account closure requested"
}
```

### 3. Reactivate User
```
POST /api/users/:userId/reactivate
```
**Access**: Admin and SuperAdmin only
**Body**:
```json
{
  "reason": "Issue resolved"
}
```

### 4. Get Users by Status
```
GET /api/users/status/:status?page=1&limit=20
```
**Access**: Admin and SuperAdmin only
**Parameters**:
- `status`: active, suspended, or deactivated
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### 5. Get User Status History
```
GET /api/users/:userId/status-history
```
**Access**: Admin and SuperAdmin only
**Response**:
```json
{
  "status": "success",
  "body": {
    "history": {
      "currentStatus": "suspended",
      "suspensionEndDate": "2024-01-15T00:00:00.000Z",
      "suspensionReason": "Violation of terms",
      "statusChangedBy": {
        "id": "admin_id",
        "role": "admin",
        "name": "Admin Name",
        "email": "admin@fraction.com"
      },
      "statusChangedAt": "2024-01-08T10:00:00.000Z",
      "accountCreatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 6. Get Suspension Statistics
```
GET /api/users/stats/suspensions
```
**Access**: Admin and SuperAdmin only
**Response**:
```json
{
  "status": "success",
  "body": {
    "stats": {
      "totalUsers": 1000,
      "active": 950,
      "suspended": 30,
      "deactivated": 20,
      "expiredSuspensions": 5
    }
  }
}
```

### 7. Check User Permissions
```
GET /api/users/:userId/permissions
```
**Access**: All authenticated users
**Response**:
```json
{
  "status": "success",
  "body": {
    "permissions": {
      "canPerform": false,
      "reason": "User account is suspended",
      "suspensionEndDate": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

## Service Architecture

### UserStatusService
Located at `backend/utils/userStatusService.js`

#### Key Methods:
- `suspendUser(userId, reason, changedBy)`: Suspend user for 7 days
- `deactivateUser(userId, reason, changedBy)`: Permanently deactivate user
- `reactivateUser(userId, reason, changedBy)`: Reactivate suspended/deactivated user
- `checkAndRemoveExpiredSuspensions()`: Remove expired suspensions (cron job)
- `getUsersByStatus(status, page, limit)`: Get users by status with pagination
- `getUserStatusHistory(userId)`: Get user's status change history
- `canUserPerformActions(userId)`: Check if user can perform actions
- `getSuspensionStats()`: Get suspension statistics

## Notification System

### User Notifications
- **Suspension**: High-priority notification when user is suspended
- **Deactivation**: High-priority notification when user is deactivated
- **Reactivation**: High-priority notification when user is reactivated
- **Suspension Expired**: High-priority notification when suspension automatically expires

### Admin Notifications
- **Status Change**: High-priority notification when user status changes
- **Automatic Reactivation**: Notification when suspensions are automatically removed

## Cron Job Integration

### Suspension Check Job
- **Schedule**: Daily at 11:00 AM IST
- **Function**: Automatically reactivate users whose suspensions have expired
- **Logging**: Comprehensive logging of reactivation activities

## Authentication Middleware Updates

### Status Checking
The authentication middleware now checks user status before allowing access:

1. **User Not Found**: Returns 401 with appropriate message
2. **Deactivated User**: Returns 403 with deactivation message
3. **Suspended User**: Returns 403 with suspension details and end date
4. **Expired Suspension**: Allows access (cron job will update status)

### Error Responses
```json
// Deactivated user
{
  "error": "Account deactivated",
  "message": "Your account has been deactivated. Please contact support.",
  "status": "deactivated"
}

// Suspended user
{
  "error": "Account suspended",
  "message": "Your account is suspended until 15/01/2024. Please contact support.",
  "status": "suspended",
  "suspensionEndDate": "2024-01-15T00:00:00.000Z"
}
```

## Usage Examples

### 1. Suspend a User
```javascript
// Suspend user for 7 days
const result = await UserStatusService.suspendUser(
  'user_id',
  'Violation of terms of service',
  {
    id: 'admin_id',
    role: 'admin',
    name: 'Admin Name',
    email: 'admin@fraction.com'
  }
);
```

### 2. Check User Permissions
```javascript
// Check if user can perform actions
const permissions = await UserStatusService.canUserPerformActions('user_id');
if (!permissions.canPerform) {
  console.log(`User cannot perform actions: ${permissions.reason}`);
}
```

### 3. Get Suspension Statistics
```javascript
// Get current suspension statistics
const stats = await UserStatusService.getSuspensionStats();
console.log(`Total users: ${stats.totalUsers}`);
console.log(`Suspended: ${stats.suspended}`);
console.log(`Deactivated: ${stats.deactivated}`);
```

## Security Considerations

### Access Control
- Only admin and superadmin users can manage user status
- Users cannot modify their own status
- Status changes are logged with admin details

### Data Protection
- User status information is protected
- Status change history is maintained for audit purposes
- Sensitive information is not exposed in API responses

## Monitoring and Logging

### Log Messages
- User status changes (suspend, deactivate, reactivate)
- Automatic suspension removals
- Authentication failures due to status
- Error handling and recovery

### Metrics Tracked
- Number of suspended users
- Number of deactivated users
- Automatic reactivations per day
- Status change frequency

## Error Handling

### Graceful Degradation
- Database errors are logged and reported
- Notification failures don't prevent status changes
- Authentication middleware handles status check failures

### Recovery Mechanisms
- Failed status changes are logged for retry
- Expired suspensions are automatically handled by cron job
- Database connection issues are handled gracefully

## Testing

### Manual Testing
1. Create a test user account
2. Suspend the user via API
3. Verify user cannot access protected routes
4. Wait for suspension to expire or manually reactivate
5. Verify user can access system again

### Automated Testing
- Unit tests for status change operations
- Integration tests for cron job execution
- Authentication middleware testing
- Notification system testing

## Future Enhancements

### Potential Improvements
1. **Custom Suspension Periods**: Allow different suspension durations
2. **Suspension Reasons**: Predefined reason categories
3. **Bulk Operations**: Suspend/deactivate multiple users at once
4. **Status Change Workflow**: Multi-step approval process
5. **User Appeals**: Allow users to appeal suspensions/deactivations

### Monitoring Dashboard
- Real-time user status overview
- Suspension/deactivation trends
- Admin activity monitoring
- User behavior analytics

## Troubleshooting

### Common Issues
1. **Suspensions not expiring**: Check cron job status and database connectivity
2. **Users can access despite suspension**: Verify authentication middleware configuration
3. **Missing notifications**: Check email service configuration
4. **Database errors**: Review MongoDB connection and schema validation

### Debug Commands
```bash
# Check cron job status
pm2 logs

# Test user suspension manually
curl -X POST http://localhost:3000/api/users/USER_ID/suspend \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test suspension"}'

# Check user status
curl -X GET http://localhost:3000/api/users/USER_ID/permissions \
  -H "Authorization: Bearer <user-token>"
```

## Support

For issues or questions regarding the User Status Management System:
1. Check the application logs for error messages
2. Verify database connectivity and user status
3. Test status changes via API endpoints
4. Contact the development team with specific error details

## API Rate Limits

### Status Management Endpoints
- **Suspend/Deactivate/Reactivate**: 10 requests per minute per admin
- **Status Queries**: 100 requests per minute per admin
- **Statistics**: 20 requests per minute per admin

### User Permission Checks
- **Permission Checks**: 200 requests per minute per user
- **Status History**: 50 requests per minute per admin
