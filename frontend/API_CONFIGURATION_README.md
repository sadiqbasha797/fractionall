# API Configuration Guide

This guide explains the API configuration for the frontend. The application is now configured to use the production API endpoint.

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

## API Configuration

### Current Configuration

The application is configured to use the production API endpoint:

#### Development Environment:
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://fractionbackend.projexino.com/api',
  productionApiUrl: 'https://fractionbackend.projexino.com/api',
  useProductionApi: true // Always use production API
};
```

#### Production Environment:
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://fractionbackend.projexino.com/api',
  productionApiUrl: 'https://fractionbackend.projexino.com/api',
  useProductionApi: true // Always use production API
};
```

### ConfigService Usage

The `ConfigService` provides methods to get API URLs:

```typescript
import { ConfigService } from './services/config.service';

constructor(private configService: ConfigService) {}

// Get current API base URL
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

## Building the Application

### Development Build:
```bash
ng build
# or
ng serve
```

### Production Build:
```bash
ng build --configuration=production
```

Both builds now use the production API endpoint.

## Testing API Connectivity

You can test if the API is working by checking the health endpoint:

- **Production API**: `https://fractionbackend.projexino.com/api/health` (if available)

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
