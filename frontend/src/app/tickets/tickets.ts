import { Component, OnInit } from '@angular/core';
import { TicketService, Ticket, User, Car } from '../services/ticket.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../shared/dialog/dialog.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DialogComponent, LoadingDialogComponent],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  users: User[] = [];
  cars: CarType[] = [];
  selectedTicket: Ticket | null = null;
  searchTerm: string = '';
  statusFilter: string = 'all';
  resoldFilter: string = 'all';
  newTicket: Ticket = {
    userid: '',
    carid: '',
    ticketcustomid: '',
    ticketprice: 0,
    pricepaid: 0,
    pendingamount: 0,
    ticketexpiry: '',
    ticketbroughtdate: '',
    comments: '',
    paymentid: '',
    ticketstatus: 'active',
    resold: false,
    createdby: '',
    createdByModel: ''
  };
  isEditMode: boolean = false;
  currentTicketId: string | null = null;
  
  // Dialog states
  showLoadingDialog: boolean = false;
  loadingMessage: string = '';

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    private carService: CarService,
    public dialogService: DialogService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.getTickets();
    this.getUsers();
    this.getCars();
    this.checkFontAwesomeLoaded();
  }

  checkFontAwesomeLoaded(): void {
    // Check if Font Awesome is loaded by testing if the CSS is available
    setTimeout(() => {
      const testElement = document.createElement('i');
      testElement.className = 'fas fa-search';
      testElement.style.position = 'absolute';
      testElement.style.left = '-9999px';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement, ':before');
      const fontFamily = computedStyle.getPropertyValue('font-family');
      
      document.body.removeChild(testElement);
      
      const searchContainer = document.querySelector('.search-input-container');
      if (searchContainer) {
        if (fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome')) {
          searchContainer.classList.add('fa-loaded');
        } else {
          searchContainer.classList.remove('fa-loaded');
        }
      }
    }, 100);
  }

  getTickets(): void {
    this.ticketService.getTickets().subscribe((response) => {
      if (response.status === 'success') {
        this.tickets = response.body.tickets;
        this.filteredTickets = [...this.tickets];
      } else {
        console.error('Failed to get tickets:', response.message);
      }
    });
  }

  getUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        console.log('Users response:', response);
        if (response.status === 'success') {
          this.users = response.body.users;
          console.log('Users loaded:', this.users);
        } else {
          console.error('Failed to get users:', response.message);
        }
      },
      error: (error) => {
        console.error('Error getting users:', error);
      }
    });
  }

  getCars(): void {
    this.carService.getCars().subscribe((response) => {
      if (response.status === 'success') {
        this.cars = response.body.cars.map((car: any) => ({
          ...car,
          _id: car._id || '',
          carname: car.carname || '',
          brandname: car.brandname || '',
          color: car.color || '',
          milege: car.milege || '',
          seating: car.seating || 0,
          features: car.features || [],
          price: car.price || 0,
          fractionprice: car.fractionprice || 0,
          tokenprice: car.tokenprice || 0,
          images: car.images || [],
          status: car.status || 'active',
          location: car.location || '',
          pincode: car.pincode || '',
          createdAt: car.createdAt || '',
          updatedAt: car.updatedAt || ''
        }));
      } else {
        console.error('Failed to get cars:', response.message);
      }
    });
  }

  getActiveTicketsCount(): number {
    return this.tickets.filter(ticket => ticket.ticketstatus === 'active').length;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onResoldFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredTickets = this.tickets.filter(ticket => {
      const matchesSearch = !this.searchTerm || 
        ticket.ticketcustomid.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getUser(ticket).name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getUser(ticket).email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getCar(ticket).carname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getCar(ticket).brandname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ticket.ticketstatus.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || ticket.ticketstatus === this.statusFilter;
      const matchesResold = this.resoldFilter === 'all' || 
        (this.resoldFilter === 'true' && ticket.resold) || 
        (this.resoldFilter === 'false' && !ticket.resold);
      
      return matchesSearch && matchesStatus && matchesResold;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.resoldFilter = 'all';
    this.applyFilters();
  }

  getUser(ticket: Ticket): User {
    if (typeof ticket.userid === 'string') {
      return this.users.find(user => user._id === ticket.userid) || {
        _id: '',
        name: 'Unknown User',
        email: '',
        phone: '',
        dateofbirth: '',
        address: '',
        location: '',
        pincode: '',
        verified: false,
        profileimage: '',
        governmentid: {},
        kycStatus: 'pending',
        createdAt: '',
        updatedAt: ''
      };
    }
    return ticket.userid;
  }

  getCar(ticket: Ticket): Car {
    if (typeof ticket.carid === 'string') {
      const foundCar = this.cars.find(car => car._id === ticket.carid);
      if (foundCar) {
        return {
          _id: foundCar._id || '',
          carname: foundCar.carname || 'Unknown Car',
          brandname: foundCar.brandname || '',
          color: foundCar.color || '',
          milege: foundCar.milege || '',
          seating: foundCar.seating || 0,
          features: foundCar.features || [],
          price: foundCar.price || 0,
          fractionprice: foundCar.fractionprice || 0,
          tokenprice: foundCar.tokenprice || 0,
          expectedpurchasedate: foundCar.expectedpurchasedate || '',
          ticketsavilble: foundCar.ticketsavilble || 0,
          totaltickets: foundCar.totaltickets || 0,
          tokensavailble: foundCar.tokensavailble || 0,
          bookNowTokenAvailable: foundCar.bookNowTokenAvailable || 0,
          bookNowTokenPrice: foundCar.bookNowTokenPrice || 0,
          amcperticket: foundCar.amcperticket || 0,
          contractYears: foundCar.contractYears || 0,
          location: foundCar.location || '',
          pincode: foundCar.pincode || '',
          description: foundCar.description || '',
          images: foundCar.images || [],
          createdBy: foundCar.createdBy || '',
          createdByModel: foundCar.createdByModel || '',
          status: foundCar.status || 'active',
          createdAt: foundCar.createdAt || '',
          updatedAt: foundCar.updatedAt || ''
        };
      }
      return {
        _id: '',
        carname: 'Unknown Car',
        brandname: '',
        color: '',
        milege: '',
        seating: 0,
        features: [],
        price: 0,
        fractionprice: 0,
        tokenprice: 0,
        expectedpurchasedate: '',
        ticketsavilble: 0,
        totaltickets: 0,
        tokensavailble: 0,
        bookNowTokenAvailable: 0,
        bookNowTokenPrice: 0,
        amcperticket: 0,
        contractYears: 0,
        location: '',
        pincode: '',
        description: '',
        images: [],
        createdBy: '',
        createdByModel: '',
        status: 'active',
        createdAt: '',
        updatedAt: ''
      };
    }
    return ticket.carid;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getPaymentProgress(ticket: Ticket): number {
    if (ticket.ticketprice === 0) return 0;
    return (ticket.pricepaid / ticket.ticketprice) * 100;
  }

  viewTicketDetails(ticket: Ticket): void {
    this.selectedTicket = ticket;
  }

  closeViewModal(): void {
    this.selectedTicket = null;
  }

  showCreateTicketModal(): void {
    this.isEditMode = false;
    this.newTicket = {
      userid: '',
      carid: '',
      ticketcustomid: '',
      ticketprice: 0,
      pricepaid: 0,
      pendingamount: 0,
      ticketexpiry: '',
      ticketbroughtdate: '',
      comments: '',
      paymentid: '',
      ticketstatus: 'active',
      resold: false,
      createdby: '',
      createdByModel: ''
    };
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  closeModal(): void {
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = "none";
    }
  }

  submitTicketForm(): void {
    this.showLoadingDialog = true;
    this.loadingMessage = this.isEditMode ? 'Updating ticket...' : 'Creating ticket...';

    if (this.isEditMode && this.currentTicketId) {
      this.ticketService.updateTicket(this.currentTicketId, this.newTicket).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getTickets(); // Refresh the list
            this.closeModal();
            this.dialogService.showSuccess('Success', 'Ticket updated successfully!');
          } else {
            this.dialogService.showError('Error', `Failed to update ticket: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.dialogService.showError('Error', `Error updating ticket: ${err.message || 'Unknown error'}`);
        }
      });
    } else {
      this.ticketService.createTicket(this.newTicket).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getTickets(); // Refresh the list
            this.closeModal();
            this.dialogService.showSuccess('Success', 'Ticket created successfully!');
          } else {
            this.dialogService.showError('Error', `Failed to create ticket: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.dialogService.showError('Error', `Error creating ticket: ${err.message || 'Unknown error'}`);
        }
      });
    }
  }

  editTicket(ticket: Ticket): void {
    this.isEditMode = true;
    this.currentTicketId = ticket._id!;
    this.newTicket = { ...ticket }; // Copy ticket data to newTicket for editing
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  async deleteTicket(ticket: Ticket): Promise<void> {
    if (!ticket._id) return;

    try {
      const confirmed = await this.dialogService.confirmDelete(`Ticket ${ticket.ticketcustomid}`);
      if (confirmed) {
        this.showLoadingDialog = true;
        this.loadingMessage = 'Deleting ticket...';
        
        this.ticketService.deleteTicket(ticket._id).subscribe({
          next: (response) => {
            this.showLoadingDialog = false;
            if (response.status === 'success') {
              this.tickets = this.tickets.filter(t => t._id !== ticket._id);
              this.applyFilters(); // Refresh filtered list
              this.dialogService.showSuccess('Success', 'Ticket deleted successfully!');
            } else {
              this.dialogService.showError('Error', `Failed to delete ticket: ${response.message}`);
            }
          },
          error: (err) => {
            this.showLoadingDialog = false;
            this.dialogService.showError('Error', `Error deleting ticket: ${err.message || 'Unknown error'}`);
          }
        });
      }
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    }
  }

  // Export functionality
  exportData() {
    this.exportToExcel();
  }

  exportToExcel() {
    const exportData = this.filteredTickets.map(ticket => ({
      ticketId: ticket.ticketcustomid,
      userName: this.getUser(ticket).name,
      userEmail: this.getUser(ticket).email,
      userPhone: this.getUser(ticket).phone,
      userLocation: this.getUser(ticket).location,
      carName: this.getCar(ticket).carname,
      carBrand: this.getCar(ticket).brandname,
      carColor: this.getCar(ticket).color,
      carSeating: this.getCar(ticket).seating,
      ticketPrice: ticket.ticketprice,
      pricePaid: ticket.pricepaid,
      pendingAmount: ticket.pendingamount,
      status: ticket.ticketstatus,
      resold: ticket.resold,
      boughtDate: ticket.ticketbroughtdate,
      expiryDate: ticket.ticketexpiry,
      comments: ticket.comments || '',
      paymentId: ticket.paymentid || '',
      createdBy: ticket.createdby || ''
    }));

    const options: ExportOptions = {
      filename: `tickets-data-${new Date().toISOString().split('T')[0]}`,
      title: 'Tickets Management Report',
      columns: [
        { header: 'Ticket ID', key: 'ticketId', width: 20 },
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Email', key: 'userEmail', width: 30 },
        { header: 'Phone', key: 'userPhone', width: 15 },
        { header: 'Location', key: 'userLocation', width: 20 },
        { header: 'Car', key: 'carName', width: 20 },
        { header: 'Brand', key: 'carBrand', width: 20 },
        { header: 'Color', key: 'carColor', width: 15 },
        { header: 'Seating', key: 'carSeating', width: 10 },
        { header: 'Price', key: 'ticketPrice', width: 15 },
        { header: 'Paid', key: 'pricePaid', width: 15 },
        { header: 'Pending', key: 'pendingAmount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Resold', key: 'resold', width: 10 },
        { header: 'Bought Date', key: 'boughtDate', width: 20 },
        { header: 'Expiry Date', key: 'expiryDate', width: 20 },
        { header: 'Comments', key: 'comments', width: 30 },
        { header: 'Payment ID', key: 'paymentId', width: 20 },
        { header: 'Created By', key: 'createdBy', width: 20 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

}
