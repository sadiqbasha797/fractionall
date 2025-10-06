import { Component, OnInit, Renderer2 } from '@angular/core';
import { ContractService, Contract, CreateContractData } from '../services/contract.service';
import { CarService, Car } from '../services/car.service';
import { UserService, User } from '../services/user.service';
import { TicketService, Ticket } from '../services/ticket.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService, ExportOptions } from '../services/export.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css'
})
export class Contracts implements OnInit {
  // Data arrays
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  users: User[] = [];
  cars: Car[] = [];
  tickets: Ticket[] = [];
  availableTickets: Ticket[] = [];

  // Filter and search properties
  searchTerm: string = '';
  createdByFilter: string = 'all';
  documentsFilter: string = 'all';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Helper method for template
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Modal states
  showCreateEditModal: boolean = false;
  showDocumentModal: boolean = false;
  selectedContract: Contract | null = null;
  currentContract: Contract | null = null;
  isEditMode: boolean = false;
  currentContractId: string | null = null;

  // Form data
  contractData: CreateContractData = {
    carid: '',
    userid: '',
    ticketid: ''
  };

  // File handling
  selectedFiles: File[] = [];
  newDocumentFiles: File[] = [];
  selectedDocuments: boolean[] = [];

  // Loading states
  isSubmitting: boolean = false;
  isUploading: boolean = false;

  // User permissions
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;

  // Dialog element
  private dialogElement: HTMLElement | null = null;

  constructor(
    private contractService: ContractService,
    private carService: CarService,
    private userService: UserService,
    private ticketService: TicketService,
    private authService: AuthService,
    private exportService: ExportService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.checkUserPermissions();
    this.loadInitialData();
  }

