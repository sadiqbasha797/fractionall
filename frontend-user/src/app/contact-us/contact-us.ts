import { Component, OnInit, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ContactService, ContactFormData } from '../services/contact.service';
import { AnimationService } from '../services/animation.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-us.html',
  styleUrls: ['./contact-us.css', '../animations.css'],
  animations: AnimationService.getAnimations()
})
export class ContactUs implements OnInit, AfterViewInit {
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
  showMapOverlay = false;
  mapUrl: SafeResourceUrl;

  constructor(
    private contactService: ContactService,
    private route: ActivatedRoute,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private animationService: AnimationService,
    private sanitizer: DomSanitizer
  ) {
    // Sanitize the Google Maps URL
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15551.905632737525!2d77.57529945!3d12.97159875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae167b14d2a45d%3A0xc07ce61b1e9b2f!2sBengaluru%2C%20Karnataka%20560041!5e0!3m2!1sen!2sin!4v1678912345678!5m2!1sen!2sin');
  }

  ngOnInit() {
    // Check if this is the investor page
    this.route.queryParams.subscribe(params => {
      this.isInvestorPage = params['type'] === 'investor';
    });

    // Initialize Angular animations
    setTimeout(() => {
      this.initAngularAnimations();
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

  ngAfterViewInit(): void {
    this.initAngularAnimations();
  }

  private initAngularAnimations(): void {
    // Initialize animations using the animation service
    this.animationService.initAnimations(this.elRef, this.renderer);
  }

  showMap() {
    this.showMapOverlay = true;
  }

  hideMap() {
    this.showMapOverlay = false;
  }
}
