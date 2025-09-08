import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactForm, ContactFormStats } from '../services/contact.service';

@Component({
  selector: 'app-contact-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-forms.html',
  styleUrl: './contact-forms.css'
})
export class ContactForms implements OnInit {
  contactForms: ContactForm[] = [];
  stats: ContactFormStats['body']['stats'] | null = null;
  loading = false;
  error = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  statusFilter = '';
  priorityFilter = '';
  searchQuery = '';
  
  // Selected contact form for details
  selectedContactForm: ContactForm | null = null;
  showDetailsModal = false;
  
  // Update form
  updateStatus = '';
  updatePriority = '';
  adminNote = '';

  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.loadContactForms();
    this.loadStats();
  }

  loadContactForms() {
    this.loading = true;
    this.error = '';
    
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...(this.statusFilter && { status: this.statusFilter }),
      ...(this.priorityFilter && { priority: this.priorityFilter }),
      ...(this.searchQuery && { search: this.searchQuery })
    };

    this.contactService.getAllContactForms(params).subscribe({
      next: (response) => {
        this.contactForms = response.body.contactForms;
        this.totalItems = response.body.pagination.totalItems;
        this.totalPages = response.body.pagination.totalPages;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load contact forms';
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.contactService.getContactFormStats().subscribe({
      next: (response) => {
        this.stats = response.body.stats;
      },
      error: (error) => {
        console.error('Failed to load stats:', error);
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadContactForms();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadContactForms();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadContactForms();
  }

  viewDetails(contactForm: ContactForm) {
    this.selectedContactForm = contactForm;
    this.updateStatus = contactForm.status;
    this.updatePriority = contactForm.priority;
    this.adminNote = '';
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedContactForm = null;
    this.updateStatus = '';
    this.updatePriority = '';
    this.adminNote = '';
  }

  updateContactForm() {
    if (!this.selectedContactForm) return;

    const updateData: any = {};
    if (this.updateStatus !== this.selectedContactForm.status) {
      updateData.status = this.updateStatus;
    }
    if (this.updatePriority !== this.selectedContactForm.priority) {
      updateData.priority = this.updatePriority;
    }
    if (this.adminNote.trim()) {
      updateData.adminNote = this.adminNote.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    this.contactService.updateContactFormStatus(this.selectedContactForm._id, updateData).subscribe({
      next: (response) => {
        this.selectedContactForm = response.body.contactForm;
        this.loadContactForms();
        this.loadStats();
        this.adminNote = '';
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update contact form';
      }
    });
  }

  deleteContactForm(contactForm: ContactForm) {
    if (!confirm('Are you sure you want to delete this contact form?')) {
      return;
    }

    this.contactService.deleteContactForm(contactForm._id).subscribe({
      next: () => {
        this.loadContactForms();
        this.loadStats();
        if (this.selectedContactForm?._id === contactForm._id) {
          this.closeDetailsModal();
        }
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to delete contact form';
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'new': return 'status-new';
      case 'read': return 'status-read';
      case 'replied': return 'status-replied';
      case 'closed': return 'status-closed';
      default: return 'status-default';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-default';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN');
  }
}
