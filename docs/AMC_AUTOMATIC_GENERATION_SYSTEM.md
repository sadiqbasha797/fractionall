# AMC Automatic Generation System

This system automatically generates AMC (Annual Maintenance Contract) records for all active tickets based on the car's AMC settings, and calculates penalties for overdue payments.

## Features

### 🚀 Automatic AMC Generation
- **Frequency**: Every 11 months (configurable)
- **Trigger**: Based on car's `amcperticket` field
- **Due Date**: 30 days from generation
- **Scope**: All active tickets with defined AMC amounts

### 💰 Penalty Calculation
- **Rate**: 18% per year (0.049% daily)
- **Trigger**: After 30 days from due date
- **Frequency**: Daily calculation
- **Scope**: All unpaid AMC amounts past due date

### 🧪 Testing Interface
- **Test Modal**: Select specific tickets for testing
- **Bulk Generation**: Generate AMCs for all active tickets
- **Real-time Results**: Detailed success/error reporting

## Backend APIs

### 1. Generate AMCs for All Active Tickets
```http
POST /api/amc/generate-automatic
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "message": "Automatic AMC generation completed",
    "summary": {
      "totalTickets": 50,
      "successCount": 45,
      "errorCount": 2,
      "skippedCount": 3
    },
    "results": {
      "success": [...],
      "errors": [...],
      "skipped": [...]
    }
  }
}
```

### 2. Calculate Penalties
```http
POST /api/amc/calculate-penalties
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "body": {
    "message": "Penalty calculation completed",
    "summary": {
      "totalAMCs": 20,
      "updatedCount": 15,
      "errorCount": 0
    },
    "results": {
      "updated": [...],
      "errors": [...]
    }
  }
}
```

### 3. Test AMC Generation
```http
POST /api/amc/test-generation
Authorization: Bearer <token>
Content-Type: application/json

{
  "ticketIds": ["ticket1", "ticket2", "ticket3"]
}
```

## Frontend Interface

### Test Modal Features
- **Ticket Selection**: Checkbox-based selection
- **AMC Amount Display**: Shows car's AMC amount per ticket
- **Real-time Results**: Success/error/skipped breakdown
- **Detailed Logging**: Individual ticket processing results

### Action Buttons
1. **Test AMC** (Purple): Open test modal for selected tickets
2. **Generate All** (Green): Generate AMCs for all active tickets
3. **Calculate Penalties** (Red): Calculate penalties for overdue AMCs

## Scheduler Configuration

### Environment Variables
```bash
# API Configuration
API_BASE_URL=http://localhost:3000/api

# Admin Credentials (for scheduler authentication)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### Cron Schedule
- **AMC Generation**: `0 9 1 */11 *` (Every 11 months on 1st day at 9 AM)
- **Penalty Calculation**: `0 10 * * *` (Daily at 10 AM)

### Running the Scheduler

#### Development
```bash
npm run scheduler:dev
```

#### Production
```bash
npm run scheduler
```

#### Manual Testing
```bash
# Test AMC generation
curl -X POST http://localhost:3000/api/amc/generate-automatic \
  -H "Authorization: Bearer <token>"

# Test penalty calculation
curl -X POST http://localhost:3000/api/amc/calculate-penalties \
  -H "Authorization: Bearer <token>"
```

## AMC Data Structure

### AMC Record
```javascript
{
  userid: ObjectId,           // Reference to User
  carid: ObjectId,            // Reference to Car
  ticketid: ObjectId,         // Reference to Ticket
  amcamount: [{
    year: Number,             // AMC year
    amount: Number,           // AMC amount from car.amcperticket
    paid: Boolean,            // Payment status
    duedate: Date,            // Due date (30 days from generation)
    paiddate: Date,           // Payment date
    penality: Number,         // Calculated penalty (18% annually)
    lastPenaltyCalculation: Date
  }],
  createdAt: Date
}
```

### Car Requirements
- `amcperticket`: String (AMC amount per ticket)
- Must be > 0 for AMC generation

### Ticket Requirements
- `ticketstatus`: 'active'
- Must have valid `userid` and `carid` references

## Penalty Calculation Logic

### Formula
```
Daily Penalty Rate = 18% / 365 = 0.049%
Penalty Amount = AMC Amount × Daily Rate × Days Overdue
```

### Example
- AMC Amount: ₹10,000
- Days Overdue: 60
- Penalty: ₹10,000 × 0.00049 × 60 = ₹294

## Error Handling

### Common Issues
1. **Missing AMC Amount**: Car doesn't have `amcperticket` defined
2. **Inactive Tickets**: Ticket status is not 'active'
3. **Existing AMC**: AMC already exists for the ticket
4. **Missing References**: User or car data not found

### Logging
- All operations are logged with detailed information
- Success/error counts are tracked
- Individual ticket processing results are recorded

## Security

### Authentication
- All APIs require admin/superadmin authentication
- Scheduler uses admin credentials for API calls
- Token-based authentication with automatic refresh

### Permissions
- Only admin and superadmin roles can access AMC generation APIs
- Frontend buttons are hidden for non-admin users

## Monitoring

### Logs
- Scheduler operations are logged with timestamps
- API calls include detailed request/response logging
- Error tracking with stack traces

### Metrics
- Success/failure rates
- Processing times
- Penalty calculation accuracy

## Troubleshooting

### Common Issues

1. **Scheduler Not Running**
   - Check if `node-cron` is installed
   - Verify environment variables
   - Check authentication credentials

2. **AMC Generation Failing**
   - Verify car has `amcperticket` defined
   - Check ticket status is 'active'
   - Ensure user/car references are valid

3. **Penalty Calculation Issues**
   - Verify due dates are set correctly
   - Check date calculations
   - Ensure AMC records exist

### Debug Commands
```bash
# Check scheduler status
ps aux | grep amcScheduler

# View logs
tail -f logs/amc-scheduler.log

# Test API endpoints
curl -X POST http://localhost:3000/api/amc/test-generation \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ticketIds": ["test-ticket-id"]}'
```

## Future Enhancements

- [ ] Email notifications for AMC generation
- [ ] SMS alerts for overdue payments
- [ ] Dashboard for AMC statistics
- [ ] Automated payment reminders
- [ ] Integration with payment gateways
- [ ] AMC renewal automation
