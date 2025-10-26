import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/blocked-dates`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // Helper method to get headers with authentication token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get blocked dates for a specific car (Public API)
  getCarBlockedDates(carId: string): Observable<BlockedDateResponse> {
    return this.http.get<BlockedDateResponse>(`${this.apiUrl}/car/${carId}`);
  }

  // Check date availability for a specific car and date range (Public API)
  checkDateAvailability(carId: string, bookingFrom: string, bookingTo: string): Observable<BlockedDateResponse> {
    return this.http.post<BlockedDateResponse>(`${this.apiUrl}/check-availability`, {
      carId,
      bookingFrom,
      bookingTo
    });
  }

  // Helper method to check if a date is blocked
  isDateBlocked(blockedDates: BlockedDate[], date: Date): boolean {
    const dateStr = this.formatDateForComparison(date);
    return blockedDates.some(blockedDate => {
      const fromDate = this.formatDateForComparison(new Date(blockedDate.blockedFrom));
      const toDate = this.formatDateForComparison(new Date(blockedDate.blockedTo));
      return dateStr >= fromDate && dateStr <= toDate && blockedDate.isActive;
    });
  }

  // Helper method to get blocked date info for a specific date
  getBlockedDateInfo(blockedDates: BlockedDate[], date: Date): BlockedDate | null {
    const dateStr = this.formatDateForComparison(date);
    return blockedDates.find(blockedDate => {
      const fromDate = this.formatDateForComparison(new Date(blockedDate.blockedFrom));
      const toDate = this.formatDateForComparison(new Date(blockedDate.blockedTo));
      return dateStr >= fromDate && dateStr <= toDate && blockedDate.isActive;
    }) || null;
  }

  // Helper method to check if a date range has any blocked dates
  hasBlockedDatesInRange(blockedDates: BlockedDate[], startDate: Date, endDate: Date): BlockedDate[] {
    const startStr = this.formatDateForComparison(startDate);
    const endStr = this.formatDateForComparison(endDate);
    
    return blockedDates.filter(blockedDate => {
      const fromDate = this.formatDateForComparison(new Date(blockedDate.blockedFrom));
      const toDate = this.formatDateForComparison(new Date(blockedDate.blockedTo));
      
      // Check if the blocked date range overlaps with the requested range
      return blockedDate.isActive && (
        (fromDate <= endStr && toDate >= startStr)
      );
    });
  }

  // Helper method to format date for comparison (avoiding timezone issues)
  private formatDateForComparison(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper method to format blocked date for display
  formatBlockedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper method to get blocked date duration
  getBlockedDateDuration(blockedFrom: string, blockedTo: string): number {
    const from = new Date(blockedFrom);
    const to = new Date(blockedTo);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }
}
