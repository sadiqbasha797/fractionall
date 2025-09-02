import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  // Login form data
  loginData = {
    email: '',
    password: ''
  };

  // Verification form data
  verificationData = {
    email: '',
    code: ''
  };

  // UI states
  isLoading = false;
  isVerificationMode = false;
  showPassword = false;
  errorMessage = '';
  successMessage = '';
  isResendingCode = false;

  // Timer for resend code
  resendTimer = 0;
  resendInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if there's temporary user data from registration
    const tempUserData = this.authService.getTempUserData();
    if (tempUserData) {
      this.verificationData.email = tempUserData.email;
      this.loginData.email = tempUserData.email;
    }

    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogin() {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
    if (!this.validateLoginForm()) {
      return;
    }

    this.isLoading = true;

    this.authService.loginUser(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success') {
          // Login successful
          this.authService.setToken(response.body.token);
          this.authService.setUserData(response.body.user);
          this.authService.removeTempUserData();
          this.successMessage = 'Login successful! Redirecting...';
          
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.body?.verified === false) {
          // User is not verified, switch to verification mode
          this.isVerificationMode = true;
          this.verificationData.email = this.loginData.email;
          this.errorMessage = '';
          this.successMessage = 'Please verify your email to continue. Check your inbox for the verification code.';
        } else {
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
      }
    });
  }

  onVerifyEmail() {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
    if (!this.validateVerificationForm()) {
      return;
    }

    this.isLoading = true;

    this.authService.verifyEmail(this.verificationData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success') {
          // Verification successful
          this.authService.setToken(response.body.token);
          this.authService.setUserData(response.body.user);
          this.authService.removeTempUserData();
          this.successMessage = 'Email verified successfully! Redirecting...';
          
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Verification failed';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Verification failed. Please try again.';
      }
    });
  }

  onResendCode() {
    if (!this.verificationData.email) {
      this.errorMessage = 'Email is required to resend code';
      return;
    }

    this.isResendingCode = true;
    this.errorMessage = '';

    this.authService.resendVerificationCode(this.verificationData.email).subscribe({
      next: (response) => {
        this.isResendingCode = false;
        if (response.status === 'success') {
          this.successMessage = 'Verification code sent! Please check your email.';
          this.startResendTimer();
        } else {
          this.errorMessage = response.message || 'Failed to resend code';
        }
      },
      error: (error) => {
        this.isResendingCode = false;
        this.errorMessage = error.error?.message || 'Failed to resend code. Please try again.';
      }
    });
  }

  private validateLoginForm(): boolean {
    if (!this.loginData.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    if (!this.loginData.password.trim()) {
      this.errorMessage = 'Password is required';
      return false;
    }

    return true;
  }

  private validateVerificationForm(): boolean {
    if (!this.verificationData.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }

    if (!this.verificationData.code.trim()) {
      this.errorMessage = 'Verification code is required';
      return false;
    }

    if (!/^\d{6}$/.test(this.verificationData.code)) {
      this.errorMessage = 'Verification code must be 6 digits';
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

  switchToLogin() {
    this.isVerificationMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.verificationData.code = '';
  }

  private startResendTimer() {
    this.resendTimer = 60; // 60 seconds
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  // Format verification code input (add spaces for better UX)
  onVerificationCodeInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    this.verificationData.code = value;
  }
}
