import { Component, OnInit, signal, computed, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User, UserStatusResponse, UsersByStatusResponse, UserStatusHistoryResponse, SuspensionStatsResponse, UserPermissionsResponse } from '../services/user.service';
import { KycService, KYCResponse } from '../services/kyc.service';
import { TicketService } from '../services/ticket.service';
import { TokenService } from '../services/token.service';
import { BookNowTokenService } from '../services/book-now-token.service';
import { AuthService } from '../services/auth.service';
import { LoadingDialogComponent } from '../shared/loading-dialog/loading-dialog.component';
import { ExportService, ExportOptions } from '../services/export.service';

// Extended User interface to include KYC-specific fields
interface ExtendedUser extends User {
  kycDocs?: string[];
  rejected_comments?: Array<{
    comment: string;
    date: Date;
  }>;
  kycApprovedBy?: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingDialogComponent],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  // Signals for reactive state management
  users = signal<ExtendedUser[]>([]);
  filteredUsers = signal<ExtendedUser[]>([]);
  selectedUser = signal<ExtendedUser | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // Filter and search
  searchTerm = signal('');
  kycStatusFilter = signal<'all' | 'pending' | 'submitted' | 'approved' | 'rejected'>('all');
  userStatusFilter = signal<'all' | 'active' | 'suspended' | 'deactivated'>('all');
  dateRangeFilter = signal('all');
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Modal states
  showDetailsModal = signal(false);
  showRejectModal = signal(false);
  showAddUserModal = signal(false);
  showEditUserModal = signal(false);
  showStatusModal = signal(false);
  showStatusHistoryModal = signal(false);
  showSuspensionStatsModal = signal(false);
  
  // User details data
  userTickets = signal<any[]>([]);
  userTokens = signal<any[]>([]);
  userBookNowTokens = signal<any[]>([]);
  loadingUserDetails = signal(false);
  activeTab = signal<string>('tickets');
  
  // Rejection form
  rejectionComment = signal('');
  
  // Status management forms
  statusAction = signal<'suspend' | 'deactivate' | 'reactivate'>('suspend');
  statusReason = signal('');
  statusHistory = signal<any>(null);
  suspensionStats = signal<any>(null);
  
  // User form data
  userForm = {
    name: '',
    email: '',
    password: '',
    phone: '',
    dateofbirth: '',
    location: '',
    pincode: '',
    address: '',
    kycFile: null as File | null
  };
  
  editingUserId = signal<string | null>(null);
  
  // UI State
  loading: boolean = false;
  showLoadingDialog: boolean = false;
  loadingMessage: string = '';
  private dialogElement: HTMLElement | null = null;
  
  // File handling
  onKycFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        this.error.set('Please select a PDF file for KYC documents');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.error.set('File size must be less than 10MB');
        return;
      }
      this.userForm.kycFile = file;
      this.error.set(null); // Clear any previous errors
    }
  }
  
  removeKycFile() {
    this.userForm.kycFile = null;
    // Reset the file input
    const fileInput = document.getElementById('kycFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  // KYC Status options
  uniqueKycStatuses: string[] = ['pending', 'submitted', 'approved', 'rejected'];
  
  // Computed properties
  filteredKycUsers = computed(() => {
    let usersArray = this.users();
    
    // Filter by KYC status
    if (this.kycStatusFilter() !== 'all') {
      usersArray = usersArray.filter(user => user.kycStatus === this.kycStatusFilter());
    }
    
    // Filter by user status
    if (this.userStatusFilter() !== 'all') {
      usersArray = usersArray.filter(user => user.status === this.userStatusFilter());
    }
    
    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      usersArray = usersArray.filter(user => 
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone?.toLowerCase().includes(search) ||
        user.location?.toLowerCase().includes(search) ||
        user.governmentid?.aadharid?.toLowerCase().includes(search) ||
        user.governmentid?.panid?.toLowerCase().includes(search)
      );
    }
    
    // Update pagination when filters change
    this.currentPage = 1;
    this.totalPages = Math.ceil(usersArray.length / this.itemsPerPage);
    
    return usersArray;
  });

  // Paginated users for display
  paginatedUsers = computed(() => {
    const filtered = this.filteredKycUsers();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  });

  statusCounts = computed(() => {
    const usersArray = this.users();
    return {
      total: usersArray.length,
      active: usersArray.filter(u => u.status === 'active' || !u.status).length,
      suspended: usersArray.filter(u => u.status === 'suspended').length,
      deactivated: usersArray.filter(u => u.status === 'deactivated').length,
      pending: usersArray.filter(u => u.kycStatus === 'pending').length,
      submitted: usersArray.filter(u => u.kycStatus === 'submitted').length,
      approved: usersArray.filter(u => u.kycStatus === 'approved').length,
      rejected: usersArray.filter(u => u.kycStatus === 'rejected').length
    };
  });

  // Tab state computed properties
  isTicketsTabActive = computed(() => this.activeTab() === 'tickets');
  isTokensTabActive = computed(() => this.activeTab() === 'tokens');
  isBookNowTokensTabActive = computed(() => this.activeTab() === 'bookNowTokens');

  constructor(
    private userService: UserService,
    private kycService: KycService,
    private ticketService: TicketService,
    private tokenService: TokenService,
    private bookNowTokenService: BookNowTokenService,
    private authService: AuthService,
    private router: Router,
    private exportService: ExportService,
    private renderer: Renderer2
  ) {}
  
  ngOnInit(): void {
    this.loadUsers();
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
  
  async loadUsers() {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      // Load both users and KYC data
      const [usersResponse, kycResponse] = await Promise.all([
        this.userService.getUsers().toPromise(),
        this.kycService.getAllKycRequests().toPromise()
      ]);
      
      if (usersResponse?.status === 'success') {
        const users = usersResponse.body.users;
        const kycUsers = kycResponse?.body?.users || [];
        
        // Merge KYC data with user data
        const extendedUsers = users.map(user => {
          const kycUser = kycUsers.find((kyc: any) => kyc._id === user._id);
          return {
            ...user,
            kycDocs: kycUser?.kycDocs || [],
            rejected_comments: kycUser?.rejected_comments || [],
            kycApprovedBy: kycUser?.kycApprovedBy
          };
        });
        
        this.users.set(extendedUsers);
        this.filteredUsers.set(this.filteredKycUsers());
      } else {
        this.error.set('Failed to load users');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load users');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  onSearchChange() {
    this.filteredUsers.set(this.filteredKycUsers());
  }

  onKycStatusFilterChange() {
    this.filteredUsers.set(this.filteredKycUsers());
  }

  onDateRangeFilterChange() {
    this.filteredUsers.set(this.filteredKycUsers());
  }

  onUserStatusFilterChange() {
    this.filteredUsers.set(this.filteredKycUsers());
  }
  
  // Pagination methods
  goToPage(page: number) {
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

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }
  
  updatePagination(): void {
    // This method is no longer needed as pagination is computed
  }
  
  clearFilters(): void {
    this.searchTerm.set('');
    this.kycStatusFilter.set('all');
    this.userStatusFilter.set('all');
    this.dateRangeFilter.set('all');
    this.currentPage = 1;
    this.onSearchChange();
  }
  
  async viewUserDetails(user: ExtendedUser) {
    try {
      const response = await this.kycService.getKycDetails(user._id!).toPromise();
      if (response?.status === 'success') {
        this.selectedUser.set(response.body.user);
        this.showDetailsModal.set(true);
        await this.loadUserAdditionalDetails(user._id!);
      } else {
        this.selectedUser.set(user);
        this.showDetailsModal.set(true);
        await this.loadUserAdditionalDetails(user._id!);
      }
    } catch (err: any) {
      // If KYC details fail to load, show basic user details
      this.selectedUser.set(user);
      this.showDetailsModal.set(true);
      await this.loadUserAdditionalDetails(user._id!);
    }
  }

  async loadUserAdditionalDetails(userId: string) {
    this.loadingUserDetails.set(true);
    try {
      // Load user tickets, tokens, and book now tokens in parallel
      const [ticketsResponse, tokensResponse, bookNowTokensResponse] = await Promise.all([
        this.ticketService.getTickets().toPromise(),
        this.tokenService.getTokens().toPromise(),
        this.bookNowTokenService.getBookNowTokens().toPromise()
      ]);

      // Filter tickets for this user
      const allTickets = ticketsResponse?.body?.tickets || [];
      const userTickets = allTickets.filter((ticket: any) => {
        const ticketUserId = typeof ticket.userid === 'string' ? ticket.userid : ticket.userid?._id;
        return ticketUserId === userId;
      });
      this.userTickets.set(userTickets);

      // Filter tokens for this user
      const allTokens = tokensResponse?.body?.tokens || [];
      const userTokens = allTokens.filter((token: any) => {
        const tokenUserId = typeof token.userid === 'string' ? token.userid : token.userid?._id;
        return tokenUserId === userId;
      });
      this.userTokens.set(userTokens);

      // Filter book now tokens for this user
      const allBookNowTokens = bookNowTokensResponse?.body?.bookNowTokens || [];
      const userBookNowTokens = allBookNowTokens.filter((token: any) => {
        const tokenUserId = typeof token.userid === 'string' ? token.userid : token.userid?._id;
        return tokenUserId === userId;
      });
      this.userBookNowTokens.set(userBookNowTokens);

    } catch (err: any) {
      console.error('Error loading user additional details:', err);
      this.userTickets.set([]);
      this.userTokens.set([]);
      this.userBookNowTokens.set([]);
    } finally {
      this.loadingUserDetails.set(false);
    }
  }
  
  closeUserDialog(): void {
    this.closeModals();
  }
  
  async approveKyc(userId: string) {
    if (!confirm('Are you sure you want to approve this KYC request?')) {
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await this.kycService.approveKyc(userId).toPromise();
      if (response?.status === 'success') {
        this.success.set('KYC request approved successfully');
        await this.loadUsers();
        this.closeModals();
      } else {
        this.error.set('Failed to approve KYC request');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to approve KYC request');
    } finally {
      this.isLoading.set(false);
    }
  }

  openRejectModal(user: ExtendedUser) {
    this.selectedUser.set(user);
    this.rejectionComment.set('');
    this.showRejectModal.set(true);
  }

  async rejectKyc() {
    if (!this.selectedUser() || !this.rejectionComment().trim()) {
      this.error.set('Please provide a rejection reason');
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await this.kycService.rejectKyc(
        this.selectedUser()!._id!, 
        this.rejectionComment()
      ).toPromise();
      
      if (response?.status === 'success') {
        this.success.set('KYC request rejected successfully');
        await this.loadUsers();
        this.closeModals();
      } else {
        this.error.set('Failed to reject KYC request');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to reject KYC request');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Status management methods
  openStatusModal(user: ExtendedUser, action: 'suspend' | 'deactivate' | 'reactivate') {
    this.selectedUser.set(user);
    this.statusAction.set(action);
    this.statusReason.set('');
    this.showStatusModal.set(true);
  }

  async performStatusAction() {
    if (!this.selectedUser() || !this.statusReason().trim()) {
      this.error.set('Please provide a reason for this action');
      return;
    }

    this.isLoading.set(true);
    try {
      let response: UserStatusResponse;
      const userId = this.selectedUser()!._id!;
      const reason = this.statusReason();

      switch (this.statusAction()) {
        case 'suspend':
          response = await this.userService.suspendUser(userId, reason).toPromise() as UserStatusResponse;
          break;
        case 'deactivate':
          response = await this.userService.deactivateUser(userId, reason).toPromise() as UserStatusResponse;
          break;
        case 'reactivate':
          response = await this.userService.reactivateUser(userId, reason).toPromise() as UserStatusResponse;
          break;
        default:
          throw new Error('Invalid status action');
      }

      if (response?.status === 'success') {
        this.success.set(`User ${this.statusAction()}d successfully`);
        await this.loadUsers();
        this.closeModals();
      } else {
        this.error.set(response?.message || `Failed to ${this.statusAction()} user`);
      }
    } catch (err: any) {
      this.error.set(err.error?.message || err.message || `Failed to ${this.statusAction()} user`);
    } finally {
      this.isLoading.set(false);
    }
  }

  async viewStatusHistory(user: ExtendedUser) {
    this.isLoading.set(true);
    try {
      const response = await this.userService.getUserStatusHistory(user._id!).toPromise() as UserStatusHistoryResponse;
      if (response?.status === 'success') {
        this.statusHistory.set(response.body.history);
        this.selectedUser.set(user);
        this.showStatusHistoryModal.set(true);
      } else {
        this.error.set('Failed to load status history');
      }
    } catch (err: any) {
      this.error.set(err.error?.message || err.message || 'Failed to load status history');
    } finally {
      this.isLoading.set(false);
    }
  }

  async viewSuspensionStats() {
    this.isLoading.set(true);
    try {
      const response = await this.userService.getSuspensionStats().toPromise() as SuspensionStatsResponse;
      if (response?.status === 'success') {
        this.suspensionStats.set(response.body.stats);
        this.showSuspensionStatsModal.set(true);
      } else {
        this.error.set('Failed to load suspension statistics');
      }
    } catch (err: any) {
      this.error.set(err.error?.message || err.message || 'Failed to load suspension statistics');
    } finally {
      this.isLoading.set(false);
    }
  }

  async checkUserPermissions(user: ExtendedUser) {
    try {
      const response = await this.userService.checkUserPermissions(user._id!).toPromise() as UserPermissionsResponse;
      if (response?.status === 'success') {
        const permissions = response.body.permissions;
        if (!permissions.canPerform) {
          this.error.set(`User cannot perform actions: ${permissions.reason}`);
        } else {
          this.success.set('User can perform actions normally');
        }
      }
    } catch (err: any) {
      this.error.set(err.error?.message || err.message || 'Failed to check user permissions');
    }
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'active':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800';
      case 'suspended':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
      case 'deactivated':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
      default:
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string | undefined): string {
    switch (status) {
      case 'active':
        return '✓';
      case 'suspended':
        return '⚠';
      case 'deactivated':
        return '✗';
      default:
        return '?';
    }
  }

  formatSuspensionEndDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  closeModals() {
    this.showDetailsModal.set(false);
    this.showRejectModal.set(false);
    this.showAddUserModal.set(false);
    this.showEditUserModal.set(false);
    this.showStatusModal.set(false);
    this.showStatusHistoryModal.set(false);
    this.showSuspensionStatsModal.set(false);
    this.selectedUser.set(null);
    this.rejectionComment.set('');
    this.statusReason.set('');
    this.statusHistory.set(null);
    this.suspensionStats.set(null);
    this.editingUserId.set(null);
    this.resetUserForm();
    this.error.set(null);
    this.success.set(null);
    // Clear user additional details
    this.userTickets.set([]);
    this.userTokens.set([]);
    this.userBookNowTokens.set([]);
    this.loadingUserDetails.set(false);
    this.activeTab.set('tickets');
  }

  resetUserForm() {
    this.userForm = {
      name: '',
      email: '',
      password: '',
      phone: '',
      dateofbirth: '',
      location: '',
      pincode: '',
      address: '',
      kycFile: null
    };
  }

  openAddUserModal() {
    this.resetUserForm();
    this.showAddUserModal.set(true);
  }

  openEditUserModal(user: ExtendedUser) {
    this.userForm = {
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't populate password for editing
      phone: user.phone || '',
      dateofbirth: user.dateofbirth || '',
      location: user.location || '',
      pincode: user.pincode || '',
      address: user.address || '',
      kycFile: null // Reset KYC file
    };
    this.editingUserId.set(user._id!);
    this.showEditUserModal.set(true);
  }

  async saveUser() {
    const formData = this.userForm;
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim()) {
      this.error.set('Name and email are required');
      return;
    }

    // For new users, password is required
    const isEditing = this.editingUserId();
    if (!isEditing && !formData.password.trim()) {
      this.error.set('Password is required for new users');
      return;
    }

    this.isLoading.set(true);
    
    try {
      if (isEditing) {
        // Update existing user
        let updateData: any;
        
        if (formData.kycFile) {
          // If KYC file is present, use FormData
          updateData = new FormData();
          updateData.append('name', formData.name.trim());
          updateData.append('email', formData.email.trim());
          updateData.append('phone', formData.phone.trim());
          updateData.append('dateofbirth', formData.dateofbirth);
          updateData.append('location', formData.location.trim());
          updateData.append('pincode', formData.pincode.trim());
          updateData.append('address', formData.address.trim());
          if (formData.password.trim()) {
            updateData.append('password', formData.password.trim());
          }
          updateData.append('kycFile', formData.kycFile);
        } else {
          // No file, use regular object with trimmed values
          updateData = {
            ...formData,
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            location: formData.location.trim(),
            pincode: formData.pincode.trim(),
            address: formData.address.trim()
          };
          // Remove password if empty (don't update password)
          if (!updateData.password.trim()) {
            delete updateData.password;
          } else {
            updateData.password = updateData.password.trim();
          }
          delete updateData.kycFile; // Remove kycFile from regular object
        }
        
        const response = await this.userService.updateUserById(isEditing, updateData).toPromise();
        if (response?.status === 'success') {
          this.success.set('User updated successfully');
          await this.loadUsers();
          this.closeModals();
        } else {
          this.error.set(response?.message || 'Failed to update user');
        }
      } else {
        // Create new user
        let createData: any;
        
        if (formData.kycFile) {
          // If KYC file is present, use FormData
          createData = new FormData();
          createData.append('name', formData.name.trim());
          createData.append('email', formData.email.trim());
          createData.append('password', formData.password.trim());
          createData.append('phone', formData.phone.trim());
          createData.append('dateofbirth', formData.dateofbirth);
          createData.append('location', formData.location.trim());
          createData.append('pincode', formData.pincode.trim());
          createData.append('address', formData.address.trim());
          createData.append('kycFile', formData.kycFile);
        } else {
          // No file, use regular object with trimmed values
          createData = {
            ...formData,
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
            phone: formData.phone.trim(),
            location: formData.location.trim(),
            pincode: formData.pincode.trim(),
            address: formData.address.trim()
          };
          delete createData.kycFile; // Remove kycFile from regular object
        }
        
        const response = await this.userService.createUser(createData).toPromise();
        if (response?.status === 'success') {
          this.success.set('User created successfully');
          await this.loadUsers();
          this.closeModals();
        } else {
          this.error.set(response?.message || 'Failed to create user');
        }
      }
    } catch (err: any) {
      this.error.set(err.error?.message || err.message || 'Failed to save user');
    } finally {
      this.isLoading.set(false);
    }
  }

  clearMessages() {
    this.error.set(null);
    this.success.set(null);
  }
  
  deleteUser(user: ExtendedUser): void {
    this.showConfirmDialog('Delete User', `Are you sure you want to delete ${user.name}? This action cannot be undone.`, () => {
      this.performDeleteUser(user);
    });
  }
  
  private async performDeleteUser(user: ExtendedUser): Promise<void> {
    this.loading = true;
    this.showLoadingDialog = true;
    this.loadingMessage = 'Deleting user...';
    
    try {
      const response = await this.userService.deleteUserById(user._id!).toPromise();
      
      if (response?.status === 'success') {
        // Remove user from local array
        const usersArray = this.users();
        const userIndex = usersArray.findIndex(u => u._id === user._id);
        if (userIndex !== -1) {
          usersArray.splice(userIndex, 1);
          this.users.set([...usersArray]);
        }
        
        this.showSuccessDialog('User deleted successfully!');
      } else {
        this.showErrorDialog(response?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      this.showErrorDialog(error.error?.message || error.message || 'Failed to delete user');
    } finally {
      this.loading = false;
      this.showLoadingDialog = false;
    }
  }
  
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
  
  getKycStatusClass(status: string | undefined): string {
    switch (status) {
      case 'approved':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-approved';
      case 'rejected':
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-rejected';
      case 'pending':
      default:
        return 'inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium status-badge-pending';
    }
  }
  
  getUserImage(user: ExtendedUser): string {
    // Return SVG data URL if no profile image
    if (!user.profileimage) {
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="50" fill="#374151"/>
          <circle cx="50" cy="35" r="15" fill="#9CA3AF"/>
          <path d="M50 55c-15 0-25 10-25 20v25h50V75c0-10-10-20-25-20z" fill="#9CA3AF"/>
        </svg>
      `);
    }
    return user.profileimage;
  }
  
  onImageError(event: any): void {
    // Set SVG placeholder on image error
    event.target.src = 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="50" fill="#374151"/>
        <circle cx="50" cy="35" r="15" fill="#9CA3AF"/>
        <path d="M50 55c-15 0-25 10-25 20v25h50V75c0-10-10-20-25-20z" fill="#9CA3AF"/>
      </svg>
    `);
  }

  // Helper method to display values or "Not provided"
  getDisplayValue(value: string | undefined, fallback: string = 'Not provided'): string {
    return value && value.trim() ? value : fallback;
  }
  
  get Math() {
    return Math;
  }

  // User form methods
  updateUserFormField(field: string, value: string) {
    this.userForm = { ...this.userForm, [field]: value };
  }

  hasKycDocs(user: ExtendedUser): boolean {
    return !!(user.kycDocs && user.kycDocs.length > 0);
  }

  // Helper method for document icon SVG
  getDocumentIconSvg(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#9CA3AF">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>
    `);
  }

  // Helper method for KYC status icon SVG
  getKycStatusIconSvg(status: string): string {
    const icons = {
      'pending': '<circle cx="12" cy="12" r="10" fill="#F59E0B"/><path d="M12 6v6l4 2" stroke="white" stroke-width="2" fill="none"/>',
      'submitted': '<circle cx="12" cy="12" r="10" fill="#3B82F6"/><path d="M12 8v4" stroke="white" stroke-width="2"/><circle cx="12" cy="16" r="1" fill="white"/>',
      'approved': '<circle cx="12" cy="12" r="10" fill="#10B981"/><path d="m9 12 2 2 4-4" stroke="white" stroke-width="2" fill="none"/>',
      'rejected': '<circle cx="12" cy="12" r="10" fill="#EF4444"/><path d="m15 9-6 6M9 9l6 6" stroke="white" stroke-width="2"/>'
    };
    
    const iconPath = icons[status as keyof typeof icons] || icons['pending'];
    
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
        ${iconPath}
      </svg>
    `);
  }

  downloadDocument(url: string, filename: string) {
    if (!url || !url.trim()) {
      this.error.set('Document URL is not available');
      setTimeout(() => {
        this.error.set(null);
      }, 3000);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      // Fallback: just open the document in a new tab
      this.viewDocument(url);
    }
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  viewDocument(documentUrl: string) {
    if (documentUrl && documentUrl.trim()) {
      // Open document in a new tab/window
      window.open(documentUrl, '_blank');
    } else {
      // Show error message if document URL is invalid
      this.error.set('Document URL is not available');
      setTimeout(() => {
        this.error.set(null);
      }, 3000);
    }
  }

  // Extract clean document name from Cloudinary URL
  getCleanDocumentName(documentUrl: string, index: number): string {
    if (!documentUrl || !documentUrl.trim()) {
      return `Document ${index + 1}`;
    }

    try {
      // Extract filename from URL
      const url = new URL(documentUrl);
      const pathname = url.pathname;
      
      // Get the last part of the path (filename)
      const segments = pathname.split('/');
      const filename = segments[segments.length - 1];
      
      if (filename) {
        // Check if it's a Cloudinary URL with custom naming
        if (filename.includes('kyc_')) {
          // Extract file extension
          const extension = filename.split('.').pop() || '';
          return `Document ${index + 1}${extension ? '.' + extension : ''}`;
        }
        
        // For other URLs, try to get a clean filename
        const decodedFilename = decodeURIComponent(filename);
        if (decodedFilename.length > 50) {
          return `Document ${index + 1}`;
        }
        
        return decodedFilename;
      }
    } catch (error) {
      // If URL parsing fails, fall back to default naming
      console.warn('Error parsing document URL:', error);
    }
    
    return `Document ${index + 1}`;
  }

  // Get document type from URL for better labeling
  getDocumentType(documentUrl: string): string {
    if (!documentUrl || !documentUrl.trim()) {
      return 'Document';
    }

    const lowerUrl = documentUrl.toLowerCase();
    
    if (lowerUrl.includes('aadhar') || lowerUrl.includes('aadhaar')) {
      return 'Aadhar Card';
    }
    if (lowerUrl.includes('pan')) {
      return 'PAN Card';
    }
    if (lowerUrl.includes('license') || lowerUrl.includes('licence')) {
      return 'License';
    }
    if (lowerUrl.includes('passport')) {
      return 'Passport';
    }
    if (lowerUrl.includes('income')) {
      return 'Income Certificate';
    }
    
    // Check file extension for generic types
    if (lowerUrl.endsWith('.pdf')) {
      return 'PDF Document';
    }
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return 'Image Document';
    }
    
    return 'Document';
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
    const exportData = this.filteredKycUsers().map(user => ({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      dateOfBirth: user.dateofbirth || '',
      location: user.location || '',
      pincode: user.pincode || '',
      address: user.address || '',
      kycStatus: user.kycStatus || 'pending',
      verified: (user as any).verified || false,
      aadharId: user.governmentid?.aadharid || '',
      panId: user.governmentid?.panid || '',
      createdDate: user.createdAt || '',
      kycApprovedBy: user.kycApprovedBy?.name || '',
      totalKycDocs: user.kycDocs?.length || 0,
      rejectedComments: user.rejected_comments?.map(c => c.comment).join('; ') || ''
    }));

    const options: ExportOptions = {
      filename: `users-data-${new Date().toISOString().split('T')[0]}`,
      title: 'Users Management Report',
      columns: [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'Date of Birth', key: 'dateOfBirth', width: 20 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Pincode', key: 'pincode', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'KYC Status', key: 'kycStatus', width: 15 },
        { header: 'Verified', key: 'verified', width: 10 },
        { header: 'Aadhar ID', key: 'aadharId', width: 20 },
        { header: 'PAN ID', key: 'panId', width: 20 },
        { header: 'Created Date', key: 'createdDate', width: 20 },
        { header: 'KYC Approved By', key: 'kycApprovedBy', width: 25 },
        { header: 'Total KYC Docs', key: 'totalKycDocs', width: 15 },
        { header: 'Rejected Comments', key: 'rejectedComments', width: 40 }
      ],
      data: exportData
    };

    this.exportService.exportToExcel(options);
  }

}
