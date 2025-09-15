import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private baseUrl: string;

  constructor() {
    // Determine which API URL to use based on environment configuration
    this.baseUrl = environment.useProductionApi ? environment.productionApiUrl : environment.apiUrl;
  }

  /**
   * Get the base API URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the full API URL for a specific endpoint
   * @param endpoint - The API endpoint (e.g., '/auth', '/cars', '/bookings')
   */
  getApiUrl(endpoint: string): string {
    // Ensure endpoint starts with '/'
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Check if currently using production API
   */
  isUsingProductionApi(): boolean {
    return environment.useProductionApi;
  }

  /**
   * Get the current environment name
   */
  getEnvironment(): string {
    return environment.production ? 'production' : 'development';
  }

  /**
   * Switch API URL (useful for testing or dynamic switching)
   * @param useProduction - Whether to use production API
   */
  switchApiUrl(useProduction: boolean): void {
    this.baseUrl = useProduction ? environment.productionApiUrl : environment.apiUrl;
  }
}
