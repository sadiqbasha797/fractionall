import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  registerData = {
    name: '',
    email: '',
    mobile: '',
    password: '',
    location: '',
    pincode: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Properties for handling return URL
  returnUrl = '';
  pendingPayment = '';

  ngOnInit() {
    // Get return URL and pending payment from query parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      this.returnUrl = urlParams.get('returnUrl') || '/dashboard';
      this.pendingPayment = urlParams.get('pending_payment') || '';
    } else {
      this.returnUrl = '/dashboard';
      this.pendingPayment = '';
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    this.authService.registerUser(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success') {
          this.successMessage = 'Registration successful! Please check your email for verification code.';
          // Store temporary user data for verification
          this.authService.setTempUserData({
            email: this.registerData.email,
            name: this.registerData.name
          });
          
          // Redirect to login page with return URL after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login'], { 
              queryParams: { 
                returnUrl: this.returnUrl,
                pending_payment: this.pendingPayment
              }
            });
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Registration failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  private validateForm(): boolean {
    if (!this.registerData.name.trim()) {
      this.errorMessage = 'Name is required';
      return false;
    }

    if (!this.registerData.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    if (!this.registerData.mobile.trim()) {
      this.errorMessage = 'Mobile number is required';
      return false;
    }

    if (!this.isValidMobile(this.registerData.mobile)) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      return false;
    }

    if (!this.registerData.password.trim()) {
      this.errorMessage = 'Password is required';
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return false;
    }

    if (!this.registerData.location.trim()) {
      this.errorMessage = 'Location is required';
      return false;
    }

    if (!this.registerData.pincode.trim()) {
      this.errorMessage = 'Pincode is required';
      return false;
    }

    if (!/^\d{6}$/.test(this.registerData.pincode)) {
      this.errorMessage = 'Pincode must be 6 digits';
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidMobile(mobile: string): boolean {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
