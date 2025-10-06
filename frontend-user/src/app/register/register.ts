import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { PincodeService } from '../services/pincode.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit, OnDestroy {
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
  isPincodeLoading = false;
  pincodeError = '';
  private pincodeTimeout: any;

  constructor(
    private authService: AuthService,
    private pincodeService: PincodeService,
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

  onPincodeChange() {
    this.pincodeError = '';
    
    // Clear any existing timeout
    if (this.pincodeTimeout) {
      clearTimeout(this.pincodeTimeout);
    }
    
    // Clear location if pincode is not valid
    if (this.registerData.pincode.length > 0 && this.registerData.pincode.length < 6) {
      this.registerData.location = '';
      this.pincodeError = 'Pincode must be 6 digits';
      return;
    }
    
    if (this.registerData.pincode.length > 0 && !/^\d{6}$/.test(this.registerData.pincode)) {
      this.registerData.location = '';
      this.pincodeError = 'Please enter a valid 6-digit pincode';
      return;
    }
    
    if (this.registerData.pincode.length === 0) {
      this.registerData.location = '';
      this.pincodeError = '';
      return;
    }
    
    // Only fetch location if pincode is exactly 6 digits - with debounce
    if (this.registerData.pincode.length === 6 && /^\d{6}$/.test(this.registerData.pincode)) {
      this.pincodeTimeout = setTimeout(() => {
        this.isPincodeLoading = true;
        
        this.pincodeService.getFormattedLocation(this.registerData.pincode).subscribe({
          next: (location) => {
            this.isPincodeLoading = false;
            if (location && location.trim() !== '') {
              this.registerData.location = location;
              this.pincodeError = '';
            } else {
              this.pincodeError = 'Invalid pincode. Please check and try again.';
              this.registerData.location = '';
            }
          },
          error: (error) => {
            this.isPincodeLoading = false;
            this.pincodeError = 'Unable to fetch location. Please enter manually.';
          }
        });
      }, 500); // 500ms debounce
    }
  }

  ngOnDestroy() {
    // Clean up timeout when component is destroyed
    if (this.pincodeTimeout) {
      clearTimeout(this.pincodeTimeout);
    }
  }
}
