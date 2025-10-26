import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ContactForm } from '../services/contact.service';

@Component({
  selector: 'app-contact-forms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-forms.html',
  styleUrl: './contact-forms.css'
})
export class ContactForms implements OnInit {
  contactForms: ContactForm[] = [];
  totalContactForms = 0;
  loading = false;
  error = '';
  
  // Loading state for refresh functionality
  isLoading: boolean = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  statusFilter = '';
  searchQuery = '';
  
  // Selected contact form for details
  selectedContactForm: ContactForm | null = null;
  showDetailsModal = false;
  
  // Update form
  updateStatus = '';
  adminNote = '';
  
  // Reply form
  replySubject = '';
  replyMessage = '';

  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.loadContactForms();
  }

  loadContactForms() {
    this.loading = true;
    this.isLoading = true;
    this.error = '';
    
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...(this.statusFilter && { status: this.statusFilter }),
      ...(this.searchQuery && { search: this.searchQuery })
    };

    this.contactService.getAllContactForms(params).subscribe({
      next: (response) => {
        this.contactForms = response.body.contactForms;
        this.totalItems = response.body.pagination.totalItems;
        this.totalPages = response.body.pagination.totalPages;
        this.totalContactForms = response.body.pagination.totalItems;
        this.loading = false;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load contact forms';
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  // Refresh functionality
  refreshContactForms(): void {
    this.loadContactForms();
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

  getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  viewDetails(contactForm: ContactForm) {
    this.selectedContactForm = contactForm;
    this.updateStatus = contactForm.status;
    this.adminNote = '';
    this.replySubject = `Re: ${contactForm.subject}`;
    this.replyMessage = '';
    this.showDetailsModal = true;
    
    // Automatically mark as read when admin/superadmin opens the contact form
    if (contactForm.status === 'new') {
      this.markAsRead(contactForm._id);
    }
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedContactForm = null;
    this.updateStatus = '';
    this.adminNote = '';
    this.replySubject = '';
    this.replyMessage = '';
  }

  updateContactForm() {
    if (!this.selectedContactForm) return;

    const updateData: any = {};
    if (this.updateStatus !== this.selectedContactForm.status) {
      updateData.status = this.updateStatus;
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN');
  }

  clearFilters() {
    this.statusFilter = '';
    this.searchQuery = '';
    this.onFilterChange();
  }

  markAsRead(contactFormId: string) {
    this.contactService.updateContactFormStatus(contactFormId, { status: 'read' }).subscribe({
      next: (response) => {
        // Update the contact form in the list
        const index = this.contactForms.findIndex(form => form._id === contactFormId);
        if (index !== -1) {
          this.contactForms[index] = response.body.contactForm;
        }
        // Update selected contact form if it's the same
        if (this.selectedContactForm?._id === contactFormId) {
          this.selectedContactForm = response.body.contactForm;
          this.updateStatus = 'read';
        }
      },
      error: (error) => {
        console.error('Failed to mark as read:', error);
      }
    });
  }

  sendReply() {
    if (!this.selectedContactForm || !this.replyMessage.trim()) return;

    const replyData = {
      subject: this.replySubject.trim() || `Re: ${this.selectedContactForm.subject}`,
      message: this.replyMessage.trim()
    };

    this.contactService.sendReply(this.selectedContactForm._id, replyData).subscribe({
      next: (response) => {
        // Update the contact form status to replied
        this.selectedContactForm = response.body.contactForm;
        this.updateStatus = 'replied';
        
        // Update the contact form in the list
        const index = this.contactForms.findIndex(form => form._id === this.selectedContactForm!._id);
        if (index !== -1) {
          this.contactForms[index] = response.body.contactForm;
        }
        
        // Clear reply form
        this.clearReply();
        
        // Show success message
        this.error = ''; // Clear any existing errors
        // You could add a success message here if needed
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to send reply';
      }
    });
  }

  clearReply() {
    this.replySubject = this.selectedContactForm ? `Re: ${this.selectedContactForm.subject}` : '';
    this.replyMessage = '';
  }

  // Add Math property for template access
  Math = Math;
}
