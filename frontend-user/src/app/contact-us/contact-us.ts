import { Component, OnInit, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ContactService, ContactFormData } from '../services/contact.service';
import { AnimationService } from '../services/animation.service';

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

  constructor(
    private contactService: ContactService,
    private route: ActivatedRoute,
    private elRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private animationService: AnimationService
  ) {}

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
}