  checkUserPermissions(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isSuperAdmin = this.authService.isSuperAdmin();
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

  async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadContracts(),
        this.loadUsers(),
        this.loadCars(),
        this.loadTickets()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showErrorDialog('Failed to load contracts data');
    }
  }

  async loadContracts(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.contractService.getContracts().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.contracts = response.body.contracts || [];
            this.filteredContracts = [...this.contracts];
            // Initialize pagination after loading contracts
            this.applyFilters();
            resolve();
          } else {
            reject(new Error(response.message));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  async loadUsers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getUsers().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.users = response.body.users || [];
            resolve();
          } else {
            reject(new Error(response.message));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  async loadCars(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.carService.getCars().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.cars = response.body.cars || [];
            resolve();
          } else {
            reject(new Error(response.message));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  async loadTickets(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ticketService.getTickets().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.tickets = response.body.tickets || [];
            resolve();
          } else {
            reject(new Error(response.message));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  // Search and filter methods
  onSearchChange(): void {
    this.applyFilters();
  }

  onCreatedByFilterChange(): void {
    this.applyFilters();
  }

  onDocumentsFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredContracts = this.contracts.filter(contract => {
      const matchesSearch = !this.searchTerm || 
        this.getUserName(contract.userid).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getCarName(contract.carid).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getTicketId(contract.ticketid).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (contract._id && contract._id.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesCreatedBy = this.createdByFilter === 'all' || contract.createdByModel === this.createdByFilter;
      
      const matchesDocuments = this.documentsFilter === 'all' || 
        (this.documentsFilter === 'with-docs' && contract.contract_docs && contract.contract_docs.length > 0) ||
        (this.documentsFilter === 'without-docs' && (!contract.contract_docs || contract.contract_docs.length === 0));
      
      return matchesSearch && matchesCreatedBy && matchesDocuments;
    });
    
    // Update pagination
    this.totalPages = Math.ceil(this.filteredContracts.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedContracts(): Contract[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredContracts.slice(startIndex, endIndex);
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
    this.createdByFilter = 'all';
    this.documentsFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Modal management
  showCreateContractModal(): void {
    this.isEditMode = false;
    this.contractData = {
      carid: '',
      userid: '',
      ticketid: ''
    };
    this.selectedFiles = [];
    this.availableTickets = [];
    this.showCreateEditModal = true;
  }

  closeCreateEditModal(): void {
    this.showCreateEditModal = false;
    this.selectedFiles = [];
    this.availableTickets = [];
  }

  closeViewModal(): void {
    this.selectedContract = null;
  }

  closeDocumentModal(): void {
    this.showDocumentModal = false;
    this.currentContract = null;
    this.newDocumentFiles = [];
    this.selectedDocuments = [];
  }

  // Contract CRUD operations
  viewContractDetails(contract: Contract): void {
    this.selectedContract = contract;
  }

  editContract(contract: Contract): void {
    this.isEditMode = true;
    this.currentContractId = contract._id!;
    
    this.contractData = {
      carid: typeof contract.carid === 'string' ? contract.carid : contract.carid._id,
      userid: typeof contract.userid === 'string' ? contract.userid : contract.userid._id,
      ticketid: typeof contract.ticketid === 'string' ? contract.ticketid : contract.ticketid._id
    };
    
    this.onCarChange(this.contractData.carid);
    this.showCreateEditModal = true;
  }

  deleteContract(contract: Contract): void {
    this.showConfirmDialog(
      'Confirm Delete',
      `Are you sure you want to delete <strong>Contract ${this.getContractDisplayId(contract._id)}</strong>? This action cannot be undone.`,
      () => {
        this.contractService.deleteContract(contract._id!).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.contracts = this.contracts.filter(c => c._id !== contract._id);
              this.applyFilters();
              this.showSuccessDialog('Contract deleted successfully!');
            } else {
              this.showErrorDialog(`Failed to delete contract: ${response.message}`);
            }
          },
          error: (err) => {
            this.showErrorDialog(`Error deleting contract: ${err.message || 'Unknown error'}`);
          }
        });
      }
    );
  }

  // File handling
  onFilesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = files.slice(0, 5); // Limit to 5 files
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  onDocumentFilesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.newDocumentFiles = files.slice(0, 5); // Limit to 5 files
  }

  removeNewDocumentFile(index: number): void {
    this.newDocumentFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Form submission
  submitContractForm(): void {
    if (!this.contractData.carid || !this.contractData.userid || !this.contractData.ticketid) {
      this.showErrorDialog('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;

    if (this.isEditMode && this.currentContractId) {
      // For edit mode, we only update basic contract data
      this.contractService.updateContract(this.currentContractId, this.contractData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.status === 'success') {
            this.loadContracts();
            this.closeCreateEditModal();
            this.showSuccessDialog('Contract updated successfully!');
          } else {
            this.showErrorDialog(`Failed to update contract: ${response.message}`);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showErrorDialog(`Error updating contract: ${err.message || 'Unknown error'}`);
        }
      });
    } else {
      // For create mode, create contract with optional files
      if (this.selectedFiles.length > 0) {
        this.contractService.createContractWithFiles(this.contractData, this.selectedFiles).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.status === 'success') {
              this.loadContracts();
              this.closeCreateEditModal();
              this.showSuccessDialog('Contract created successfully with documents!');
            } else {
              this.showErrorDialog(`Failed to create contract: ${response.message}`);
            }
          },
          error: (err) => {
            this.isSubmitting = false;
            this.showErrorDialog(`Error creating contract: ${err.message || 'Unknown error'}`);
          }
        });
      } else {
        this.contractService.createContract(this.contractData).subscribe({
          next: (response) => {
            this.isSubmitting = false;
            if (response.status === 'success') {
              this.loadContracts();
              this.closeCreateEditModal();
              this.showSuccessDialog('Contract created successfully!');
            } else {
              this.showErrorDialog(`Failed to create contract: ${response.message}`);
            }
          },
          error: (err) => {
            this.isSubmitting = false;
            this.showErrorDialog(`Error creating contract: ${err.message || 'Unknown error'}`);
          }
        });
      }
    }
  }

  // Car selection handler
  onCarChange(carId: string): void {
    if (carId) {
      // Filter tickets for the selected car
      this.availableTickets = this.tickets.filter(ticket => {
        const ticketCarId = typeof ticket.carid === 'string' ? ticket.carid : ticket.carid._id;
        return ticketCarId === carId;
      });
    } else {
      this.availableTickets = [];
    }
    
    // Reset ticket selection if the selected car changes
    this.contractData.ticketid = '';
  }

  // Document management
  manageDocuments(contract: Contract): void {
    this.currentContract = contract;
    this.selectedDocuments = new Array(contract.contract_docs?.length || 0).fill(false);
    this.newDocumentFiles = [];
    this.showDocumentModal = true;
  }

  hasSelectedDocuments(): boolean {
    return this.selectedDocuments.some(selected => selected);
  }

  deleteSelectedDocuments(): void {
    if (!this.currentContract || !this.hasSelectedDocuments()) {
      return;
    }

    const selectedIndexes = this.selectedDocuments
      .map((selected, index) => selected ? index : -1)
      .filter(index => index !== -1);

    this.contractService.deleteContractDocuments(this.currentContract._id!, selectedIndexes).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.loadContracts();
          this.currentContract = response.body.contract || this.currentContract;
          if (this.currentContract) {
            this.selectedDocuments = new Array(this.currentContract.contract_docs?.length || 0).fill(false);
          }
          this.showSuccessDialog('Documents deleted successfully!');
        } else {
          this.showErrorDialog(`Failed to delete documents: ${response.message}`);
        }
      },
      error: (err) => {
        this.showErrorDialog(`Error deleting documents: ${err.message || 'Unknown error'}`);
      }
    });
  }

  uploadNewDocuments(): void {
    if (!this.currentContract || this.newDocumentFiles.length === 0) {
      return;
    }

    this.isUploading = true;
    this.contractService.uploadContractDocuments(this.currentContract._id!, this.newDocumentFiles).subscribe({
      next: (response) => {
        this.isUploading = false;
        if (response.status === 'success') {
          this.loadContracts();
          this.currentContract = response.body.contract || this.currentContract;
          this.newDocumentFiles = [];
          if (this.currentContract) {
            this.selectedDocuments = new Array(this.currentContract.contract_docs?.length || 0).fill(false);
          }
          this.showSuccessDialog('Documents uploaded successfully!');
        } else {
          this.showErrorDialog(`Failed to upload documents: ${response.message}`);
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.showErrorDialog(`Error uploading documents: ${err.message || 'Unknown error'}`);
      }
    });
  }

  viewDocument(contractId: string, docIndex: number): void {
    this.contractService.getContractDocumentUrl(contractId, docIndex).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.documentUrl) {
          window.open(response.body.documentUrl, '_blank');
        } else {
          this.showErrorDialog('Failed to get document URL');
        }
      },
      error: (err) => {
        this.showErrorDialog(`Error viewing document: ${err.message || 'Unknown error'}`);
      }
    });
  }

  downloadDocument(contractId: string, docIndex: number): void {
    this.contractService.downloadContractDocument(contractId, docIndex).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contract_document_${docIndex + 1}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.showErrorDialog(`Error downloading document: ${err.message || 'Unknown error'}`);
      }
    });
  }

  // Helper methods for displaying contract data
  getContractDisplayId(contractId?: string): string {
    if (!contractId) return 'N/A';
    return contractId.substring(0, 8).toUpperCase();
  }

  getUserName(user: any): string {
    if (typeof user === 'string') {
      const foundUser = this.users.find(u => u._id === user);
      return foundUser ? foundUser.name : 'Unknown User';
    }
    return user?.name || 'Unknown User';
  }

  getUserEmail(user: any): string {
    if (typeof user === 'string') {
      const foundUser = this.users.find(u => u._id === user);
      return foundUser ? foundUser.email : '';
    }
    return user?.email || '';
  }

  getUserPhone(user: any): string {
    if (typeof user === 'string') {
      const foundUser = this.users.find(u => u._id === user);
      return foundUser ? (foundUser.phone || '') : '';
    }
    return user?.phone || '';
  }

  getUserLocation(user: any): string {
    if (typeof user === 'string') {
      const foundUser = this.users.find(u => u._id === user);
      return foundUser ? (foundUser.location || '') : '';
    }
    return user?.location || '';
  }

  getUserInitials(user: any): string {
    const name = this.getUserName(user);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  getCarName(car: any): string {
    if (typeof car === 'string') {
      const foundCar = this.cars.find(c => c._id === car);
      return foundCar ? foundCar.carname : 'Unknown Car';
    }
    return car?.carname || 'Unknown Car';
  }

  getCarBrand(car: any): string {
    if (typeof car === 'string') {
      const foundCar = this.cars.find(c => c._id === car);
      return foundCar ? foundCar.brandname : '';
    }
    return car?.brandname || '';
  }

  getCarColor(car: any): string {
    if (typeof car === 'string') {
      const foundCar = this.cars.find(c => c._id === car);
      return foundCar ? foundCar.color : '';
    }
    return car?.color || '';
  }

  getCarSeating(car: any): number {
    if (typeof car === 'string') {
      const foundCar = this.cars.find(c => c._id === car);
      return foundCar ? foundCar.seating : 0;
    }
    return car?.seating || 0;
  }

  getCarImage(car: any): string {
    if (typeof car === 'string') {
      const foundCar = this.cars.find(c => c._id === car);
      return foundCar?.images?.[0] || '';
    }
    return car?.images?.[0] || '';
  }

  getTicketId(ticket: any): string {
    if (typeof ticket === 'string') {
      const foundTicket = this.tickets.find(t => t._id === ticket);
      return foundTicket ? foundTicket.ticketcustomid : 'Unknown Ticket';
    }
    return ticket?.ticketcustomid || 'Unknown Ticket';
  }

  getTicketPrice(ticket: any): number {
    if (typeof ticket === 'string') {
      const foundTicket = this.tickets.find(t => t._id === ticket);
      return foundTicket ? foundTicket.ticketprice : 0;
    }
    return ticket?.ticketprice || 0;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  // Safe getter for current contract documents
  get currentContractDocs(): string[] {
    return this.currentContract?.contract_docs || [];
  }

  // Safe getter to check if current contract has documents
  get hasCurrentContractDocs(): boolean {
    return (this.currentContract?.contract_docs?.length || 0) > 0;
  }

  // Safe getter for current contract ID
  getCurrentContractId(): string | undefined {
    return this.currentContract?._id;
  }

  // Export functionality
  exportData() {
    this.exportToExcel();
  }

  exportToPDF() {
    // This method is kept for backward compatibility but should not be used
    return;
  }

  exportToExcel() {
    const exportData = this.filteredContracts.map(contract => ({
      contractId: this.getContractDisplayId(contract._id),
      userName: this.getUserName(contract.userid),
      userEmail: this.getUserEmail(contract.userid),
      userPhone: this.getUserPhone(contract.userid) || '',
      userLocation: this.getUserLocation(contract.userid) || '',
      carName: this.getCarName(contract.carid),
      carBrand: this.getCarBrand(contract.carid),
      carColor: this.getCarColor(contract.carid),
      carSeating: this.getCarSeating(contract.carid),
      ticketId: this.getTicketId(contract.ticketid),
      ticketPrice: this.getTicketPrice(contract.ticketid),
      documentsCount: contract.contract_docs?.length || 0,
      documentsList: contract.contract_docs?.join(', ') || '',
      createdBy: contract.createdByModel || '',
      createdDate: contract.createdat || contract.createdAt || '',
      fullContractId: contract._id || ''
    }));

    const options: ExportOptions = {
      filename: `contracts-data-${new Date().toISOString().split('T')[0]}`,
      title: 'Contracts Management Report',
      columns: [
        { header: 'Contract ID', key: 'contractId', width: 25 },
        { header: 'User Name', key: 'userName', width: 25 },
        { header: 'Email', key: 'userEmail', width: 30 },
        { header: 'Phone', key: 'userPhone', width: 15 },
        { header: 'Location', key: 'userLocation', width: 25 },
        { header: 'Car', key: 'carName', width: 20 },
        { header: 'Brand', key: 'carBrand', width: 20 },
        { header: 'Color', key: 'carColor', width: 15 },
        { header: 'Seating', key: 'carSeating', width: 10 },
        { header: 'Ticket ID', key: 'ticketId', width: 20 },
        { header: 'Ticket Price', key: 'ticketPrice', width: 15 },
        { header: 'Documents Count', key: 'documentsCount', width: 15 },
        { header: 'Documents List', key: 'documentsList', width: 40 },
        { header: 'Created By', key: 'createdBy', width: 15 },
        { header: 'Created Date', key: 'createdDate', width: 20 },
        { header: 'Full Contract ID', key: 'fullContractId', width: 30 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

  private   formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }


}
