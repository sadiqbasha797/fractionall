# API Configuration Guide

This guide explains how to configure the frontend to use different API endpoints (localhost vs production).

## Configuration Files

### Environment Files

1. **`src/environments/environment.ts`** - Development environment
2. **`src/environments/environment.prod.ts`** - Production environment

### Configuration Service

The `ConfigService` (`src/app/services/config.service.ts`) handles API URL management and provides methods to:
- Get the current base API URL
- Get full API URLs for specific endpoints
- Check if using production API
- Switch between APIs dynamically

## How to Switch APIs

### Method 1: Environment Configuration (Recommended)

#### For Development (localhost):
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  productionApiUrl: 'https://fractionbackend.projexino.com/api',
  useProductionApi: false // Set to false for localhost
};
```

#### For Production:
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://fractionbackend.projexino.com/api',
  productionApiUrl: 'https://fractionbackend.projexino.com/api',
  useProductionApi: true // Always true in production
};
```

### Method 2: Dynamic Switching (For Testing)

You can also switch APIs dynamically in your components:

```typescript
import { ConfigService } from './services/config.service';

constructor(private configService: ConfigService) {}

// Switch to production API
switchToProduction() {
  this.configService.switchApiUrl(true);
}

// Switch to localhost API
switchToLocalhost() {
  this.configService.switchApiUrl(false);
}

// Check current API
getCurrentApi() {
  return this.configService.getBaseUrl();
}
```

## Available API Endpoints

All services now use the ConfigService and support both APIs:

- **AuthService**: `/auth`
- **CarService**: `/cars`
- **BookingService**: `/bookings`
- **UserService**: `/users`
- **TokenService**: `/tokens`
- **AmcService**: `/amcs`
- **ContactService**: `/contact`
- **ContractService**: `/contracts`
- **KycService**: `/kyc`
- **TicketService**: `/tickets`
- **BookNowTokenService**: `/book-now-tokens`

## Building for Different Environments

### Development Build (localhost):
```bash
ng build
# or
ng serve
```

### Production Build (production API):
```bash
ng build --configuration=production
```

## Testing API Connectivity

You can test if the APIs are working by checking the health endpoints:

- **Localhost**: `http://localhost:5000/api/health` (if available)
- **Production**: `https://fractionbackend.projexino.com/api/health` (if available)

## Troubleshooting

1. **CORS Issues**: Make sure your backend allows requests from your frontend domain
2. **Network Issues**: Check if the production API is accessible from your network
3. **Authentication**: Ensure tokens are valid for the API you're using
4. **Environment Variables**: Verify the environment configuration is correct

## Service Updates

All services have been updated to use the ConfigService:

- ✅ AuthService
- ✅ CarService  
- ✅ BookingService
- ✅ UserService
- ✅ TokenService
- ✅ AmcService
- ✅ ContactService
- ✅ ContractService
- ✅ KycService
- ✅ TicketService
- ✅ BookNowTokenService

Each service now automatically uses the correct API URL based on the environment configuration.
