# Password Reset Functionality

This document explains the password reset feature implemented in the frontend application.

## Overview

The password reset functionality allows users to reset their passwords through a secure email-based verification system. Users receive a 6-digit code via email and can use it to set a new password.

## Components

### 1. AuthService Extensions (`services/auth.service.ts`)
- `requestPasswordReset()` - Sends password reset request to backend
- `resetPassword()` - Resets password using email, code, and new password
- Added interfaces: `ForgotPasswordData`, `ResetPasswordData`, `PasswordResetResponse`

### 2. Forgot Password Component (`forgot-password/`)
- **Route**: `/forgot-password`
- **Purpose**: Allows users to request a password reset code
- **Features**:
  - Email validation
  - Success/error messaging
  - Resend functionality
  - Beautiful UI with loading states

### 3. Reset Password Component (`reset-password/`)
- **Route**: `/reset-password`
- **Purpose**: Allows users to reset password using the code from email
- **Features**:
  - Email, code, and password input
  - Password confirmation
  - Form validation
  - Success confirmation

## User Flow

1. **Request Reset**: User clicks "Forgot your password?" on any login page
2. **Enter Email**: User enters their email address on forgot password page
3. **Receive Code**: User receives 6-digit code via email (15-minute expiry)
4. **Reset Password**: User enters code and new password on reset page
5. **Success**: User is redirected to login with new password

## Integration Points

### Login Pages Updated
- **Login Selection** (`/login-selection`) - Added forgot password link
- **Admin Login** (`/admin-login`) - Added forgot password link
- **Super Admin Login** (`/superadmin-login`) - Added forgot password link

### Routes Added
```typescript
{ path: 'forgot-password', component: ForgotPasswordComponent },
{ path: 'reset-password', component: ResetPasswordComponent }
```

## Backend Integration

The frontend integrates with these backend endpoints:
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with code

## Security Features

- **Email Validation**: Client-side email format validation
- **Code Expiry**: 15-minute expiry for reset codes
- **Password Requirements**: Minimum 6 characters
- **Password Confirmation**: Ensures passwords match
- **Secure Communication**: All requests use HTTPS

## UI/UX Features

- **Consistent Design**: Matches existing login page styling
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Clear error messages for all scenarios
- **Success States**: Confirmation messages and next steps
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper labels and keyboard navigation

## Error Handling

The system handles various error scenarios:
- Invalid email format
- Email not found (security: doesn't reveal if email exists)
- Invalid reset code
- Expired reset code
- Password mismatch
- Network errors

## Testing

To test the password reset flow:

1. **Start the application** and navigate to any login page
2. **Click "Forgot your password?"** link
3. **Enter a valid email** and submit
4. **Check email** for the 6-digit code
5. **Enter code and new password** on reset page
6. **Verify success** and login with new password

## Configuration

The password reset behavior can be customized by modifying:
- Code expiry time (currently 15 minutes)
- Password requirements
- Email template styling
- Success/error messages

## Security Considerations

- Reset codes are single-use and expire quickly
- No sensitive information is exposed in error messages
- All communications are encrypted
- User sessions are properly cleared after password reset

## Future Enhancements

Potential improvements could include:
- SMS-based reset codes
- Security questions as backup
- Password strength indicators
- Account lockout after multiple failed attempts
- Audit logging for password resets
