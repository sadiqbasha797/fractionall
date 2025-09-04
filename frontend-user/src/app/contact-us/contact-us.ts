import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ContactService, ContactFormData } from '../services/contact.service';

// Declare AOS for TypeScript
declare const AOS: any;

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUs implements OnInit {
  formData: ContactFormData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';
  isInvestorPage = false;

  constructor(
    private contactService: ContactService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if this is the investor page
    this.route.queryParams.subscribe(params => {
      this.isInvestorPage = params['type'] === 'investor';
    });

    // Initialize AOS after a small delay to ensure all content is loaded
    setTimeout(() => {
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 800,
          easing: 'ease-in-out',
          once: false,
          mirror: true,
          offset: 50,
          delay: 100,
          disable: false
        });
      }
    }, 100);
  }

  onSubmit() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    // Submit form to API
    this.contactService.submitContactForm(this.formData).subscribe({
      next: (response) => {
        console.log('Form submitted successfully:', response);
        this.submitSuccess = true;
        this.isSubmitting = false;
        
        // Reset form after success
        setTimeout(() => {
          this.formData = {
            name: '',
            email: '',
            subject: '',
            message: ''
          };
          this.submitSuccess = false;
        }, 5000);
      },
      error: (error) => {
        console.error('Error submitting form:', error);
        this.submitError = error.error?.message || 'Failed to submit form. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
