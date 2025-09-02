import { Component } from '@angular/core';
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
export class Register {
  registerData = {
    name: '',
    email: '',
    password: '',
    address: '',
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
          
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
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

    if (!this.registerData.password.trim()) {
      this.errorMessage = 'Password is required';
      return false;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return false;
    }

    if (!this.registerData.address.trim()) {
      this.errorMessage = 'Address is required';
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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
