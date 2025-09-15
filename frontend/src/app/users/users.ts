import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User } from '../services/user.service';
import { KycService, KYCResponse } from '../services/kyc.service';
import { TicketService } from '../services/ticket.service';
import { TokenService } from '../services/token.service';
import { BookNowTokenService } from '../services/book-now-token.service';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../shared/dialog/dialog.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
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
  imports: [CommonModule, FormsModule, DialogComponent, LoadingDialogComponent],
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
  
  // User details data
  userTickets = signal<any[]>([]);
  userTokens = signal<any[]>([]);
  userBookNowTokens = signal<any[]>([]);
  loadingUserDetails = signal(false);
  activeTab = signal<string>('tickets');
  
  // Rejection form
  rejectionComment = signal('');
  
  // User form data
  userForm = {
    name: '',
    email: '',
    phone: '',
    dateofbirth: '',
    location: '',
    pincode: '',
    address: ''
  };
  
  editingUserId = signal<string | null>(null);
  
  // UI State
  loading: boolean = false;
  showLoadingDialog: boolean = false;
  loadingMessage: string = '';
  
  // KYC Status options
  uniqueKycStatuses: string[] = ['pending', 'submitted', 'approved', 'rejected'];
  
  // Computed properties
  filteredKycUsers = computed(() => {
    let usersArray = this.users();
    
    // Filter by status
    if (this.kycStatusFilter() !== 'all') {
      usersArray = usersArray.filter(user => user.kycStatus === this.kycStatusFilter());
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
    public dialogService: DialogService,
    private exportService: ExportService
  ) {}
  
  ngOnInit(): void {
    this.loadUsers();
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
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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
  
  closeModals() {
    this.showDetailsModal.set(false);
    this.showRejectModal.set(false);
    this.showAddUserModal.set(false);
    this.showEditUserModal.set(false);
    this.selectedUser.set(null);
    this.rejectionComment.set('');
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
      phone: '',
      dateofbirth: '',
      location: '',
      pincode: '',
      address: ''
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
      phone: user.phone || '',
      dateofbirth: user.dateofbirth || '',
      location: user.location || '',
      pincode: user.pincode || '',
      address: user.address || ''
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

    this.isLoading.set(true);
    
    try {
      const isEditing = this.editingUserId();
      
      if (isEditing) {
        // Update existing user
        const response = await this.userService.updateProfile(formData).toPromise();
        if (response?.status === 'success') {
          this.success.set('User updated successfully');
          await this.loadUsers();
          this.closeModals();
        } else {
          this.error.set('Failed to update user');
        }
      } else {
        // Create new user - Note: You'll need to add a createUser method to UserService
        // For now, simulating the creation
        this.success.set('User creation functionality needs to be implemented in the backend');
        this.closeModals();
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to save user');
    } finally {
      this.isLoading.set(false);
    }
  }

  clearMessages() {
    this.error.set(null);
    this.success.set(null);
  }
  
  deleteUser(user: ExtendedUser): void {
    this.dialogService.showDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      type: 'error',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel'
    }).then((confirmed) => {
      if (confirmed) {
        this.performDeleteUser(user);
      }
    });
  }
  
  private performDeleteUser(user: ExtendedUser): void {
    this.loading = true;
    this.showLoadingDialog = true;
    this.loadingMessage = 'Deleting user...';
    
    // Remove user locally
    const usersArray = this.users();
    const userIndex = usersArray.findIndex(u => u._id === user._id);
    if (userIndex !== -1) {
      usersArray.splice(userIndex, 1);
      this.users.set([...usersArray]);
    }
    
    // Simulate API call (replace with actual API call when available)
    setTimeout(() => {
      this.loading = false;
      this.showLoadingDialog = false;
      this.dialogService.showDialog({
        title: 'Success',
        message: 'User deleted successfully!',
        type: 'success'
      });
    }, 1000);
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
  
  getKycStatusClass(status: string | undefined): string {
    switch (status) {
      case 'approved':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-badge-approved';
      case 'rejected':
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-badge-rejected';
      case 'pending':
      default:
        return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-badge-pending';
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
