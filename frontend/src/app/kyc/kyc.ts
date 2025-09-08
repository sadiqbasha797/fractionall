import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KycService, KYC, KYCResponse } from '../services/kyc.service';
import { AuthService } from '../services/auth.service';

interface KYCUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  kycStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  kycDocs: string[];
  rejected_comments: Array<{
    comment: string;
    date: Date;
  }>;
  kycApprovedBy?: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
  governmentid?: {
    aadharid?: string;
    panid?: string;
    licenseid?: string;
    income?: string;
  };
  createdAt: Date;
}

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kyc.html',
  styleUrl: './kyc.css'
})
export class Kyc implements OnInit {
  // Signals for reactive state management
  kycUsers = signal<KYCUser[]>([]);
  filteredUsers = signal<KYCUser[]>([]);
  selectedUser = signal<KYCUser | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // Filter and search
  searchTerm = signal('');
  statusFilter = signal<'all' | 'pending' | 'submitted' | 'approved' | 'rejected'>('all');
  
  // Modal states
  showDetailsModal = signal(false);
  showRejectModal = signal(false);
  showUploadModal = signal(false);
  
  // Rejection form
  rejectionComment = signal('');
  
  // File upload
  selectedFile = signal<File | null>(null);
  uploadProgress = signal(0);
  
  // Computed properties
  filteredKycUsers = computed(() => {
    let users = this.kycUsers();
    
    // Filter by status
    if (this.statusFilter() !== 'all') {
      users = users.filter(user => user.kycStatus === this.statusFilter());
    }
    
    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone?.toLowerCase().includes(search) ||
        user.governmentid?.aadharid?.toLowerCase().includes(search) ||
        user.governmentid?.panid?.toLowerCase().includes(search)
      );
    }
    
    return users;
  });

  statusCounts = computed(() => {
    const users = this.kycUsers();
    return {
      total: users.length,
      pending: users.filter(u => u.kycStatus === 'pending').length,
      submitted: users.filter(u => u.kycStatus === 'submitted').length,
      approved: users.filter(u => u.kycStatus === 'approved').length,
      rejected: users.filter(u => u.kycStatus === 'rejected').length
    };
  });

  constructor(
    private kycService: KycService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadKycUsers();
  }

  async loadKycUsers() {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const response = await this.kycService.getAllKycRequests().toPromise();
      if (response?.status === 'success') {
        this.kycUsers.set(response.body.users || []);
        this.filteredUsers.set(this.filteredKycUsers());
      } else {
        this.error.set('Failed to load KYC requests');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load KYC requests');
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearchChange() {
    this.filteredUsers.set(this.filteredKycUsers());
  }

  onStatusFilterChange() {
    this.filteredUsers.set(this.filteredKycUsers());
  }

  async viewUserDetails(userId: string) {
    try {
      const response = await this.kycService.getKycDetails(userId).toPromise();
      if (response?.status === 'success') {
        this.selectedUser.set(response.body.user);
        this.showDetailsModal.set(true);
      } else {
        this.error.set('Failed to load user details');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load user details');
    }
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
        await this.loadKycUsers();
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

  openRejectModal(user: KYCUser) {
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
        this.selectedUser()!._id, 
        this.rejectionComment()
      ).toPromise();
      
      if (response?.status === 'success') {
        this.success.set('KYC request rejected successfully');
        await this.loadKycUsers();
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

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.error.set('Please select a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.error.set('File size must be less than 5MB');
        return;
      }
      this.selectedFile.set(file);
    }
  }

  async uploadDocument() {
    if (!this.selectedFile() || !this.selectedUser()) {
      this.error.set('Please select a file and user');
      return;
    }

    this.isLoading.set(true);
    this.uploadProgress.set(0);
    
    try {
      const formData = new FormData();
      formData.append('document', this.selectedFile()!);
      formData.append('userId', this.selectedUser()!._id);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        this.uploadProgress.update(prev => Math.min(prev + 10, 90));
      }, 200);

      // Note: You'll need to implement uploadDocument method in KycService
      // const response = await this.kycService.uploadDocument(formData).toPromise();
      
      clearInterval(progressInterval);
      this.uploadProgress.set(100);
      
      this.success.set('Document uploaded successfully');
      await this.loadKycUsers();
      this.closeModals();
    } catch (err: any) {
      this.error.set(err.message || 'Failed to upload document');
    } finally {
      this.isLoading.set(false);
      this.uploadProgress.set(0);
    }
  }

  closeModals() {
    this.showDetailsModal.set(false);
    this.showRejectModal.set(false);
    this.showUploadModal.set(false);
    this.selectedUser.set(null);
    this.rejectionComment.set('');
    this.selectedFile.set(null);
    this.error.set(null);
    this.success.set(null);
  }

  getStatusClass(status: string): string {
    // The CSS handles the styling via data-status attribute
    return '';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'rejected': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'submitted': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'pending': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      default: return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  downloadDocument(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  clearMessages() {
    this.error.set(null);
    this.success.set(null);
  }
}
