import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Admin, CreateAdminRequest, EditAdminRequest, UpdateAdminRequest, Permission } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  admins: Admin[] = [];
  availablePermissions: Permission[] = [];
  
  // UI State
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Form data
  selectedAdmin: Admin | null = null;
  adminForm: CreateAdminRequest = {
    name: '',
    email: '',
    password: '',
    phone: '',
    permissions: []
  };
  
  editForm: EditAdminRequest = {
    name: '',
    email: '',
    phone: '',
    permissions: []
  };
  
  // User role check
  isSuperAdmin = false;
  userRole = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkUserRole();
    if (this.isSuperAdmin) {
      this.loadAdmins();
      this.loadPermissions();
    }
  }

  checkUserRole() {
    this.userRole = this.authService.getUserRole() || '';
    this.isSuperAdmin = this.authService.isSuperAdmin();
  }

  loadAdmins() {
    this.isLoading = true;
    this.adminService.getAllAdmins().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.admins = response.body.admins || [];
          this.updatePagination();
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load admins';
        this.isLoading = false;
      }
    });
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.admins.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedAdmins(): Admin[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.admins.slice(startIndex, endIndex);
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

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  loadPermissions() {
    this.availablePermissions = this.adminService.getAvailablePermissions();
  }

  // Create Admin
  openCreateModal() {
    this.adminForm = {
      name: '',
      email: '',
      password: '',
      phone: '',
      permissions: []
    };
    this.showCreateModal = true;
    this.errorMessage = '';
  }

  createAdmin() {
    if (!this.validateForm()) return;

    this.isLoading = true;
    this.adminService.createAdmin(this.adminForm).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.successMessage = 'Admin created successfully';
          this.loadAdmins();
          this.showCreateModal = false;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to create admin';
        this.isLoading = false;
      }
    });
  }

  // Edit Admin
  openEditModal(admin: Admin) {
    this.selectedAdmin = admin;
    this.editForm = {
      name: admin.name,
      email: admin.email,
      phone: admin.phone || '',
      permissions: [...admin.permissions]
    };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  updateAdmin() {
    if (!this.selectedAdmin || !this.validateEditForm()) return;

    this.isLoading = true;
    const updateData: UpdateAdminRequest = {
      name: this.editForm.name,
      email: this.editForm.email,
      phone: this.editForm.phone,
      permissions: this.editForm.permissions
    };

    // Add password to update data if provided
    if (this.editForm.password && this.editForm.password.trim()) {
      (updateData as any).password = this.editForm.password;
    }

    this.adminService.updateAdmin(this.selectedAdmin._id, updateData).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.successMessage = 'Admin updated successfully';
          this.loadAdmins();
          this.showEditModal = false;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update admin';
        this.isLoading = false;
      }
    });
  }

  // Delete Admin
  openDeleteModal(admin: Admin) {
    this.selectedAdmin = admin;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  deleteAdmin() {
    if (!this.selectedAdmin) return;

    this.isLoading = true;
    this.adminService.deleteAdmin(this.selectedAdmin._id).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.successMessage = 'Admin deleted successfully';
          this.loadAdmins();
          this.showDeleteModal = false;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to delete admin';
        this.isLoading = false;
      }
    });
  }

  // Permission Management
  togglePermission(permissionId: string) {
    const permissions = this.showEditModal ? this.editForm.permissions : this.adminForm.permissions;
    const index = permissions.indexOf(permissionId);
    if (index > -1) {
      permissions.splice(index, 1);
    } else {
      permissions.push(permissionId);
    }
  }

  isPermissionSelected(permissionId: string): boolean {
    const permissions = this.showEditModal ? this.editForm.permissions : this.adminForm.permissions;
    return permissions.includes(permissionId);
  }

  // Utility Methods
  validateForm(): boolean {
    if (!this.adminForm.name.trim()) {
      this.errorMessage = 'Name is required';
      return false;
    }
    if (!this.adminForm.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }
    if (!this.adminForm.password.trim()) {
      this.errorMessage = 'Password is required';
      return false;
    }
    if (this.adminForm.email && !this.isValidEmail(this.adminForm.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }
    return true;
  }

  validateEditForm(): boolean {
    if (!this.editForm.name.trim()) {
      this.errorMessage = 'Name is required';
      return false;
    }
    if (!this.editForm.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }
    if (this.editForm.email && !this.isValidEmail(this.editForm.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  getActiveAdminsCount(): number {
    return this.admins.filter(admin => admin.role !== 'inactive').length;
  }

}
