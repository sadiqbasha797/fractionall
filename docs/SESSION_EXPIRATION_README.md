# Session Expiration Feature

This document explains the session expiration feature implemented in the frontend application.

## Overview

The session expiration feature automatically detects when a user's session has expired (401/403 HTTP responses) and provides a user-friendly warning before automatically logging them out.

## Components

### 1. Error Interceptor (`services/error.interceptor.ts`)
- Intercepts all HTTP responses
- Catches 401 (Unauthorized) and 403 (Forbidden) responses
- Triggers session expiration handling when these errors occur

### 2. Session Expiration Service (`services/session-expiration.service.ts`)
- Manages session expiration state
- Shows a modal warning to the user
- Handles automatic logout and redirection
- Provides a countdown timer (3 seconds)


## How It Works

1. **Detection**: When any HTTP request returns a 401 or 403 status code, the error interceptor catches it
2. **Warning**: A modal appears with a warning message and countdown timer
3. **Cleanup**: User data is cleared from localStorage
4. **Redirect**: After 3 seconds, the user is automatically redirected to the login page

## Features

- **Visual Warning**: Beautiful modal with countdown timer
- **Automatic Cleanup**: Clears all authentication data
- **Smooth UX**: 3-second delay allows users to see the warning
- **Prevents Multiple Triggers**: Ensures only one session expiration warning is shown at a time
- **Responsive Design**: Works on all screen sizes

## Testing

The session expiration feature will automatically trigger when:
1. Any API call returns a 401 (Unauthorized) response
2. Any API call returns a 403 (Forbidden) response

To test this in development, you can:
1. Temporarily modify your backend to return 401/403 responses
2. Use browser dev tools to simulate network errors
3. Wait for actual session expiration from your authentication system

## Configuration

The session expiration behavior can be customized by modifying:
- Countdown duration in `session-expiration.service.ts`
- Warning message text
- Modal styling
- Redirect destination

## Integration

The feature is automatically active once the interceptors are registered in `app.config.ts`. No additional setup is required for existing components.

## Security Notes

- The feature only triggers on actual 401/403 responses from the server
- All authentication data is properly cleared on logout
- The modal prevents user interaction during the countdown
- No sensitive data is exposed in the warning message
