# AMC Penalty System Documentation

## Overview

The AMC (Annual Maintenance Contract) Penalty System automatically applies an 18% annual interest rate penalty to overdue AMC payments. This system runs daily via cron jobs and ensures that users are charged appropriate penalties for late payments.

## Features

### 1. Automatic Penalty Calculation
- **Interest Rate**: 18% per annum (0.0493% per day)
- **Calculation Method**: `Penalty = Principal Amount × (18/365) × Days Overdue`
- **Daily Recalculation**: Penalties are recalculated daily to ensure accuracy
- **Automatic Application**: Runs daily at 10:00 AM IST via cron job

### 2. Penalty Tracking
- **Penalty Amount**: Stored in `amcamount[].penality` field
- **Last Calculation**: Tracked in `amcamount[].lastPenaltyCalculation` field
- **Daily Updates**: Penalties are recalculated and updated daily

### 3. Notification System
- **User Notifications**: High-priority notifications sent to users when penalties are applied
- **Admin Notifications**: Admins and super admins receive notifications about penalty applications
- **Detailed Information**: Notifications include penalty amount, days overdue, and total amount due

## Database Schema Updates

### AMC Model Changes
```javascript
amcamount: [{
  year: { type: Number, required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  duedate: { type: Date },
  paiddate: { type: Date },
  penality: { type: Number, default: 0 },
  lastPenaltyCalculation: { type: Date }, // NEW FIELD
  // ... other fields
}]
```

## API Endpoints

### 1. Get Overdue AMC Records
```
GET /api/amc/overdue/list
```
- **Access**: Admin and SuperAdmin only
- **Response**: List of AMC records with overdue payments and penalty information

### 2. Apply Penalties (All AMCs)
```
POST /api/amc/penalties/apply
```
- **Access**: Admin and SuperAdmin only
- **Function**: Manually trigger penalty calculation for all AMC records
- **Response**: Summary of penalties applied

### 3. Apply Penalty (Specific AMC)
```
POST /api/amc/:amcId/penalty/apply
```
- **Access**: Admin and SuperAdmin only
- **Function**: Apply penalties for a specific AMC record
- **Response**: Penalty application summary for the specific AMC

## Service Architecture

### AMCPenaltyService
Located at `backend/utils/amcPenaltyService.js`

#### Key Methods:
- `checkAndApplyPenalties()`: Main method that processes all AMC records
- `calculatePenalty(principalAmount, daysOverdue)`: Calculates penalty amount
- `getOverdueAMCRecords()`: Retrieves AMC records with overdue payments
- `applyPenaltyForAMC(amcId)`: Applies penalties for a specific AMC

### Cron Job Integration
Located at `backend/utils/cronService.js`

#### Schedule:
- **Time**: Daily at 10:00 AM IST
- **Function**: Automatically checks and applies penalties
- **Logging**: Comprehensive logging of penalty applications

## Notification Types

### User Notifications
- **Type**: `amc_penalty`
- **Priority**: High
- **Content**: Penalty amount, days overdue, total amount due

### Admin Notifications
- **Type**: `amc_penalty_applied`
- **Priority**: High
- **Content**: User details, penalty information, AMC details

## Usage Examples

### 1. Manual Penalty Application
```javascript
// Apply penalties for all AMC records
const result = await AMCPenaltyService.checkAndApplyPenalties();
console.log(`${result.penaltiesApplied} penalties applied`);
console.log(`Total penalty amount: ₹${result.totalPenaltyAmount}`);
```

### 2. Get Overdue Records
```javascript
// Get all overdue AMC records with penalty information
const overdueRecords = await AMCPenaltyService.getOverdueAMCRecords();
overdueRecords.forEach(record => {
  console.log(`AMC ${record.amc._id} has ${record.overdueYears.length} overdue years`);
});
```

### 3. Calculate Penalty for Specific Case
```javascript
// Calculate penalty for ₹10,000 overdue by 30 days
const penalty = AMCPenaltyService.calculatePenalty(10000, 30);
console.log(`Penalty amount: ₹${penalty}`); // ₹147.95
```

## Configuration

### Environment Variables
No additional environment variables are required. The system uses existing database connections and notification services.

### Timezone
All cron jobs run in `Asia/Kolkata` timezone to ensure proper timing for Indian users.

## Monitoring and Logging

### Log Messages
- Daily penalty check start/completion
- Individual penalty applications
- Error handling and recovery
- Notification sending status

### Metrics Tracked
- Number of penalties applied
- Total penalty amount calculated
- Number of AMC records processed
- Error rates and types

## Error Handling

### Graceful Degradation
- Email/notification failures don't stop penalty calculation
- Database errors are logged and reported
- Individual AMC processing errors don't affect other records

### Recovery Mechanisms
- Failed penalty calculations are retried on next cron run
- Notification failures are logged but don't prevent penalty application
- Database connection issues are handled gracefully

## Testing

### Manual Testing
1. Create an AMC with a past due date
2. Run the penalty application manually via API
3. Verify penalty calculation and notification sending
4. Check database for updated penalty amounts

### Automated Testing
- Unit tests for penalty calculation logic
- Integration tests for cron job execution
- Notification system testing

## Future Enhancements

### Potential Improvements
1. **Configurable Interest Rates**: Allow different penalty rates for different AMC types
2. **Grace Period**: Add configurable grace period before penalties apply
3. **Penalty Caps**: Implement maximum penalty amounts
4. **Payment Plans**: Allow users to pay penalties in installments
5. **Penalty Waivers**: Admin ability to waive penalties under certain conditions

### Monitoring Dashboard
- Real-time penalty application status
- Historical penalty trends
- User payment behavior analytics
- Revenue impact analysis

## Security Considerations

### Access Control
- Only admin and superadmin users can manually trigger penalty applications
- User notifications are sent only to the AMC owner
- Admin notifications are sent to all admin/superadmin users

### Data Protection
- Penalty calculations are logged for audit purposes
- User financial information is handled securely
- Notification content is sanitized to prevent injection attacks

## Troubleshooting

### Common Issues
1. **Penalties not applying**: Check cron job status and database connectivity
2. **Incorrect calculations**: Verify date calculations and interest rate formula
3. **Missing notifications**: Check email service configuration and user email addresses
4. **Database errors**: Review MongoDB connection and schema validation

### Debug Commands
```bash
# Check cron job status
pm2 logs

# Test penalty calculation manually
curl -X POST http://localhost:3000/api/amc/penalties/apply \
  -H "Authorization: Bearer <admin-token>"

# Get overdue records
curl -X GET http://localhost:3000/api/amc/overdue/list \
  -H "Authorization: Bearer <admin-token>"
```

## Support

For issues or questions regarding the AMC Penalty System:
1. Check the application logs for error messages
2. Verify database connectivity and schema
3. Test manual penalty application via API
4. Contact the development team with specific error details
