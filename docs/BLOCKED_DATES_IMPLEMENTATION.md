# Blocked Dates Feature Implementation

## Overview
This implementation adds the ability for super admin and admin users to block specific dates for car bookings, preventing users from making bookings during maintenance periods or other restricted times.

## Backend Implementation

### 1. New Model: BlockedDate
**File:** `backend/models/BlockedDate.js`

The BlockedDate model stores information about blocked date ranges:
- `carid`: Reference to the Car model
- `blockedFrom`: Start date of the blocked period
- `blockedTo`: End date of the blocked period
- `reason`: Reason for blocking (default: "Maintenance")
- `createdBy`: Reference to Admin/SuperAdmin who created the block
- `createdByModel`: Model type (Admin/SuperAdmin)
- `isActive`: Soft delete flag

### 2. New Controller: blockedDateController
**File:** `backend/controllers/blockedDateController.js`

Provides the following endpoints:
- `POST /api/blocked-dates/` - Create new blocked date (Admin/SuperAdmin only)
- `GET /api/blocked-dates/` - Get all blocked dates (Admin/SuperAdmin only)
- `GET /api/blocked-dates/car/:carId` - Get blocked dates for specific car (Public)
- `PUT /api/blocked-dates/:id` - Update blocked date (Admin/SuperAdmin only)
- `DELETE /api/blocked-dates/:id` - Delete blocked date (Admin/SuperAdmin only)
- `POST /api/blocked-dates/check-availability` - Check if dates are available (Public)

### 3. New Routes: blockedDateRoutes
**File:** `backend/routes/blockedDateRoutes.js`

Defines the API routes with proper authentication middleware.

### 4. Updated Booking Controller
**File:** `backend/controllers/bookingController.js`

Modified the following functions to check for blocked dates:
- `createBooking()` - Now checks for blocked dates before creating bookings
- `updateBooking()` - Now checks for blocked dates when updating booking dates
- `checkBookingAvailability()` - Now includes blocked dates in availability checks

### 5. Updated Main Server
**File:** `backend/index.js`

Added the blocked dates routes to the main server configuration.

## Frontend Implementation

### 1. New Service: BlockedDateService
**File:** `frontend/src/app/services/blocked-date.service.ts`

Provides Angular service methods for:
- Creating blocked dates
- Getting blocked dates
- Updating blocked dates
- Deleting blocked dates
- Checking date availability

### 2. Updated Bookings Component
**Files:** 
- `frontend/src/app/bookings/bookings.ts`
- `frontend/src/app/bookings/bookings.html`

Added functionality for:
- "Block Dates" button in the action bar (visible only to Admin/SuperAdmin)
- Blocked dates management modal
- Form for creating/editing blocked dates
- List of current blocked dates with edit/delete options
- Integration with existing booking system

## Key Features

### 1. Date Blocking
- Admins can block specific date ranges for any car
- Blocked dates prevent new bookings from being created
- Existing bookings are not affected by blocked dates

### 2. Overlap Prevention
- System prevents overlapping blocked date ranges
- Clear error messages when conflicts occur

### 3. Soft Delete
- Blocked dates are soft deleted (marked as inactive)
- Maintains audit trail of blocked periods

### 4. User Permissions
- Only Admin and SuperAdmin can manage blocked dates
- Regular users cannot see or modify blocked dates

### 5. Integration with Booking System
- Booking creation automatically checks for blocked dates
- Clear error messages when trying to book blocked dates
- Availability checking includes blocked dates

## API Endpoints

### Create Blocked Date
```
POST /api/blocked-dates/
Authorization: Required (Admin/SuperAdmin)
Body: {
  "carid": "car_id",
  "blockedFrom": "2024-01-15",
  "blockedTo": "2024-01-20",
  "reason": "Maintenance"
}
```

### Get Blocked Dates
```
GET /api/blocked-dates/
Authorization: Required (Admin/SuperAdmin)
Query: ?carid=car_id (optional)
```

### Update Blocked Date
```
PUT /api/blocked-dates/:id
Authorization: Required (Admin/SuperAdmin)
Body: {
  "blockedFrom": "2024-01-15",
  "blockedTo": "2024-01-20",
  "reason": "Updated reason"
}
```

### Delete Blocked Date
```
DELETE /api/blocked-dates/:id
Authorization: Required (Admin/SuperAdmin)
```

### Check Date Availability
```
POST /api/blocked-dates/check-availability
Body: {
  "carId": "car_id",
  "bookingFrom": "2024-01-15",
  "bookingTo": "2024-01-20"
}
```

## Usage Instructions

### For Admins/SuperAdmins:

1. **Access Blocked Dates Management:**
   - Go to the Bookings page
   - Click the "Block Dates" button (red button with ban icon)

2. **Create New Blocked Date:**
   - Select a car from the dropdown
   - Choose the start and end dates
   - Add a reason (optional, defaults to "Maintenance")
   - Click "Block Dates"

3. **Edit Existing Blocked Date:**
   - Click the edit icon (pencil) next to any blocked date
   - Modify the dates or reason
   - Click "Update Blocked Date"

4. **Delete Blocked Date:**
   - Click the delete icon (trash) next to any blocked date
   - Confirm the deletion

### For Users:

- Users will see appropriate error messages when trying to book blocked dates
- The system will prevent booking creation on blocked dates
- Blocked dates are not visible to regular users

## Error Handling

The system provides clear error messages for:
- Overlapping blocked date ranges
- Invalid date ranges (end date before start date)
- Missing required fields
- Unauthorized access attempts
- Database connection issues

## Security Considerations

- All blocked date operations require Admin/SuperAdmin authentication
- Input validation prevents invalid date ranges
- Soft delete maintains data integrity
- Proper error handling prevents information leakage

## Testing

A test script is provided at `backend/test-blocked-dates.js` to verify:
- Blocked date creation
- Date overlap detection
- Query functionality
- Data cleanup

## Future Enhancements

Potential improvements could include:
- Recurring blocked dates (weekly maintenance)
- Email notifications for blocked date creation
- Integration with calendar systems
- Bulk date blocking operations
- Blocked date templates for common scenarios
