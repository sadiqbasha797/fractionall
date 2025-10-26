import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

export interface LocationSuggestion {
  display_name: string;
  name: string;
  state: string;
  country: string;
  lat: string;
  lon: string;
  type: string;
  isSelected?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LocationSuggestionsService {
  private readonly NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: LocationSuggestion[], timestamp: number }>();
  
  private searchSubject = new BehaviorSubject<string>('');
  public searchResults$ = this.searchSubject.pipe(
    debounceTime(200), // Wait 200ms after user stops typing for better responsiveness
    distinctUntilChanged(),
    switchMap(query => this.searchLocations(query))
  );

  constructor(private http: HttpClient) {}

  /**
   * Search for location suggestions based on query
   * @param query - The search query
   * @returns Observable with location suggestions
   */
  searchLocations(query: string): Observable<LocationSuggestion[]> {
    if (!query || query.trim().length < 1) {
      return of([]);
    }

    const trimmedQuery = query.trim();
    
    // For single character searches, use only fallback suggestions for better performance
    if (trimmedQuery.length === 1) {
      return of(this.getFallbackSuggestionsForQuery(trimmedQuery));
    }
    
    // Check cache first
    const cached = this.getCachedResult(trimmedQuery);
    if (cached) {
      return of(cached);
    }

    // Try multiple search strategies for better results
    const searchQueries = this.generateSearchQueries(trimmedQuery);
    
    // Use the first search query for now, but we could implement multiple searches
    const params = {
      q: searchQueries[0],
      countrycodes: 'in', // Limit to India
      format: 'json',
      addressdetails: '1',
      limit: '15', // Increased limit for better selection
      dedupe: '1',
      featuretype: 'city,town,village,suburb' // Focus on populated places
    };

    return this.http.get<LocationSuggestion[]>(this.NOMINATIM_API_URL, { params }).pipe(
      map(response => {
        const suggestions = this.processSuggestions(response, trimmedQuery);
        this.cacheResult(trimmedQuery, suggestions);
        return suggestions;
      }),
      catchError(error => {
        console.error('Error fetching location suggestions:', error);
        // Return fallback suggestions based on partial matching
        return of(this.getFallbackSuggestionsForQuery(trimmedQuery));
      })
    );
  }

  /**
   * Generate multiple search queries for better results
   */
  private generateSearchQueries(query: string): string[] {
    const queries = [query];
    
    // Add common variations
    if (query.length >= 3) {
      // Add "city" suffix for better results
      queries.push(`${query} city`);
      queries.push(`${query} town`);
      
      // Add state-specific searches for major states
      const majorStates = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Andhra Pradesh', 'Kerala', 'Punjab', 'Haryana', 'Delhi', 'Madhya Pradesh'];
      majorStates.forEach(state => {
        queries.push(`${query}, ${state}`);
      });
    }
    
    return queries;
  }

  /**
   * Process raw API response to create clean suggestions
   */
  private processSuggestions(response: any[], originalQuery: string): LocationSuggestion[] {
    if (!Array.isArray(response)) {
      return [];
    }

    const suggestions = response
      .map(item => ({
        display_name: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        state: item.address?.state || '',
        country: item.address?.country || 'India',
        lat: item.lat,
        lon: item.lon,
        type: item.type || 'city'
      }))
      .filter(item => 
        item.name && 
        item.country === 'India' && 
        (item.type === 'city' || item.type === 'town' || item.type === 'village' || item.type === 'suburb')
      );

    // Sort by relevance to the original query
    return this.sortSuggestionsByRelevance(suggestions, originalQuery).slice(0, 10);
  }

