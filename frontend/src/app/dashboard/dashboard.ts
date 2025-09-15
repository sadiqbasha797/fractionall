import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats, CarDistribution, BookingTrend, TopPerformingCar, UserGrowthData, TicketStatusDistribution, RevenueVsBookings, ContractStatus } from '../services/dashboard.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
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
    // Load all data in parallel to improve performance
    this.loadAllDataInParallel();
  }
  
  loadAllDataInParallel(): void {
    this.isLoading = true;
    this.isStatsLoading = true;
    this.isDistributionLoading = true;
    this.isTrendsLoading = true;
    this.isTopCarsLoading = true;
    
    
    // Load all data simultaneously
    Promise.all([
      this.loadStatsPromise(),
      this.loadCarDistributionPromise(),
      this.loadBookingTrendsPromise(),
      this.loadTopPerformingCarsPromise()
    ]).then(() => {
      this.isLoading = false;
      this.updateChartData();
    }).catch(error => {
      this.handleError('Failed to load dashboard data');
      this.isLoading = false;
    });
  }
  
  loadStatsPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getDashboardStats()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.dashboardStats = response.data;
            } else {
            }
            this.isStatsLoading = false;
            resolve();
          },
          error: (error) => {
            this.isStatsLoading = false;
            reject(error);
          }
        });
    });
  }
  
  loadCarDistributionPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getCarDistribution()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.carDistribution = response.data;
            }
            this.isDistributionLoading = false;
            resolve();
          },
          error: (error) => {
            this.isDistributionLoading = false;
            reject(error);
          }
        });
    });
  }
  
  loadBookingTrendsPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getBookingTrends()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.bookingTrends = response.data;
            }
            this.isTrendsLoading = false;
            resolve();
          },
          error: (error) => {
            this.isTrendsLoading = false;
            reject(error);
          }
        });
    });
  }
  
  loadTopPerformingCarsPromise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dashboardService.getTopPerformingCars()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.topPerformingCars = response.data;
            }
            this.isTopCarsLoading = false;
            resolve();
          },
          error: (error) => {
            this.isTopCarsLoading = false;
            reject(error);
          }
        });
    });
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
  
  // Chart configurations
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        min: 0,
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };
  
  public barChartType: ChartType = 'bar';
  
  public carDistributionChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        hoverBackgroundColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 0
      }
    ]
  };
  
  public bookingTrendsChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Bookings',
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true
      },
      {
        data: [],
        label: 'Revenue',
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true
      }
    ]
  };
  
  public revenueBreakdownChartData: ChartData<'pie'> = {
    labels: ['Tickets', 'AMC', 'Tokens', 'Book Now'],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        hoverBackgroundColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 0
      }
    ]
  };
  
  // Update chart data when data is loaded
  private updateChartData(): void {
    // Update car distribution chart
    if (this.carDistribution.length > 0) {
      this.carDistributionChartData.labels = this.carDistribution.map(item => item._id);
      this.carDistributionChartData.datasets[0].data = this.carDistribution.map(item => item.count);
    }
    
    // Update booking trends chart
    if (this.bookingTrends.length > 0) {
      this.bookingTrendsChartData.labels = this.bookingTrends.map(item => 
        `${item._id.month}/${item._id.day}`
      );
      this.bookingTrendsChartData.datasets[0].data = this.bookingTrends.map(item => item.count);
      this.bookingTrendsChartData.datasets[1].data = this.bookingTrends.map(item => item.revenue);
    }
    
    // Update revenue breakdown chart
    if (this.dashboardStats?.revenue?.breakdown) {
      this.revenueBreakdownChartData.datasets[0].data = [
        this.dashboardStats.revenue.breakdown.tickets || 0,
        this.dashboardStats.revenue.breakdown.amc || 0,
        this.dashboardStats.revenue.breakdown.tokens || 0,
        this.dashboardStats.revenue.breakdown.bookNowTokens || 0
      ];
    }
  }
}