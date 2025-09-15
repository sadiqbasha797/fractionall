import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

// Add new interfaces for our additional data
export interface UserGrowthData {
  date: string;
  count: number;
}

export interface TicketStatusDistribution {
  status: string;
  count: number;
}

export interface RevenueVsBookings {
  bookings: number;
  revenue: number;
}

export interface ContractStatus {
  status: string;
  count: number;
}

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
      ticketcustomid?: string;
      ticketprice?: number;
      pricepaid?: number;
      pendingamount?: number;
      ticketstatus?: 'active' | 'expired' | 'cancelled';
      comments?: string;
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

  // Get user growth data (monthly for last 6 months)
  getUserGrowth(): Observable<{ success: boolean; data: UserGrowthData[] }> {
    return this.http.get<{ success: boolean; data: UserGrowthData[] }>(`${this.baseUrl}/dashboard/users/growth`);
  }

  // Get ticket status distribution
  getTicketStatusDistribution(): Observable<{ success: boolean; data: TicketStatusDistribution[] }> {
    return this.http.get<{ success: boolean; data: TicketStatusDistribution[] }>(`${this.baseUrl}/dashboard/tickets/status-distribution`);
  }

  // Get revenue vs bookings correlation
  getRevenueVsBookings(): Observable<{ success: boolean; data: RevenueVsBookings[] }> {
    return this.http.get<{ success: boolean; data: RevenueVsBookings[] }>(`${this.baseUrl}/dashboard/revenue/bookings-correlation`);
  }

  // Get contract status distribution
  getContractStatusDistribution(): Observable<{ success: boolean; data: ContractStatus[] }> {
    return this.http.get<{ success: boolean; data: ContractStatus[] }>(`${this.baseUrl}/dashboard/contracts/status-distribution`);
  }
}