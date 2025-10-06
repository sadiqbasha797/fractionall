import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats, CarDistribution, BookingTrend, TopPerformingCar, UserGrowthData, TicketStatusDistribution, RevenueVsBookings, ContractStatus } from '../services/dashboard.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

export type DashboardView = 'overview' | 'revenue' | 'shares' | 'tokens';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Dashboard view management
  currentView: DashboardView = 'overview';
  dashboardViews: { id: DashboardView; name: string; icon: string }[] = [
    { id: 'overview', name: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { id: 'revenue', name: 'Revenue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'shares', name: 'Shares', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { id: 'tokens', name: 'Tokens', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];
  
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

  // Method to switch dashboard views
  switchView(view: DashboardView): void {
    this.currentView = view;
    // Optionally reload data specific to the view
    this.loadDashboardData();
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

  // Chart options for shares dashboard
  public shareChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'white'
        }
      }
    }
  };

  public shareLineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      },
      y: {
        min: 0,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'white'
        }
      }
    }
  };

  // Chart options for tokens dashboard
  public tokenChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'white'
        }
      }
    }
  };

  public tokenBarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'white'
        }
      },
      y: {
        min: 0,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'white'
        }
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
    labels: ['Shares', 'AMC', 'Tokens', 'Book Now'],
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

  // Shares Dashboard Charts
  public shareStatusChartData: ChartData<'doughnut'> = {
    labels: ['Active', 'Closed', 'Expired'],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        hoverBackgroundColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(107, 114, 128, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  public shareTrendsChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Shares This Week',
        data: [],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Tokens Dashboard Charts
  public tokenDistributionChartData: ChartData<'pie'> = {
    labels: ['Waitlist Tokens', 'Book Now Tokens'],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        hoverBackgroundColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  public tokenRevenueChartData: ChartData<'bar'> = {
    labels: ['Waitlist Tokens', 'Book Now Tokens'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: [],
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)'
        ],
        borderColor: [
          'rgba(168, 85, 247, 1)',
          'rgba(34, 197, 94, 1)'
        ],
        borderWidth: 2
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
        (this.dashboardStats.revenue.breakdown as any).shares || 0,
        this.dashboardStats.revenue.breakdown.amc || 0,
        this.dashboardStats.revenue.breakdown.tokens || 0,
        this.dashboardStats.revenue.breakdown.bookNowTokens || 0
      ];
    }

    // Update shares dashboard charts
    if (this.dashboardStats?.overview) {
      // Share status distribution
      const activeShares = (this.dashboardStats.overview as any).activeShares || 0;
      const expiredShares = (this.dashboardStats.overview as any).expiredShares || 0;
      const totalShares = (this.dashboardStats.overview as any).totalShares || 0;
      const closedShares = Math.max(0, totalShares - activeShares - expiredShares);
      
      this.shareStatusChartData.datasets[0].data = [
        activeShares,
        closedShares,
        expiredShares
      ];

      // Share trends (using actual weekly data instead of random)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      this.shareTrendsChartData.labels = days;
      // Distribute weekly shares evenly across days (or use actual daily data if available)
      const sharesThisWeek = (this.dashboardStats.overview as any).sharesThisWeek || 0;
      const dailyAverage = Math.ceil(sharesThisWeek / 7);
      this.shareTrendsChartData.datasets[0].data = days.map(() => dailyAverage);
    }

    // Update tokens dashboard charts
    if (this.dashboardStats?.overview) {
      // Token distribution
      this.tokenDistributionChartData.datasets[0].data = [
        this.dashboardStats.overview.totalTokens || 0,
        this.dashboardStats.overview.totalBookNowTokens || 0
      ];

      // Token revenue
      if (this.dashboardStats?.revenue?.breakdown) {
        this.tokenRevenueChartData.datasets[0].data = [
          this.dashboardStats.revenue.breakdown.tokens || 0,
          this.dashboardStats.revenue.breakdown.bookNowTokens || 0
        ];
      }
    }
  }
}
