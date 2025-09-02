import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define interfaces for our data models
export interface Booking {
  _id?: string;
  userid: string;
  carid: string;
  bookingDate: string;
  bookingAmount: number;
  status: string;
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingResponse {
  status: string;
  body: {
    booking: Booking;
    bookings: Booking[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private baseUrl = 'http://localhost:5000/api/bookings';

  constructor(private http: HttpClient) { }

  // Create a new booking
  createBooking(bookingData: Booking): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/`, bookingData);
  }

  // Get all bookings
  getBookings(): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/`);
  }

  // Get a booking by ID
  getBookingById(id: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/${id}`);
  }

  // Update booking status
  updateBookingStatus(id: string, status: string): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${id}/status`, { status });
  }

  // Delete a booking by ID
  deleteBooking(id: string): Observable<BookingResponse> {
    return this.http.delete<BookingResponse>(`${this.baseUrl}/${id}`);
  }
}