import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats, CarDistribution, BookingTrend, TopPerformingCar } from '../services/dashboard.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  dashboardStats: DashboardStats | null = null;
  carDistribution: CarDistribution[] = [];
  bookingTrends: BookingTrend[] = [];
  topPerformingCars: TopPerformingCar[] = [];
  
  // Loading states
  isLoading = true;
  isStatsLoading = true;
  isDistributionLoading = true;
  isTrendsLoading = true;
  isTopCarsLoading = true;
  
  // Error states
  hasError = false;
  errorMessage = '';
  
  // Auto-refresh interval (5 minutes)
  private refreshInterval = 5 * 60 * 1000;
  
  constructor(private dashboardService: DashboardService) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
    this.startAutoRefresh();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadDashboardData(): void {
    this.loadStats();
    this.loadCarDistribution();
    this.loadBookingTrends();
    this.loadTopPerformingCars();
  }
  
  loadStats(): void {
    this.isStatsLoading = true;
    console.log('🔄 Loading dashboard stats...');
    this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Dashboard stats response:', response);
          if (response.success) {
            this.dashboardStats = response.data;
            console.log('📊 Dashboard stats loaded:', this.dashboardStats);
          } else {
            console.error('❌ Dashboard stats response not successful:', response);
          }
          this.isStatsLoading = false;
          this.updateLoadingState();
        },
        error: (error) => {
          console.error('💥 Error loading dashboard stats:', error);
          console.error('💥 Error status:', error.status);
          console.error('💥 Error message:', error.message);
          this.isStatsLoading = false;
          this.updateLoadingState();
          this.handleError('Failed to load dashboard statistics');
        }
      });
  }
  
  loadCarDistribution(): void {
    this.isDistributionLoading = true;
    this.dashboardService.getCarDistribution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.carDistribution = response.data;
          }
          this.isDistributionLoading = false;
          this.updateLoadingState();
        },
        error: (error) => {
          console.error('Error loading car distribution:', error);
          this.isDistributionLoading = false;
          this.updateLoadingState();
        }
      });
  }
  
  loadBookingTrends(): void {
    this.isTrendsLoading = true;
    this.dashboardService.getBookingTrends()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.bookingTrends = response.data;
          }
          this.isTrendsLoading = false;
          this.updateLoadingState();
        },
        error: (error) => {
          console.error('Error loading booking trends:', error);
          this.isTrendsLoading = false;
          this.updateLoadingState();
        }
      });
  }
  
  loadTopPerformingCars(): void {
    this.isTopCarsLoading = true;
    this.dashboardService.getTopPerformingCars()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.topPerformingCars = response.data;
          }
          this.isTopCarsLoading = false;
          this.updateLoadingState();
        },
        error: (error) => {
          console.error('Error loading top performing cars:', error);
          this.isTopCarsLoading = false;
          this.updateLoadingState();
        }
      });
  }
  
  private updateLoadingState(): void {
    this.isLoading = this.isStatsLoading || this.isDistributionLoading || 
                     this.isTrendsLoading || this.isTopCarsLoading;
  }
  
  private startAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.dashboardService.getDashboardStats()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dashboardStats = response.data;
          }
        },
        error: (error) => {
          console.error('Auto-refresh error:', error);
        }
      });
  }
  
  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
  }
  
  refreshData(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.loadDashboardData();
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-IN').format(num);
  }
  
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'expired':
        return 'status-expired';
      default:
        return 'status-pending';
    }
  }
  
  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'priority-medium';
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  }
  
  getChangePercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
  
  getChangeIcon(percentage: number): string {
    return percentage >= 0 ? '↗' : '↘';
  }
  
  getChangeColor(percentage: number): string {
    return percentage >= 0 ? 'text-green-400' : 'text-red-400';
  }
}
