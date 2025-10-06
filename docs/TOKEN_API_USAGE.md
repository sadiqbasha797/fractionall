# Token API Usage Guide

## Overview
Users can now create tokens for themselves using their authentication token. The system automatically associates the token with the authenticated user.

## Creating a Token (User)

### Endpoint
```
POST /api/tokens
```

### Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Request Body (User)
```json
{
  "carid": "64f8a1b2c3d4e5f6a7b8c9d0",
  "customtokenid": "USER001_2024",
  "amountpaid": 1500,
  "expirydate": "2024-12-31T23:59:59.000Z",
  "status": "active"
}
```

**Note:** For users, the `userid` field is automatically set from their authentication token, so it's not required in the request body.

### Request Body (Admin/SuperAdmin)
```json
{
  "carid": "64f8a1b2c3d4e5f6a7b8c9d0",
  "customtokenid": "ADMIN001_2024",
  "userid": "64f8a1b2c3d4e5f6a7b8c9d1",
  "amountpaid": 1500,
  "expirydate": "2024-12-31T23:59:59.000Z",
  "status": "active"
}
```

**Note:** For admin/superadmin users, the `userid` field is required to specify which user the token is for.

## Response Format

### Success Response (201)
```json
{
  "status": "success",
  "body": {
    "token": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "carid": "64f8a1b2c3d4e5f6a7b8c9d0",
      "customtokenid": "USER001_2024",
      "userid": "64f8a1b2c3d4e5f6a7b8c9d3",
      "amountpaid": 1500,
      "date": "2024-01-15T10:30:00.000Z",
      "expirydate": "2024-12-31T23:59:59.000Z",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Token created successfully"
}
```

### Error Responses

#### Car Not Found (404)
```json
{
  "status": "failed",
  "body": {},
  "message": "Car not found"
}
```

#### No Available Tokens (400)
```json
{
  "status": "failed",
  "body": {},
  "message": "No available tokens for this car"
}
```

#### Duplicate Custom Token ID (400)
```json
{
  "status": "failed",
  "body": {},
  "message": "Token with this custom ID already exists"
}
```

#### Unauthorized (403)
```json
{
  "status": "failed",
  "body": {},
  "message": "Not authorized to create tokens"
}
```

## Important Notes

1. **User Authentication**: Users must be authenticated with a valid JWT token
2. **Automatic User Assignment**: The `userid` is automatically set from the user's authentication token
3. **Car Validation**: The system checks if the specified car exists and has available tokens
4. **Token Availability**: Creating a token decrements the available token count for the car
5. **Custom Token ID**: Must be unique across the system
6. **Required Fields**: `carid`, `customtokenid`, `amountpaid`, and `expirydate` are required

## Example Usage with JavaScript

```javascript
// Create a token for the authenticated user
const createUserToken = async () => {
  try {
    const response = await fetch('/api/tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        carid: '64f8a1b2c3d4e5f6a7b8c9d0',
        customtokenid: 'USER001_2024',
        amountpaid: 1500,
        expirydate: '2024-12-31T23:59:59.000Z',
        status: 'active'
      })
    });

    const result = await response.json();
    if (result.status === 'success') {
      console.log('Token created:', result.body.token);
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

## Security Features

1. **Role-based Access**: Users can only create tokens for themselves
2. **Token Ownership**: Users can only view and update their own tokens
3. **Admin Override**: Admin and SuperAdmin users can create tokens for any user
4. **Authentication Required**: All token operations require valid authentication
