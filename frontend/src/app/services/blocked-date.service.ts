import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface BlockedDate {
  _id: string;
  carid: string | {
    _id: string;
    carname: string;
    brandname: string;
  };
  blockedFrom: string;
  blockedTo: string;
  reason: string;
  createdBy: string | {
    _id: string;
    name: string;
    email: string;
  };
  createdByModel: 'Admin' | 'SuperAdmin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedDateResponse {
  status: 'success' | 'failed';
  body: {
    blockedDate?: BlockedDate;
    blockedDates?: BlockedDate[];
    isAvailable?: boolean;
    conflictingBlockedDates?: BlockedDate[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlockedDateService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/blocked-dates');
  }

  // Create a new blocked date
  createBlockedDate(blockedDateData: Partial<BlockedDate>): Observable<BlockedDateResponse> {
    return this.http.post<BlockedDateResponse>(`${this.baseUrl}/`, blockedDateData);
  }

  // Get all blocked dates
  getBlockedDates(carid?: string): Observable<BlockedDateResponse> {
    const params = carid ? `?carid=${carid}` : '';
    return this.http.get<BlockedDateResponse>(`${this.baseUrl}/${params}`);
  }

  // Get blocked dates for a specific car
  getCarBlockedDates(carId: string): Observable<BlockedDateResponse> {
    return this.http.get<BlockedDateResponse>(`${this.baseUrl}/car/${carId}`);
  }

  // Update a blocked date
  updateBlockedDate(id: string, blockedDateData: Partial<BlockedDate>): Observable<BlockedDateResponse> {
    return this.http.put<BlockedDateResponse>(`${this.baseUrl}/${id}`, blockedDateData);
  }

  // Delete a blocked date
  deleteBlockedDate(id: string): Observable<BlockedDateResponse> {
    return this.http.delete<BlockedDateResponse>(`${this.baseUrl}/${id}`);
  }

  // Check date availability
  checkDateAvailability(carId: string, bookingFrom: string, bookingTo: string): Observable<BlockedDateResponse> {
    return this.http.post<BlockedDateResponse>(`${this.baseUrl}/check-availability`, {
      carId,
      bookingFrom,
      bookingTo
    });
  }
}
