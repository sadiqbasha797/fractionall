import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Define interfaces for our data models
export interface Booking {
  _id?: string;
  userid: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | string;
  carid: {
    _id: string;
    carname: string;
    brandname: string;
    color: string;
    location: string;
    price: number;
    images: string[];
  } | string;
  bookingFrom: string;
  bookingTo: string;
  comments?: string;
  status: 'accepted' | 'rejected';
  acceptedby?: string;
  acceptedByModel?: 'Admin' | 'SuperAdmin';
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingResponse {
  status: string;
  body: {
    booking?: Booking;
    bookings?: Booking[];
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private baseUrl: string;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.baseUrl = this.configService.getApiUrl('/bookings');
  }

  // Create a new booking
  createBooking(bookingData: Partial<Booking>): Observable<BookingResponse> {
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

  // Update a booking
  updateBooking(id: string, bookingData: Partial<Booking>): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${id}`, bookingData);
  }

  // Delete a booking by ID
  deleteBooking(id: string): Observable<BookingResponse> {
    return this.http.delete<BookingResponse>(`${this.baseUrl}/${id}`);
  }
}
