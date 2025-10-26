# Token Refund 500 Error Fix

## Problem Analysis
The frontend was getting a 500 Internal Server Error when trying to process token refunds via the API endpoint `/api/payments/refund/token/:tokenId`.

## Root Causes Identified

### 1. **Token Model Schema Issue**
- The `refundDetails` field in the token model was not properly structured as a nested object
- This caused issues when trying to access `token.refundDetails.refundId` in the controller

### 2. **Missing Error Handling**
- No validation for missing `razorpayPaymentId` 
- No error handling for Razorpay API failures
- No null checks for `refundDetails` object

### 3. **Insufficient Logging**
- Limited debugging information for troubleshooting refund failures

## Fixes Implemented

### 1. **Fixed Token Model Schema**
**File:** `backend/models/token.js`

```javascript
// Before (problematic):
refundDetails: {
    refundId: String,
    refundAmount: Number,
    // ... other fields
}

// After (fixed):
refundDetails: {
    type: {
        refundId: String,
        refundAmount: Number,
        refundStatus: {
            type: String,
            enum: ['none', 'initiated', 'processed', 'successful', 'failed'],
            default: 'none'
        },
        // ... other fields
    },
    default: {}
}
```

### 2. **Enhanced Payment Controller Error Handling**
**File:** `backend/controllers/paymentController.js`

#### Added Payment ID Validation:
```javascript
const paymentIdToUse = paymentId || token.razorpayPaymentId;

if (!paymentIdToUse) {
  return res.status(400).json({
    success: false,
    message: 'Payment ID is required for refund processing'
  });
}
```

#### Added Razorpay API Error Handling:
```javascript
let refund;
try {
  refund = await razorpay.payments.refund(refundOptions.payment_id, refundOptions);
} catch (razorpayError) {
  console.error('Razorpay refund error:', razorpayError);
  return res.status(400).json({
    success: false,
    message: 'Failed to process refund with Razorpay',
    error: razorpayError.message || 'Razorpay API error'
  });
}
```

#### Added RefundDetails Initialization:
```javascript
// Initialize refundDetails if it doesn't exist
if (!token.refundDetails) {
  token.refundDetails = {};
}

token.refundDetails.refundId = refund.id;
token.refundDetails.refundAmount = refund.amount / 100;
token.refundDetails.refundStatus = 'processed';
token.refundDetails.refundProcessedAt = new Date();
token.refundDetails.refundReason = reason || 'Token refund processed';
```

#### Enhanced Logging:
```javascript
console.log('Processing refund with options:', refundOptions);
```

## API Endpoint Details

### Route:
```
POST /api/payments/refund/:tokenType/:tokenId
```

### Parameters:
- `tokenType`: 'token' or 'booknow-token'
- `tokenId`: MongoDB ObjectId of the token

### Request Body:
```json
{
  "paymentId": "pay_xxxxx", // Optional, will use token's razorpayPaymentId if not provided
  "refundAmount": 1000,     // Optional, will use token's amountpaid if not provided
  "reason": "Customer request" // Optional
}
```

### Response (Success):
```json
{
  "success": true,
  "message": "Token refund processed successfully",
  "refund": {
    "id": "rfnd_xxxxx",
    "amount": 1000,
    "status": "processed",
    "tokenId": "68e443bc1f8e866fec65ce54",
    "tokenStatus": "refund_processed"
  }
}
```

### Response (Error):
```json
{
  "success": false,
  "message": "Failed to process refund with Razorpay",
  "error": "Payment not found"
}
```

## Error Scenarios Handled

### 1. **Missing Payment ID**
- **Error**: "Payment ID is required for refund processing"
- **Status**: 400 Bad Request

### 2. **Razorpay API Failures**
- **Error**: "Failed to process refund with Razorpay"
- **Status**: 400 Bad Request
- **Details**: Includes specific Razorpay error message

### 3. **Token Not Found**
- **Error**: "Token not found"
- **Status**: 404 Not Found

### 4. **Invalid Token Status**
- **Error**: "Token is not in refund initiated status"
- **Status**: 400 Bad Request

### 5. **Unauthorized Access**
- **Error**: "Not authorized to process refunds"
- **Status**: 403 Forbidden

## Testing Recommendations

### 1. **Test Valid Refund**
- Use a token with `status: 'refund_initiated'`
- Provide valid `razorpayPaymentId`
- Verify successful refund processing

### 2. **Test Missing Payment ID**
- Use a token without `razorpayPaymentId`
- Don't provide `paymentId` in request body
- Verify 400 error response

### 3. **Test Invalid Razorpay Payment**
- Use an invalid or already refunded payment ID
- Verify Razorpay error handling

### 4. **Test Authorization**
- Test with non-admin/superadmin user
- Verify 403 error response

## Frontend Integration

The frontend should handle the improved error responses:

```typescript
this.paymentService.processTokenRefund(refund.tokenType, refund._id, refundData).subscribe({
  next: (response) => {
    if (response.success) {
      alert('Token refund processed successfully!');
      // Reload pending refunds
      this.loadPendingTokenRefunds();
    }
  },
  error: (error) => {
    console.error('Error processing token refund:', error);
    const errorMessage = error.error?.message || 'Failed to process refund';
    alert(`Refund failed: ${errorMessage}`);
  }
});
```

## Monitoring and Debugging

### 1. **Server Logs**
- Check for "Processing refund with options:" logs
- Monitor Razorpay API error logs
- Track refund processing success/failure rates

### 2. **Database Verification**
- Verify `refundDetails` object is properly saved
- Check token status updates
- Monitor refund amount accuracy

### 3. **Razorpay Dashboard**
- Verify refunds appear in Razorpay dashboard
- Check refund status and processing times
- Monitor any Razorpay API issues

## Conclusion

The fixes address the root causes of the 500 error by:
1. ✅ Properly structuring the token model schema
2. ✅ Adding comprehensive error handling
3. ✅ Validating required fields before processing
4. ✅ Providing clear error messages for debugging
5. ✅ Ensuring robust refund processing flow

The token refund functionality should now work reliably with proper error handling and user feedback.
