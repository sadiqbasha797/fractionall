import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../services/dashboard.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { AmcService, AMC } from '../services/amc.service';
import { TokenService, Token } from '../services/token.service';
import { BookNowTokenService, BookNowToken } from '../services/book-now-token.service';
import { CarService, Car } from '../services/car.service';
import { ExportService } from '../services/export.service';

interface CarRevenue {
  car: Car;
  ticketsRevenue: number;
  amcRevenue: number;
  waitlistTokensRevenue: number;
  bookNowTokensRevenue: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-revenvue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenvue.html',
  styleUrl: './revenvue.css'
})
export class Revenvue implements OnInit {
  // Loading and error states
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Revenue data
  ticketsRevenue = 0;
  amcRevenue = 0;
  waitlistTokensRevenue = 0;
  bookNowTokensRevenue = 0;
  totalRevenue = 0;
  totalTickets = 0;
  totalAmcs = 0;
  totalWaitlistTokens = 0;
  totalBookNowTokens = 0;

  // Car data
  cars: Car[] = [];
  carRevenues: CarRevenue[] = [];
  filteredCarRevenues: CarRevenue[] = [];

  // Search and pagination
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private dashboardService: DashboardService,
    private ticketService: TicketService,
    private amcService: AmcService,
    private tokenService: TokenService,
    private bookNowTokenService: BookNowTokenService,
    private carService: CarService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Load all required data
    this.loadDashboardStats();
    this.loadCars();
    this.loadTickets();
    this.loadAmcs();
    this.loadWaitlistTokens();
    this.loadBookNowTokens();
  }

  loadDashboardStats(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success && response.data.overview) {
          this.ticketsRevenue = response.data.revenue?.breakdown?.tickets || 0;
          this.amcRevenue = response.data.revenue?.breakdown?.amc || 0;
          this.waitlistTokensRevenue = response.data.revenue?.breakdown?.tokens || 0;
          this.bookNowTokensRevenue = response.data.revenue?.breakdown?.bookNowTokens || 0;
          this.totalRevenue = response.data.revenue?.total || 0;
          
          this.totalTickets = response.data.overview.totalTickets || 0;
          this.totalAmcs = response.data.overview.totalAmcs || 0;
          this.totalWaitlistTokens = response.data.overview.totalTokens || 0;
          this.totalBookNowTokens = response.data.overview.totalBookNowTokens || 0;
        }
      },
      error: (error) => {
      }
    });
  }

  loadCars(): void {
    this.carService.getCars().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.cars = response.body.cars;
          this.initializeCarRevenues();
        }
      },
      error: (error) => {
        this.handleError('Failed to load car data');
      }
    });
  }

  loadTickets(): void {
    this.ticketService.getTickets().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          const tickets = response.body.tickets || [];
          this.calculateTicketsRevenue(tickets);
        }
      },
      error: (error) => {
      }
    });
  }

  loadAmcs(): void {
    this.amcService.getAMCs().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          const amcs = response.body.amcs || [];
          this.calculateAmcRevenue(amcs);
        }
      },
      error: (error) => {
      }
    });
  }

  loadWaitlistTokens(): void {
    this.tokenService.getTokens().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          const tokens = response.body.tokens || [];
          this.calculateWaitlistTokensRevenue(tokens);
        }
      },
      error: (error) => {
      }
    });
  }

  loadBookNowTokens(): void {
    this.bookNowTokenService.getBookNowTokens().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          const tokens = response.body.bookNowTokens || [];
          this.calculateBookNowTokensRevenue(tokens);
        }
      },
      error: (error) => {
      }
    });
  }

  initializeCarRevenues(): void {
    this.carRevenues = this.cars.map(car => ({
      car,
      ticketsRevenue: 0,
      amcRevenue: 0,
      waitlistTokensRevenue: 0,
      bookNowTokensRevenue: 0,
      totalRevenue: 0
    }));
    this.filteredCarRevenues = [...this.carRevenues];
    this.updatePagination();
  }

  calculateTicketsRevenue(tickets: Ticket[]): void {
    // Calculate revenue per car
    tickets.forEach(ticket => {
      const carId = typeof ticket.carid === 'string' ? ticket.carid : ticket.carid._id;
      const revenue = ticket.pricepaid || 0;
      
      const carRevenue = this.carRevenues.find(cr => cr.car._id === carId);
      if (carRevenue) {
        carRevenue.ticketsRevenue += revenue;
        carRevenue.totalRevenue += revenue;
      }
    });
    
    this.updateFilteredCarRevenues();
  }

  calculateAmcRevenue(amcs: AMC[]): void {
    // Calculate revenue per car
    amcs.forEach(amc => {
      const carId = typeof amc.carid === 'string' ? amc.carid : amc.carid._id;
      const revenue = amc.amcamount?.reduce((sum, amount) => {
        return amount.paid ? sum + (amount.amount || 0) : sum;
      }, 0) || 0;
      
      const carRevenue = this.carRevenues.find(cr => cr.car._id === carId);
      if (carRevenue) {
        carRevenue.amcRevenue += revenue;
        carRevenue.totalRevenue += revenue;
      }
    });
    
    this.updateFilteredCarRevenues();
  }

  calculateWaitlistTokensRevenue(tokens: Token[]): void {
    // Calculate revenue per car
    tokens.forEach(token => {
      const carId = typeof token.carid === 'string' ? token.carid : token.carid._id;
      const revenue = token.amountpaid || 0;
      
      const carRevenue = this.carRevenues.find(cr => cr.car._id === carId);
      if (carRevenue) {
        carRevenue.waitlistTokensRevenue += revenue;
        carRevenue.totalRevenue += revenue;
      }
    });
    
    this.updateFilteredCarRevenues();
  }

  calculateBookNowTokensRevenue(tokens: BookNowToken[]): void {
    // Calculate revenue per car
    tokens.forEach(token => {
      const carId = typeof token.carid === 'string' ? token.carid : token.carid._id;
      const revenue = token.amountpaid || 0;
      
      const carRevenue = this.carRevenues.find(cr => cr.car._id === carId);
      if (carRevenue) {
        carRevenue.bookNowTokensRevenue += revenue;
        carRevenue.totalRevenue += revenue;
      }
    });
    
    this.updateFilteredCarRevenues();
    this.isLoading = false;
  }

  updateFilteredCarRevenues(): void {
    this.filteredCarRevenues = this.carRevenues.filter(cr => 
      cr.car.carname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      cr.car.brandname.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCarRevenues.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getFilteredCarRevenues(): CarRevenue[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCarRevenues.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.updateFilteredCarRevenues();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  refreshData(): void {
    this.loadData();
  }

  exportData(): void {
    const exportData = this.filteredCarRevenues.map(cr => ({
      carName: cr.car.carname,
      brand: cr.car.brandname,
      ticketsRevenue: cr.ticketsRevenue,
      amcRevenue: cr.amcRevenue,
      waitlistTokensRevenue: cr.waitlistTokensRevenue,
      bookNowTokensRevenue: cr.bookNowTokensRevenue,
      totalRevenue: cr.totalRevenue
    }));

    this.exportService.exportToExcel({
      filename: `revenue-report-${new Date().toISOString().split('T')[0]}`,
      title: 'Revenue Report',
      columns: [
        { header: 'Car Name', key: 'carName', width: 25 },
        { header: 'Brand', key: 'brand', width: 15 },
        { header: 'Tickets Revenue', key: 'ticketsRevenue', width: 20 },
        { header: 'AMC Revenue', key: 'amcRevenue', width: 15 },
        { header: 'Waitlist Tokens Revenue', key: 'waitlistTokensRevenue', width: 25 },
        { header: 'Book Now Tokens Revenue', key: 'bookNowTokensRevenue', width: 25 },
        { header: 'Total Revenue', key: 'totalRevenue', width: 15 }
      ],
      data: exportData
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
  }
}