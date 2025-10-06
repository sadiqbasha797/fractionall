import { Component, OnInit, Renderer2 } from '@angular/core';
import { TicketService, Ticket, User, Car } from '../services/ticket.service';
import { SharedMemberService, SharedMember, KycDocument } from '../services/shared-member.service';
import { UserService } from '../services/user.service';
import { CarService, Car as CarType } from '../services/car.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, LoadingDialogComponent],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit {
  // Tab management
  activeTab: 'tickets' | 'shared-members' = 'tickets';
  
  // Tickets data
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  users: User[] = [];
  cars: CarType[] = [];
  selectedTicket: Ticket | null = null;
  searchTerm: string = '';
  statusFilter: string = 'all';
  resoldFilter: string = 'all';
  
  // Pagination for tickets
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  newTicket: Ticket = {
    userid: '',
    carid: '',
    ticketcustomid: '',
    ticketprice: 0,
    pricepaid: 0,
    pendingamount: 0,
    ticketexpiry: '',
    ticketbroughtdate: '',
    comments: undefined,
    paymentid: undefined,
    ticketstatus: 'active',
    resold: false,
    createdby: '',
    createdByModel: ''
  };
  isEditMode: boolean = false;
  currentTicketId: string | null = null;
  
  // Shared members data
  sharedMembers: SharedMember[] = [];
  filteredSharedMembers: SharedMember[] = [];
  selectedSharedMember: SharedMember | null = null;
  sharedMemberSearchTerm: string = '';
  sharedMemberStatusFilter: string = 'all';
  
  // Pagination for shared members
  sharedMemberCurrentPage = 1;
  sharedMemberItemsPerPage = 10;
  sharedMemberTotalPages = 0;
  
  // Helper method for template
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
  newSharedMember: Partial<SharedMember> = {
    name: '',
    email: '',
    mobileNumber: '',
    aadharNumber: '',
    panNumber: '',
    kycDocuments: [],
    ticketid: '',
    userid: ''
  };
  isSharedMemberEditMode: boolean = false;
  currentSharedMemberId: string | null = null;
  sharedMemberStats: any = null;
  
  // Dialog states
  showLoadingDialog: boolean = false;
  loadingMessage: string = '';
  showRejectDialog: boolean = false;
  rejectComments: string = '';
  private dialogElement: HTMLElement | null = null;

  constructor(
    private ticketService: TicketService,
    private sharedMemberService: SharedMemberService,
    private userService: UserService,
    private carService: CarService,
    private exportService: ExportService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.getTickets();
    this.getSharedMembers();
    this.getSharedMemberStats();
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

  // Local dialog methods
  showConfirmDialog(title: string, message: string, confirmCallback: () => void): void {
    this.removeDialog();
    
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '500px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', 'white');
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    
    const btnContainer = this.renderer.createElement('div');
    this.renderer.setStyle(btnContainer, 'display', 'flex');
    this.renderer.setStyle(btnContainer, 'justify-content', 'flex-end');
    this.renderer.setStyle(btnContainer, 'gap', '12px');
    
    const cancelBtn = this.renderer.createElement('button');
    const cancelText = this.renderer.createText('Cancel');
    this.renderer.appendChild(cancelBtn, cancelText);
    this.renderer.setStyle(cancelBtn, 'background', '#6B7280');
    this.renderer.setStyle(cancelBtn, 'color', 'white');
    this.renderer.setStyle(cancelBtn, 'border', 'none');
    this.renderer.setStyle(cancelBtn, 'padding', '10px 20px');
    this.renderer.setStyle(cancelBtn, 'border-radius', '8px');
    this.renderer.setStyle(cancelBtn, 'cursor', 'pointer');
    this.renderer.listen(cancelBtn, 'click', () => this.removeDialog());
    
    const confirmBtn = this.renderer.createElement('button');
    const confirmText = this.renderer.createText('Confirm');
    this.renderer.appendChild(confirmBtn, confirmText);
    this.renderer.setStyle(confirmBtn, 'background', '#DC2626');
    this.renderer.setStyle(confirmBtn, 'color', 'white');
    this.renderer.setStyle(confirmBtn, 'border', 'none');
    this.renderer.setStyle(confirmBtn, 'padding', '10px 20px');
    this.renderer.setStyle(confirmBtn, 'border-radius', '8px');
    this.renderer.setStyle(confirmBtn, 'cursor', 'pointer');
    this.renderer.listen(confirmBtn, 'click', () => {
      this.removeDialog();
      confirmCallback();
    });
    
    this.renderer.appendChild(btnContainer, cancelBtn);
    this.renderer.appendChild(btnContainer, confirmBtn);
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, btnContainer);
    this.renderer.appendChild(backdrop, dialog);
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
  }
  
  removeDialog(): void {
    if (this.dialogElement) {
      this.renderer.removeChild(document.body, this.dialogElement);
      this.dialogElement = null;
    }
  }

  showSuccessDialog(message: string): void {
    this.showMessageDialog('Success', message, '#10B981');
  }

  showErrorDialog(message: string): void {
    this.showMessageDialog('Error', message, '#DC2626');
  }

  showMessageDialog(title: string, message: string, color: string): void {
    this.removeDialog();
    
    const backdrop = this.renderer.createElement('div');
    this.renderer.setStyle(backdrop, 'position', 'fixed');
    this.renderer.setStyle(backdrop, 'top', '0');
    this.renderer.setStyle(backdrop, 'left', '0');
    this.renderer.setStyle(backdrop, 'width', '100vw');
    this.renderer.setStyle(backdrop, 'height', '100vh');
    this.renderer.setStyle(backdrop, 'background', 'rgba(0, 0, 0, 0.8)');
    this.renderer.setStyle(backdrop, 'z-index', '999999');
    this.renderer.setStyle(backdrop, 'display', 'flex');
    this.renderer.setStyle(backdrop, 'align-items', 'center');
    this.renderer.setStyle(backdrop, 'justify-content', 'center');
    
    const dialog = this.renderer.createElement('div');
    this.renderer.setStyle(dialog, 'background', '#374151');
    this.renderer.setStyle(dialog, 'border-radius', '12px');
    this.renderer.setStyle(dialog, 'max-width', '400px');
    this.renderer.setStyle(dialog, 'width', '90%');
    this.renderer.setStyle(dialog, 'padding', '24px');
    this.renderer.setStyle(dialog, 'text-align', 'center');
    
    const titleEl = this.renderer.createElement('h3');
    this.renderer.setStyle(titleEl, 'color', color);
    this.renderer.setStyle(titleEl, 'margin', '0 0 16px 0');
    this.renderer.setStyle(titleEl, 'font-size', '1.5rem');
    this.renderer.setStyle(titleEl, 'font-weight', '600');
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleEl, titleText);
    
    const messageEl = this.renderer.createElement('div');
    this.renderer.setProperty(messageEl, 'innerHTML', message);
    this.renderer.setStyle(messageEl, 'color', '#E5E7EB');
    this.renderer.setStyle(messageEl, 'margin-bottom', '24px');
    
    const okBtn = this.renderer.createElement('button');
    const okText = this.renderer.createText('OK');
    this.renderer.appendChild(okBtn, okText);
    this.renderer.setStyle(okBtn, 'background', color);
    this.renderer.setStyle(okBtn, 'color', 'white');
    this.renderer.setStyle(okBtn, 'border', 'none');
    this.renderer.setStyle(okBtn, 'padding', '10px 30px');
    this.renderer.setStyle(okBtn, 'border-radius', '8px');
    this.renderer.setStyle(okBtn, 'cursor', 'pointer');
    this.renderer.setStyle(okBtn, 'font-size', '14px');
    this.renderer.setStyle(okBtn, 'font-weight', '600');
    this.renderer.listen(okBtn, 'click', () => this.removeDialog());
    
    this.renderer.appendChild(dialog, titleEl);
    this.renderer.appendChild(dialog, messageEl);
    this.renderer.appendChild(dialog, okBtn);
    this.renderer.appendChild(backdrop, dialog);
    this.renderer.appendChild(document.body, backdrop);
    this.dialogElement = backdrop;
    
    this.renderer.listen(backdrop, 'click', () => this.removeDialog());
    this.renderer.listen(dialog, 'click', (e: Event) => e.stopPropagation());
  }

  getTickets(): void {
    this.ticketService.getTickets().subscribe((response) => {
      if (response.status === 'success') {
        this.tickets = response.body.tickets;
        this.filteredTickets = [...this.tickets];
        // Initialize pagination after loading tickets
        this.applyFilters();
      } else {
      }
    });
  }

  getUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.users = response.body.users;
        } else {
        }
      },
      error: (error) => {
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
    
    // Update pagination
    this.totalPages = Math.ceil(this.filteredTickets.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedTickets(): Ticket[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTickets.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.resoldFilter = 'all';
    this.currentPage = 1;
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

  openDatePicker(fieldId: string) {
    // Programmatically trigger the date picker
    const dateInput = document.getElementById(fieldId) as HTMLInputElement;
    if (dateInput) {
      dateInput.focus();
      // Try modern showPicker() method first
      if (dateInput.showPicker) {
        dateInput.showPicker();
      } else {
        // Fallback: trigger click event to open picker
        dateInput.click();
      }
    }
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
      comments: undefined,
      paymentid: undefined,
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

  // Calculate pending amount when price fields change
  calculatePendingAmount(): void {
    if (this.newTicket.ticketprice && this.newTicket.pricepaid) {
      this.newTicket.pendingamount = this.newTicket.ticketprice - this.newTicket.pricepaid;
    }
  }

  submitTicketForm(): void {
    this.showLoadingDialog = true;
    this.loadingMessage = this.isEditMode ? 'Updating ticket...' : 'Creating ticket...';

    // Prepare ticket data for submission
    const ticketData = { ...this.newTicket };
    
    // Convert date string to ISO format if it's just a date
    if (ticketData.ticketbroughtdate && !ticketData.ticketbroughtdate.includes('T')) {
      ticketData.ticketbroughtdate = new Date(ticketData.ticketbroughtdate + 'T12:00:00.000Z').toISOString();
    }

    // Ensure pending amount is calculated correctly
    if (ticketData.ticketprice && ticketData.pricepaid) {
      ticketData.pendingamount = ticketData.ticketprice - ticketData.pricepaid;
    }

    // Clean up empty string fields that should be undefined for MongoDB validation
    if (ticketData.paymentid === '' || ticketData.paymentid === undefined) {
      delete ticketData.paymentid;
    }
    if (ticketData.comments === '' || ticketData.comments === undefined) {
      delete ticketData.comments;
    }

    // Debug: Log the data being sent (remove in production)
    // console.log('Ticket data being sent:', ticketData);
    // console.log('Is edit mode:', this.isEditMode);

    if (this.isEditMode && this.currentTicketId) {
      this.ticketService.updateTicket(this.currentTicketId, ticketData).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getTickets(); // Refresh the list
            this.closeModal();
            this.showSuccessDialog('Ticket updated successfully!');
          } else {
            this.showErrorDialog(`Failed to update ticket: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          console.error('Update ticket error:', err);
          let errorMessage = 'Unknown error';
          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (err.status === 500) {
            errorMessage = 'Internal server error. Please check the server logs.';
          } else if (err.status === 400) {
            errorMessage = 'Bad request. Please check all required fields are filled correctly.';
          } else if (err.status === 401) {
            errorMessage = 'Unauthorized. Please log in again.';
          } else if (err.status === 403) {
            errorMessage = 'Forbidden. You do not have permission to perform this action.';
          }
          this.showErrorDialog(`Error updating ticket: ${errorMessage}`);
        }
      });
    } else {
      this.ticketService.createTicket(ticketData).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getTickets(); // Refresh the list
            this.closeModal();
            this.showSuccessDialog('Ticket created successfully!');
          } else {
            this.showErrorDialog(`Failed to create ticket: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          console.error('Create ticket error:', err);
          let errorMessage = 'Unknown error';
          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (err.status === 500) {
            errorMessage = 'Internal server error. Please check the server logs.';
          } else if (err.status === 400) {
            errorMessage = 'Bad request. Please check all required fields are filled correctly.';
          } else if (err.status === 401) {
            errorMessage = 'Unauthorized. Please log in again.';
          } else if (err.status === 403) {
            errorMessage = 'Forbidden. You do not have permission to perform this action.';
          }
          this.showErrorDialog(`Error creating ticket: ${errorMessage}`);
        }
      });
    }
  }

  editTicket(ticket: Ticket): void {
    this.isEditMode = true;
    this.currentTicketId = ticket._id!;
    
    // Extract IDs from populated objects for form compatibility
    this.newTicket = {
      ...ticket,
      userid: typeof ticket.userid === 'object' ? ticket.userid._id || '' : ticket.userid,
      carid: typeof ticket.carid === 'object' ? ticket.carid._id || '' : ticket.carid
    };
    
    const modal = document.querySelector('.modal') as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  deleteTicket(ticket: Ticket): void {
    if (!ticket._id) return;

    this.showConfirmDialog(
      'Confirm Delete',
      `Are you sure you want to delete <strong>Ticket ${ticket.ticketcustomid}</strong>? This action cannot be undone.`,
      () => {
        this.showLoadingDialog = true;
        this.loadingMessage = 'Deleting ticket...';
        
        this.ticketService.deleteTicket(ticket._id!).subscribe({
          next: (response) => {
            this.showLoadingDialog = false;
            if (response.status === 'success') {
              this.tickets = this.tickets.filter(t => t._id !== ticket._id);
              this.applyFilters();
              this.showSuccessDialog('Ticket deleted successfully!');
            } else {
              this.showErrorDialog(`Failed to delete ticket: ${response.message}`);
            }
          },
          error: (err) => {
            this.showLoadingDialog = false;
            this.showErrorDialog(`Error deleting ticket: ${err.message || 'Unknown error'}`);
          }
        });
      }
    );
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

  // Tab management methods
  switchTab(tab: 'tickets' | 'shared-members'): void {
    this.activeTab = tab;
    if (tab === 'shared-members' && this.sharedMembers.length === 0) {
      this.getSharedMembers();
    }
  }

  // Shared member management methods
  getSharedMembers(): void {
    this.sharedMemberService.getAllSharedMembers().subscribe((response) => {
      if (response.status === 'success') {
        this.sharedMembers = response.body.sharedMembers || [];
        this.filteredSharedMembers = [...this.sharedMembers];
        // Initialize pagination after loading shared members
        this.applySharedMemberFilters();
      } else {
        this.showErrorDialog(`Failed to load shared members: ${response.message}`);
      }
    });
  }

  getSharedMemberStats(): void {
    this.sharedMemberService.getSharedMemberStats().subscribe((response) => {
      if (response.status === 'success') {
        this.sharedMemberStats = response.body.stats;
      }
    });
  }

  onSharedMemberSearchChange(): void {
    this.applySharedMemberFilters();
  }

  onSharedMemberStatusFilterChange(): void {
    this.applySharedMemberFilters();
  }

  applySharedMemberFilters(): void {
    this.filteredSharedMembers = this.sharedMembers.filter(member => {
      const matchesSearch = !this.sharedMemberSearchTerm || 
        member.name.toLowerCase().includes(this.sharedMemberSearchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(this.sharedMemberSearchTerm.toLowerCase()) ||
        member.mobileNumber.includes(this.sharedMemberSearchTerm) ||
        member.aadharNumber.includes(this.sharedMemberSearchTerm) ||
        member.panNumber.toLowerCase().includes(this.sharedMemberSearchTerm.toLowerCase());
      
      const matchesStatus = this.sharedMemberStatusFilter === 'all' || member.status === this.sharedMemberStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    // Update pagination
    this.sharedMemberTotalPages = Math.ceil(this.filteredSharedMembers.length / this.sharedMemberItemsPerPage);
    if (this.sharedMemberCurrentPage > this.sharedMemberTotalPages) {
      this.sharedMemberCurrentPage = 1;
    }
  }

  get paginatedSharedMembers(): SharedMember[] {
    const startIndex = (this.sharedMemberCurrentPage - 1) * this.sharedMemberItemsPerPage;
    const endIndex = startIndex + this.sharedMemberItemsPerPage;
    return this.filteredSharedMembers.slice(startIndex, endIndex);
  }

  goToSharedMemberPage(page: number): void {
    if (page >= 1 && page <= this.sharedMemberTotalPages) {
      this.sharedMemberCurrentPage = page;
    }
  }

  getSharedMemberPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.sharedMemberCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.sharedMemberTotalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  clearSharedMemberFilters(): void {
    this.sharedMemberSearchTerm = '';
    this.sharedMemberStatusFilter = 'all';
    this.sharedMemberCurrentPage = 1;
    this.applySharedMemberFilters();
  }

  viewSharedMemberDetails(member: SharedMember): void {
    this.selectedSharedMember = member;
  }

  closeSharedMemberViewModal(): void {
    this.selectedSharedMember = null;
  }

  showCreateSharedMemberModal(): void {
    this.isSharedMemberEditMode = false;
    this.resetSharedMemberForm();
    const modal = document.querySelector('.shared-member-modal') as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  closeSharedMemberModal(): void {
    this.resetSharedMemberForm();
    const modal = document.querySelector('.shared-member-modal') as HTMLElement;
    if (modal) {
      modal.style.display = "none";
    }
  }

  resetSharedMemberForm(): void {
    this.newSharedMember = {
      name: '',
      email: '',
      mobileNumber: '',
      aadharNumber: '',
      panNumber: '',
      kycDocuments: [],
      ticketid: undefined,
      userid: undefined
    };
  }

  submitSharedMemberForm(): void {
    // Validate form data
    if (!this.validateSharedMemberForm()) {
      return;
    }

    this.showLoadingDialog = true;
    this.loadingMessage = this.isSharedMemberEditMode ? 'Updating shared member...' : 'Creating shared member...';

    if (this.isSharedMemberEditMode && this.currentSharedMemberId) {
      this.sharedMemberService.updateSharedMember(this.currentSharedMemberId, this.newSharedMember).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getSharedMembers();
            this.closeSharedMemberModal();
            this.showSuccessDialog('Shared member updated successfully!');
          } else {
            this.showErrorDialog(`Failed to update shared member: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          this.showErrorDialog(`Error updating shared member: ${err.message || 'Unknown error'}`);
        }
      });
    } else {
      console.log('Creating shared member with data:', this.newSharedMember);
      this.sharedMemberService.createSharedMember(this.newSharedMember).subscribe({
        next: (response) => {
          this.showLoadingDialog = false;
          if (response.status === 'success') {
            this.getSharedMembers();
            this.closeSharedMemberModal();
            this.showSuccessDialog('Shared member created successfully!');
          } else {
            this.showErrorDialog(`Failed to create shared member: ${response.message}`);
          }
        },
        error: (err) => {
          this.showLoadingDialog = false;
          console.error('Error creating shared member:', err);
          const errorMessage = err.error?.message || err.message || 'Unknown error';
          this.showErrorDialog(`Error creating shared member: ${errorMessage}`);
        }
      });
    }
  }

  validateSharedMemberForm(): boolean {
    // Check required fields
    if (!this.newSharedMember.name?.trim()) {
      this.showErrorDialog('Name is required');
      return false;
    }

    if (!this.newSharedMember.email?.trim()) {
      this.showErrorDialog('Email is required');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newSharedMember.email)) {
      this.showErrorDialog('Please enter a valid email address');
      return false;
    }

    if (!this.newSharedMember.mobileNumber?.trim()) {
      this.showErrorDialog('Mobile number is required');
      return false;
    }

    // Mobile number validation (10 digits starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(this.newSharedMember.mobileNumber)) {
      this.showErrorDialog('Please enter a valid 10-digit mobile number starting with 6-9');
      return false;
    }

    if (!this.newSharedMember.aadharNumber?.trim()) {
      this.showErrorDialog('Aadhar number is required');
      return false;
    }

    // Aadhar number validation (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(this.newSharedMember.aadharNumber)) {
      this.showErrorDialog('Please enter a valid 12-digit Aadhar number');
      return false;
    }

    if (!this.newSharedMember.panNumber?.trim()) {
      this.showErrorDialog('PAN number is required');
      return false;
    }

    // PAN number validation (5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(this.newSharedMember.panNumber.toUpperCase())) {
      this.showErrorDialog('Please enter a valid PAN number (e.g., ABCDE1234F)');
      return false;
    }

    return true;
  }

  editSharedMember(member: SharedMember): void {
    this.isSharedMemberEditMode = true;
    this.currentSharedMemberId = member._id!;
    this.newSharedMember = { ...member };
    const modal = document.querySelector('.shared-member-modal') as HTMLElement;
    if (modal) {
      modal.style.display = "block";
    }
  }

  deleteSharedMember(member: SharedMember): void {
    if (!member._id) return;

    this.showConfirmDialog(
      'Confirm Delete',
      `Are you sure you want to delete <strong>${member.name}</strong>? This action cannot be undone.`,
      () => {
        this.showLoadingDialog = true;
        this.loadingMessage = 'Deleting shared member...';
        
        this.sharedMemberService.deleteSharedMember(member._id!).subscribe({
          next: (response) => {
            this.showLoadingDialog = false;
            if (response.status === 'success') {
              this.sharedMembers = this.sharedMembers.filter(m => m._id !== member._id);
              this.applySharedMemberFilters();
              this.showSuccessDialog('Shared member deleted successfully!');
            } else {
              this.showErrorDialog(`Failed to delete shared member: ${response.message}`);
            }
          },
          error: (err) => {
            this.showLoadingDialog = false;
            this.showErrorDialog(`Error deleting shared member: ${err.message || 'Unknown error'}`);
          }
        });
      }
    );
  }

  approveSharedMember(member: SharedMember): void {
    this.showLoadingDialog = true;
    this.loadingMessage = 'Approving shared member...';
    
    this.sharedMemberService.updateSharedMemberStatus(member._id!, 'accepted').subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        if (response.status === 'success') {
          this.getSharedMembers();
          this.showSuccessDialog('Shared member approved successfully!');
        } else {
          this.showErrorDialog(`Failed to approve shared member: ${response.message}`);
        }
      },
      error: (err) => {
        this.showLoadingDialog = false;
        this.showErrorDialog(`Error approving shared member: ${err.message || 'Unknown error'}`);
      }
    });
  }

  showRejectModal(member: SharedMember): void {
    this.selectedSharedMember = member;
    this.rejectComments = '';
    this.showRejectDialog = true;
  }

  closeRejectModal(): void {
    this.showRejectDialog = false;
    this.selectedSharedMember = null;
    this.rejectComments = '';
  }

  rejectSharedMember(): void {
    if (!this.selectedSharedMember?._id) return;

    this.showLoadingDialog = true;
    this.loadingMessage = 'Rejecting shared member...';
    
    this.sharedMemberService.updateSharedMemberStatus(
      this.selectedSharedMember._id, 
      'rejected', 
      this.rejectComments
    ).subscribe({
      next: (response) => {
        this.showLoadingDialog = false;
        if (response.status === 'success') {
          this.getSharedMembers();
          this.closeRejectModal();
          this.showSuccessDialog('Shared member rejected successfully!');
        } else {
          this.showErrorDialog(`Failed to reject shared member: ${response.message}`);
        }
      },
      error: (err) => {
        this.showLoadingDialog = false;
        this.showErrorDialog(`Error rejecting shared member: ${err.message || 'Unknown error'}`);
      }
    });
  }

  // Helper methods for shared members
  getDocumentTypeDisplayName(documentType: string): string {
    return this.sharedMemberService.getDocumentTypeDisplayName(documentType);
  }

  getStatusDisplayName(status: string): string {
    return this.sharedMemberService.getStatusDisplayName(status);
  }

  getStatusColorClass(status: string): string {
    return this.sharedMemberService.getStatusColorClass(status);
  }

  getTicketInfo(member: SharedMember): any {
    if (typeof member.ticketid === 'string') {
      return { ticketcustomid: 'N/A', ticketprice: 0, ticketstatus: 'N/A' };
    }
    return member.ticketid || { ticketcustomid: 'N/A', ticketprice: 0, ticketstatus: 'N/A' };
  }

  getUserInfo(member: SharedMember): any {
    if (typeof member.userid === 'string') {
      return { name: 'N/A', email: 'N/A', phone: 'N/A' };
    }
    return member.userid || { name: 'N/A', email: 'N/A', phone: 'N/A' };
  }

  formatSharedMemberDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Export shared members data
  exportSharedMembersData() {
    const exportData = this.filteredSharedMembers.map(member => ({
      name: member.name,
      email: member.email,
      mobileNumber: member.mobileNumber,
      aadharNumber: member.aadharNumber,
      panNumber: member.panNumber,
      status: this.getStatusDisplayName(member.status),
      rejectedComments: member.rejectedComments || '',
      associatedTicket: this.getTicketInfo(member).ticketcustomid,
      associatedUser: this.getUserInfo(member).name,
      createdBy: typeof member.createdBy === 'string' ? member.createdBy : member.createdBy.name,
      createdByRole: member.createdByModel,
      createdAt: this.formatSharedMemberDate(member.created_at),
      kycDocumentsCount: member.kycDocuments.length
    }));

    const options: ExportOptions = {
      filename: `shared-members-data-${new Date().toISOString().split('T')[0]}`,
      title: 'Shared Members Management Report',
      columns: [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Mobile', key: 'mobileNumber', width: 15 },
        { header: 'Aadhar', key: 'aadharNumber', width: 15 },
        { header: 'PAN', key: 'panNumber', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Associated Ticket', key: 'associatedTicket', width: 20 },
        { header: 'Associated User', key: 'associatedUser', width: 20 },
        { header: 'Rejected Comments', key: 'rejectedComments', width: 30 },
        { header: 'Created By', key: 'createdBy', width: 20 },
        { header: 'Created By Role', key: 'createdByRole', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 20 },
        { header: 'KYC Documents', key: 'kycDocumentsCount', width: 15 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

}
