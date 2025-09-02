import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

export interface Booking {
  _id: string;
  carid: {
    _id: string;
    carname: string;
    brandname: string;
    color: string;
    price: number;
  };
  userid: {
    _id: string;
    name: string;
    email: string;
  };
  bookingFrom: string;
  bookingTo: string;
  comments?: string;
  status: 'accepted' | 'rejected';
  acceptedby?: string;
  acceptedByModel?: 'Admin' | 'SuperAdmin';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:5000/api/bookings';

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

  // Get all bookings for the current user
  getUserBookings(): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('Booking Service Debug:');
    console.log('API URL:', `${this.apiUrl}`);
    console.log('Headers:', headers);
    console.log('Token:', this.authService.getToken());
    return this.http.get<any>(`${this.apiUrl}`, { headers });
  }

  // Get bookings for a specific month
  getUserBookingsForMonth(year: number, month: number): Observable<any> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    return this.http.get<any>(`${this.apiUrl}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Create a new booking
  createBooking(bookingData: {
    carid: string;
    bookingFrom: string;
    bookingTo: string;
    comments?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, bookingData, { headers: this.getAuthHeaders() });
  }

  // Get a specific booking by ID
  getBookingById(bookingId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${bookingId}`, { headers: this.getAuthHeaders() });
  }

  // Delete a booking
  deleteBooking(bookingId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${bookingId}`, { headers: this.getAuthHeaders() });
  }

  // Helper method to check if a date has bookings
  hasBookingsOnDate(bookings: Booking[], date: Date): Booking[] {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const fromDate = new Date(booking.bookingFrom).toISOString().split('T')[0];
      const toDate = new Date(booking.bookingTo).toISOString().split('T')[0];
      return dateStr >= fromDate && dateStr <= toDate;
    });
  }

  // Helper method to get booking status for a specific date
  getBookingStatusForDate(bookings: Booking[], date: Date): 'accepted' | 'rejected' | 'none' {
    const dayBookings = this.hasBookingsOnDate(bookings, date);
    if (dayBookings.length === 0) return 'none';
    
    // If any booking is accepted, show as accepted
    if (dayBookings.some(booking => booking.status === 'accepted')) {
      return 'accepted';
    }
    
    // If all bookings are rejected, show as rejected
    return 'rejected';
  }

  // Helper method to format booking dates
  formatBookingDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Helper method to get booking duration
  getBookingDuration(bookingFrom: string, bookingTo: string): number {
    const from = new Date(bookingFrom);
    const to = new Date(bookingTo);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }
}
