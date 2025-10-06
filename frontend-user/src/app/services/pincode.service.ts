import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PincodeResponse {
  Message: string;
  Status: string;
  PostOffice: {
    Name: string;
    Description: string | null;
    BranchType: string;
    DeliveryStatus: string;
    Circle: string;
    District: string;
    Division: string;
    Region: string;
    Block: string;
    State: string;
    Country: string;
    Pincode: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class PincodeService {
  private readonly PINCODE_API_URL = 'https://api.postalpincode.in/pincode';

  constructor(private http: HttpClient) {}

  // Fallback mapping for common Indian pincodes
  private readonly PINCODE_MAPPING: { [key: string]: { city: string, state: string } } = {
    '110001': { city: 'New Delhi', state: 'Delhi' },
    '110002': { city: 'New Delhi', state: 'Delhi' },
    '110003': { city: 'New Delhi', state: 'Delhi' },
    '400001': { city: 'Mumbai', state: 'Maharashtra' },
    '400002': { city: 'Mumbai', state: 'Maharashtra' },
    '400003': { city: 'Mumbai', state: 'Maharashtra' },
    '560001': { city: 'Bangalore', state: 'Karnataka' },
    '560002': { city: 'Bangalore', state: 'Karnataka' },
    '560003': { city: 'Bangalore', state: 'Karnataka' },
    '600001': { city: 'Chennai', state: 'Tamil Nadu' },
    '600002': { city: 'Chennai', state: 'Tamil Nadu' },
    '600003': { city: 'Chennai', state: 'Tamil Nadu' },
    '700001': { city: 'Kolkata', state: 'West Bengal' },
    '700002': { city: 'Kolkata', state: 'West Bengal' },
    '700003': { city: 'Kolkata', state: 'West Bengal' },
    '380001': { city: 'Ahmedabad', state: 'Gujarat' },
    '380002': { city: 'Ahmedabad', state: 'Gujarat' },
    '380003': { city: 'Ahmedabad', state: 'Gujarat' },
    '500001': { city: 'Hyderabad', state: 'Telangana' },
    '500002': { city: 'Hyderabad', state: 'Telangana' },
    '500003': { city: 'Hyderabad', state: 'Telangana' },
    '110020': { city: 'New Delhi', state: 'Delhi' },
    '110021': { city: 'New Delhi', state: 'Delhi' },
    '110022': { city: 'New Delhi', state: 'Delhi' },
    '110023': { city: 'New Delhi', state: 'Delhi' },
    '110024': { city: 'New Delhi', state: 'Delhi' },
    '110025': { city: 'New Delhi', state: 'Delhi' },
    '110026': { city: 'New Delhi', state: 'Delhi' },
    '110027': { city: 'New Delhi', state: 'Delhi' },
    '110028': { city: 'New Delhi', state: 'Delhi' },
    '110029': { city: 'New Delhi', state: 'Delhi' },
    '110030': { city: 'New Delhi', state: 'Delhi' },
    '110031': { city: 'New Delhi', state: 'Delhi' },
    '110032': { city: 'New Delhi', state: 'Delhi' },
    '110033': { city: 'New Delhi', state: 'Delhi' },
    '110034': { city: 'New Delhi', state: 'Delhi' },
    '110035': { city: 'New Delhi', state: 'Delhi' },
    '110036': { city: 'New Delhi', state: 'Delhi' },
    '110037': { city: 'New Delhi', state: 'Delhi' },
    '110038': { city: 'New Delhi', state: 'Delhi' },
    '110039': { city: 'New Delhi', state: 'Delhi' },
    '110040': { city: 'New Delhi', state: 'Delhi' },
    '110041': { city: 'New Delhi', state: 'Delhi' },
    '110042': { city: 'New Delhi', state: 'Delhi' },
    '110043': { city: 'New Delhi', state: 'Delhi' },
    '110044': { city: 'New Delhi', state: 'Delhi' },
    '110045': { city: 'New Delhi', state: 'Delhi' },
    '110046': { city: 'New Delhi', state: 'Delhi' },
    '110047': { city: 'New Delhi', state: 'Delhi' },
    '110048': { city: 'New Delhi', state: 'Delhi' },
    '110049': { city: 'New Delhi', state: 'Delhi' },
    '110050': { city: 'New Delhi', state: 'Delhi' },
    '110051': { city: 'New Delhi', state: 'Delhi' },
    '110052': { city: 'New Delhi', state: 'Delhi' },
    '110053': { city: 'New Delhi', state: 'Delhi' },
    '110054': { city: 'New Delhi', state: 'Delhi' },
    '110055': { city: 'New Delhi', state: 'Delhi' },
    '110056': { city: 'New Delhi', state: 'Delhi' },
    '110057': { city: 'New Delhi', state: 'Delhi' },
    '110058': { city: 'New Delhi', state: 'Delhi' },
    '110059': { city: 'New Delhi', state: 'Delhi' },
    '110060': { city: 'New Delhi', state: 'Delhi' },
    '110061': { city: 'New Delhi', state: 'Delhi' },
    '110062': { city: 'New Delhi', state: 'Delhi' },
    '110063': { city: 'New Delhi', state: 'Delhi' },
    '110064': { city: 'New Delhi', state: 'Delhi' },
    '110065': { city: 'New Delhi', state: 'Delhi' },
    '110066': { city: 'New Delhi', state: 'Delhi' },
    '110067': { city: 'New Delhi', state: 'Delhi' },
    '110068': { city: 'New Delhi', state: 'Delhi' },
    '110069': { city: 'New Delhi', state: 'Delhi' },
    '110070': { city: 'New Delhi', state: 'Delhi' },
    '110071': { city: 'New Delhi', state: 'Delhi' },
    '110072': { city: 'New Delhi', state: 'Delhi' },
    '110073': { city: 'New Delhi', state: 'Delhi' },
    '110074': { city: 'New Delhi', state: 'Delhi' },
    '110075': { city: 'New Delhi', state: 'Delhi' },
    '110076': { city: 'New Delhi', state: 'Delhi' },
    '110077': { city: 'New Delhi', state: 'Delhi' },
    '110078': { city: 'New Delhi', state: 'Delhi' },
    '110079': { city: 'New Delhi', state: 'Delhi' },
    '110080': { city: 'New Delhi', state: 'Delhi' },
    '110081': { city: 'New Delhi', state: 'Delhi' },
    '110082': { city: 'New Delhi', state: 'Delhi' },
    '110083': { city: 'New Delhi', state: 'Delhi' },
    '110084': { city: 'New Delhi', state: 'Delhi' },
    '110085': { city: 'New Delhi', state: 'Delhi' },
    '110086': { city: 'New Delhi', state: 'Delhi' },
    '110087': { city: 'New Delhi', state: 'Delhi' },
    '110088': { city: 'New Delhi', state: 'Delhi' },
    '110089': { city: 'New Delhi', state: 'Delhi' },
    '110090': { city: 'New Delhi', state: 'Delhi' },
    '110091': { city: 'New Delhi', state: 'Delhi' },
    '110092': { city: 'New Delhi', state: 'Delhi' },
    '110093': { city: 'New Delhi', state: 'Delhi' },
    '110094': { city: 'New Delhi', state: 'Delhi' },
    '110095': { city: 'New Delhi', state: 'Delhi' },
    '110096': { city: 'New Delhi', state: 'Delhi' },
    '110097': { city: 'New Delhi', state: 'Delhi' },
    '110098': { city: 'New Delhi', state: 'Delhi' },
    '110099': { city: 'New Delhi', state: 'Delhi' },
    '110100': { city: 'New Delhi', state: 'Delhi' }
  };

  /**
   * Fetch location details by pincode
   * @param pincode - 6-digit Indian pincode
   * @returns Observable with location data
   */
  getLocationByPincode(pincode: string): Observable<{city: string, state: string, district: string} | null> {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return of(null);
    }

    // First check if we have a fallback mapping
    if (this.PINCODE_MAPPING[pincode]) {
      const mapping = this.PINCODE_MAPPING[pincode];
      return of({
        city: mapping.city,
        state: mapping.state,
        district: mapping.city
      });
    }
    
    return this.http.get<PincodeResponse[]>(`${this.PINCODE_API_URL}/${pincode}`).pipe(
      map(response => {
        if (response && Array.isArray(response) && response.length > 0 && response[0].Status === 'Success') {
          const postOfficeData = response[0].PostOffice;
          if (postOfficeData && postOfficeData.length > 0) {
            const locationData = postOfficeData[0]; // Use first post office data
            return {
              city: locationData.District || locationData.Name || '',
              state: locationData.State || '',
              district: locationData.District || ''
            };
          }
        }
        return null;
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  /**
   * Get formatted location string for display
   * @param pincode - 6-digit Indian pincode
   * @returns Observable with formatted location string
   */
  getFormattedLocation(pincode: string): Observable<string> {
    return this.getLocationByPincode(pincode).pipe(
      map(location => {
        if (location) {
          return `${location.city}, ${location.state}`;
        }
        return '';
      })
    );
  }
}