  /**
   * Sort suggestions by relevance to the search query
   */
  private sortSuggestionsByRelevance(suggestions: LocationSuggestion[], query: string): LocationSuggestion[] {
    const queryLower = query.toLowerCase();
    
    return suggestions.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match gets highest priority
      if (aName === queryLower) return -1;
      if (bName === queryLower) return 1;
      
      // Starts with query gets second priority
      const aStartsWith = aName.startsWith(queryLower);
      const bStartsWith = bName.startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;
      
      // Contains query gets third priority
      const aContains = aName.includes(queryLower);
      const bContains = bName.includes(queryLower);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;
      
      // Shorter names get priority for same relevance
      if (aContains && bContains) {
        return aName.length - bName.length;
      }
      
      // Alphabetical order as fallback
      return aName.localeCompare(bName);
    });
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(query: string): LocationSuggestion[] | null {
    const cached = this.cache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache the result
   */
  private cacheResult(query: string, data: LocationSuggestion[]): void {
    this.cache.set(query.toLowerCase(), {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Trigger search for location suggestions
   */
  search(query: string): void {
    this.searchSubject.next(query);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchSubject.next('');
  }

  /**
   * Get formatted location name for display
   */
  getFormattedLocation(suggestion: LocationSuggestion): string {
    const parts = [suggestion.name];
    if (suggestion.state && suggestion.state !== suggestion.name) {
      parts.push(suggestion.state);
    }
    return parts.join(', ');
  }

  /**
   * Check if query looks like a pincode
   */
  isPincode(query: string): boolean {
    return /^\d{6}$/.test(query.trim());
  }

  /**
   * Get fallback suggestions for common Indian cities
   */
  getFallbackSuggestions(): LocationSuggestion[] {
    return [
      { display_name: 'Mumbai, Maharashtra, India', name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: '19.0760', lon: '72.8777', type: 'city' },
      { display_name: 'Delhi, India', name: 'Delhi', state: 'Delhi', country: 'India', lat: '28.7041', lon: '77.1025', type: 'city' },
      { display_name: 'Bangalore, Karnataka, India', name: 'Bangalore', state: 'Karnataka', country: 'India', lat: '12.9716', lon: '77.5946', type: 'city' },
      { display_name: 'Chennai, Tamil Nadu, India', name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: '13.0827', lon: '80.2707', type: 'city' },
      { display_name: 'Kolkata, West Bengal, India', name: 'Kolkata', state: 'West Bengal', country: 'India', lat: '22.5726', lon: '88.3639', type: 'city' },
      { display_name: 'Hyderabad, Telangana, India', name: 'Hyderabad', state: 'Telangana', country: 'India', lat: '17.3850', lon: '78.4867', type: 'city' },
      { display_name: 'Pune, Maharashtra, India', name: 'Pune', state: 'Maharashtra', country: 'India', lat: '18.5204', lon: '73.8567', type: 'city' },
      { display_name: 'Ahmedabad, Gujarat, India', name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: '23.0225', lon: '72.5714', type: 'city' }
    ];
  }

  /**
   * Get fallback suggestions based on partial query matching
   */
  private getFallbackSuggestionsForQuery(query: string): LocationSuggestion[] {
    const allCities = [
      { display_name: 'Mumbai, Maharashtra, India', name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: '19.0760', lon: '72.8777', type: 'city' },
      { display_name: 'Delhi, India', name: 'Delhi', state: 'Delhi', country: 'India', lat: '28.7041', lon: '77.1025', type: 'city' },
      { display_name: 'Bangalore, Karnataka, India', name: 'Bangalore', state: 'Karnataka', country: 'India', lat: '12.9716', lon: '77.5946', type: 'city' },
      { display_name: 'Chennai, Tamil Nadu, India', name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: '13.0827', lon: '80.2707', type: 'city' },
      { display_name: 'Kolkata, West Bengal, India', name: 'Kolkata', state: 'West Bengal', country: 'India', lat: '22.5726', lon: '88.3639', type: 'city' },
      { display_name: 'Hyderabad, Telangana, India', name: 'Hyderabad', state: 'Telangana', country: 'India', lat: '17.3850', lon: '78.4867', type: 'city' },
      { display_name: 'Pune, Maharashtra, India', name: 'Pune', state: 'Maharashtra', country: 'India', lat: '18.5204', lon: '73.8567', type: 'city' },
      { display_name: 'Ahmedabad, Gujarat, India', name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: '23.0225', lon: '72.5714', type: 'city' },
      { display_name: 'Jaipur, Rajasthan, India', name: 'Jaipur', state: 'Rajasthan', country: 'India', lat: '26.9124', lon: '75.7873', type: 'city' },
      { display_name: 'Surat, Gujarat, India', name: 'Surat', state: 'Gujarat', country: 'India', lat: '21.1702', lon: '72.8311', type: 'city' },
      { display_name: 'Lucknow, Uttar Pradesh, India', name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: '26.8467', lon: '80.9462', type: 'city' },
      { display_name: 'Kanpur, Uttar Pradesh, India', name: 'Kanpur', state: 'Uttar Pradesh', country: 'India', lat: '26.4499', lon: '80.3319', type: 'city' },
      { display_name: 'Nagpur, Maharashtra, India', name: 'Nagpur', state: 'Maharashtra', country: 'India', lat: '21.1458', lon: '79.0882', type: 'city' },
      { display_name: 'Indore, Madhya Pradesh, India', name: 'Indore', state: 'Madhya Pradesh', country: 'India', lat: '22.7196', lon: '75.8577', type: 'city' },
      { display_name: 'Thane, Maharashtra, India', name: 'Thane', state: 'Maharashtra', country: 'India', lat: '19.2183', lon: '72.9781', type: 'city' },
      { display_name: 'Bhopal, Madhya Pradesh, India', name: 'Bhopal', state: 'Madhya Pradesh', country: 'India', lat: '23.2599', lon: '77.4126', type: 'city' },
      { display_name: 'Visakhapatnam, Andhra Pradesh, India', name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', lat: '17.6868', lon: '83.2185', type: 'city' },
      { display_name: 'Pimpri-Chinchwad, Maharashtra, India', name: 'Pimpri-Chinchwad', state: 'Maharashtra', country: 'India', lat: '18.6298', lon: '73.7997', type: 'city' },
      { display_name: 'Patna, Bihar, India', name: 'Patna', state: 'Bihar', country: 'India', lat: '25.5941', lon: '85.1376', type: 'city' },
      { display_name: 'Vadodara, Gujarat, India', name: 'Vadodara', state: 'Gujarat', country: 'India', lat: '22.3072', lon: '73.1812', type: 'city' },
      { display_name: 'Gurgaon, Haryana, India', name: 'Gurgaon', state: 'Haryana', country: 'India', lat: '28.4595', lon: '77.0266', type: 'city' },
      { display_name: 'Noida, Uttar Pradesh, India', name: 'Noida', state: 'Uttar Pradesh', country: 'India', lat: '28.5355', lon: '77.3910', type: 'city' },
      { display_name: 'Coimbatore, Tamil Nadu, India', name: 'Coimbatore', state: 'Tamil Nadu', country: 'India', lat: '11.0168', lon: '76.9558', type: 'city' },
      { display_name: 'Kochi, Kerala, India', name: 'Kochi', state: 'Kerala', country: 'India', lat: '9.9312', lon: '76.2673', type: 'city' },
      { display_name: 'Chandigarh, India', name: 'Chandigarh', state: 'Chandigarh', country: 'India', lat: '30.7333', lon: '76.7794', type: 'city' },
      { display_name: 'Mysore, Karnataka, India', name: 'Mysore', state: 'Karnataka', country: 'India', lat: '12.2958', lon: '76.6394', type: 'city' },
      { display_name: 'Mangalore, Karnataka, India', name: 'Mangalore', state: 'Karnataka', country: 'India', lat: '12.9141', lon: '74.8560', type: 'city' },
      { display_name: 'Vijayawada, Andhra Pradesh, India', name: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', lat: '16.5062', lon: '80.6480', type: 'city' },
      { display_name: 'Bhubaneswar, Odisha, India', name: 'Bhubaneswar', state: 'Odisha', country: 'India', lat: '20.2961', lon: '85.8245', type: 'city' },
      { display_name: 'Dehradun, Uttarakhand, India', name: 'Dehradun', state: 'Uttarakhand', country: 'India', lat: '30.3165', lon: '78.0322', type: 'city' }
    ];

    const queryLower = query.toLowerCase();
    
    // Filter cities that match the query
    const matchingCities = allCities.filter(city => 
      city.name.toLowerCase().includes(queryLower) ||
      city.state.toLowerCase().includes(queryLower)
    );

    // Sort by relevance
    return this.sortSuggestionsByRelevance(matchingCities, query).slice(0, 8);
  }
}
