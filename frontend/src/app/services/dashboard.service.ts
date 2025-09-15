import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface DashboardStats {
  overview?: {
    totalCars?: number;
    activeCars?: number;
    pendingCars?: number;
    carsThisMonth?: number;
    totalUsers?: number;
    verifiedUsers?: number;
    kycApprovedUsers?: number;
    usersThisMonth?: number;
    totalBookings?: number;
    activeBookings?: number;
    completedBookings?: number;
    bookingsThisMonth?: number;
    bookingsThisWeek?: number;
    totalAmcs?: number;
    activeAmcs?: number;
    expiredAmcs?: number;
    amcsThisMonth?: number;
    totalTickets?: number;
    openTickets?: number;
    closedTickets?: number;
    ticketsThisWeek?: number;
    totalTokens?: number;
    tokensThisMonth?: number;
    totalBookNowTokens?: number;
    bookNowTokensThisMonth?: number;
    totalContracts?: number;
    activeContracts?: number;
    contractsThisMonth?: number;
    totalContactForms?: number;
    unreadContactForms?: number;
    totalRevenue?: number;
  };
  revenue?: {
    total?: number;
    breakdown?: {
      tickets?: number;
      amc?: number;
      tokens?: number;
      bookNowTokens?: number;
    };
    monthlyTrend?: {
      bookings?: Array<{
        _id?: { year?: number; month?: number };
        bookings?: number;
      }>;
      amc?: Array<{
        _id?: { year?: number; month?: number };
        amc?: number;
      }>;
    };
  };
  recentActivity?: {
    bookings?: Array<{
      _id?: string;
      userid?: { name?: string; email?: string };
      carid?: { carname?: string; brand?: string };
      amount?: number;
      status?: string;
      createdAt?: string;
    }>;
    tickets?: Array<{
      _id?: string;
      userid?: { name?: string; email?: string };
      subject?: string;
      status?: string;
      priority?: string;
      createdAt?: string;
    }>;
  };
}

export interface CarDistribution {
  _id: string;
  count: number;
  active: number;
  pending: number;
}

export interface BookingTrend {
  _id: {
    year: number;
    month: number;
    day: number;
  };
  count: number;
  revenue: number;
}

export interface TopPerformingCar {
  _id?: string;
  carname?: string;
  brand?: string;
  totalBookings?: number;
  totalRevenue?: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.baseUrl = this.configService.getBaseUrl();
  }

  // Get dashboard statistics overview
  getDashboardStats(): Observable<{ success: boolean; data: DashboardStats }> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.baseUrl}/dashboard/stats`);
  }

  // Get car distribution by brand
  getCarDistribution(): Observable<{ success: boolean; data: CarDistribution[] }> {
    return this.http.get<{ success: boolean; data: CarDistribution[] }>(`${this.baseUrl}/dashboard/cars/distribution`);
  }

  // Get booking trends (daily for last 30 days)
  getBookingTrends(): Observable<{ success: boolean; data: BookingTrend[] }> {
    return this.http.get<{ success: boolean; data: BookingTrend[] }>(`${this.baseUrl}/dashboard/bookings/trends`);
  }

  // Get top performing cars
  getTopPerformingCars(): Observable<{ success: boolean; data: TopPerformingCar[] }> {
    return this.http.get<{ success: boolean; data: TopPerformingCar[] }>(`${this.baseUrl}/dashboard/cars/top-performing`);
  }
}