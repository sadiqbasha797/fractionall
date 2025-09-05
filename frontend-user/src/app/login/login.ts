import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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

  // Forgot password form data
  forgotPasswordData = {
    email: ''
  };

  // Reset password form data
  resetPasswordData = {
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  };

  // UI states
  isLoading = false;
  isVerificationMode = false;
  isForgotPasswordMode = false;
  isResetPasswordMode = false;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  isResendingCode = false;
  isResendingResetCode = false;

  // Timer for resend code
  resendTimer = 0;
  resendInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
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

    // Check if there's temporary user data from registration
    const tempUserData = this.authService.getTempUserData();
    if (tempUserData) {
      this.verificationData.email = tempUserData.email;
      this.loginData.email = tempUserData.email;
    }

    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      this.redirectAfterLogin();
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
    this.cdr.detectChanges(); // Force change detection

    this.authService.loginUser(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.status === 'success') {
          // Login successful
          this.authService.setToken(response.body.token);
          this.authService.setUserData(response.body.user);
          this.authService.removeTempUserData();
          this.successMessage = 'Login successful! Redirecting...';
          
          setTimeout(() => {
            this.redirectAfterLogin();
          }, 1000);
        } else {
          this.errorMessage = response?.message || 'Login failed';
        }
        this.cdr.detectChanges(); // Force change detection
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
        this.cdr.detectChanges(); // Force change detection
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
    this.cdr.detectChanges(); // Force change detection

    this.authService.verifyEmail(this.verificationData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.status === 'success') {
          // Verification successful
          this.authService.setToken(response.body.token);
          this.authService.setUserData(response.body.user);
          this.authService.removeTempUserData();
          this.successMessage = 'Email verified successfully! Redirecting...';
          
          setTimeout(() => {
            this.redirectAfterLogin();
          }, 1000);
        } else {
          this.errorMessage = response?.message || 'Verification failed';
        }
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Verification failed. Please try again.';
        this.cdr.detectChanges(); // Force change detection
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
    this.cdr.detectChanges(); // Force change detection

    this.authService.resendVerificationCode(this.verificationData.email).subscribe({
      next: (response) => {
        this.isResendingCode = false;
        if (response && response.status === 'success') {
          this.successMessage = 'Verification code sent! Please check your email.';
          this.startResendTimer();
        } else {
          this.errorMessage = response?.message || 'Failed to resend code';
        }
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        this.isResendingCode = false;
        this.errorMessage = error.error?.message || 'Failed to resend code. Please try again.';
        this.cdr.detectChanges(); // Force change detection
      }
    });
  }

  // Forgot Password Methods
  onForgotPassword() {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
    if (!this.validateForgotPasswordForm()) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Force change detection

    // Safety timeout to ensure loading state is cleared
    const safetyTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.errorMessage = 'Request is taking longer than expected. Please try again.';
        this.cdr.detectChanges(); // Force change detection
      }
    }, 12000);

    this.authService.requestPasswordReset(this.forgotPasswordData.email)
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(error => {
          clearTimeout(safetyTimeout);
          this.isLoading = false;
          if (error.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out. Please check your connection and try again.';
          } else {
            this.errorMessage = error.error?.message || 'Failed to send reset code. Please try again.';
          }
          this.cdr.detectChanges(); // Force change detection
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          clearTimeout(safetyTimeout);
          this.isLoading = false;
          if (response && response.status === 'success') {
            // Switch to reset password mode
            this.isForgotPasswordMode = false;
            this.isResetPasswordMode = true;
            this.resetPasswordData.email = this.forgotPasswordData.email;
            this.successMessage = 'Password reset code sent! Please check your email.';
            this.startResendTimer();
          } else {
            this.errorMessage = response?.message || 'Failed to send reset code';
          }
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }

  onResetPassword() {
    this.errorMessage = '';
    this.successMessage = '';

    // Basic validation
    if (!this.validateResetPasswordForm()) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // Force change detection

    // Safety timeout to ensure loading state is cleared
    const safetyTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.errorMessage = 'Request is taking longer than expected. Please try again.';
        this.cdr.detectChanges(); // Force change detection
      }
    }, 12000);

    this.authService.resetPassword({
      email: this.resetPasswordData.email,
      code: this.resetPasswordData.code,
      newPassword: this.resetPasswordData.newPassword
    })
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(error => {
          clearTimeout(safetyTimeout);
          this.isLoading = false;
          if (error.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out. Please check your connection and try again.';
          } else {
            this.errorMessage = error.error?.message || 'Password reset failed. Please try again.';
          }
          this.cdr.detectChanges(); // Force change detection
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          clearTimeout(safetyTimeout);
          this.isLoading = false;
          if (response && response.status === 'success') {
            this.successMessage = 'Password reset successfully! You can now login with your new password.';
            
            // Switch back to login mode
            setTimeout(() => {
              this.switchToLogin();
            }, 2000);
          } else {
            this.errorMessage = response?.message || 'Password reset failed';
          }
          this.cdr.detectChanges(); // Force change detection
        }
      });
  }

  onResendResetCode() {
    if (!this.resetPasswordData.email) {
      this.errorMessage = 'Email is required to resend code';
      return;
    }

    this.isResendingResetCode = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // Force change detection

    this.authService.requestPasswordReset(this.resetPasswordData.email)
      .pipe(
        timeout(10000),
        catchError(error => {
          this.isResendingResetCode = false;
          if (error.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out. Please try again.';
          } else {
            this.errorMessage = error.error?.message || 'Failed to resend code. Please try again.';
          }
          this.cdr.detectChanges(); // Force change detection
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          this.isResendingResetCode = false;
          if (response && response.status === 'success') {
            this.successMessage = 'Reset code sent! Please check your email.';
            this.startResendTimer();
          } else {
            this.errorMessage = response?.message || 'Failed to resend code';
          }
          this.cdr.detectChanges(); // Force change detection
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

  private validateForgotPasswordForm(): boolean {
    if (!this.forgotPasswordData.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }

    if (!this.isValidEmail(this.forgotPasswordData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }

    return true;
  }

  private validateResetPasswordForm(): boolean {
    if (!this.resetPasswordData.email.trim()) {
      this.errorMessage = 'Email is required';
      return false;
    }

    if (!this.resetPasswordData.code.trim()) {
      this.errorMessage = 'Reset code is required';
      return false;
    }

    if (!/^\d{6}$/.test(this.resetPasswordData.code)) {
      this.errorMessage = 'Reset code must be 6 digits';
      return false;
    }

    if (!this.resetPasswordData.newPassword.trim()) {
      this.errorMessage = 'New password is required';
      return false;
    }

    if (this.resetPasswordData.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return false;
    }

    if (this.resetPasswordData.newPassword !== this.resetPasswordData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
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

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  switchToLogin() {
    this.isVerificationMode = false;
    this.isForgotPasswordMode = false;
    this.isResetPasswordMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.verificationData.code = '';
    this.forgotPasswordData.email = '';
    this.resetPasswordData = {
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.clearResendTimer();
  }

  switchToForgotPassword() {
    this.isForgotPasswordMode = true;
    this.isVerificationMode = false;
    this.isResetPasswordMode = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.forgotPasswordData.email = this.loginData.email;
  }

  switchToResetPassword() {
    this.isResetPasswordMode = true;
    this.isForgotPasswordMode = false;
    this.isVerificationMode = false;
    this.errorMessage = '';
    this.successMessage = '';
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

  private clearResendTimer() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendTimer = 0;
    }
  }

  ngOnDestroy() {
    this.clearResendTimer();
  }

  // Format verification code input (add spaces for better UX)
  onVerificationCodeInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    this.verificationData.code = value;
  }

  // Format reset code input
  onResetCodeInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    this.resetPasswordData.code = value;
  }


  redirectAfterLogin() {
    // Decode the return URL
    const decodedReturnUrl = decodeURIComponent(this.returnUrl);
    
    // Add query parameters for authentication return
    if (typeof window !== 'undefined') {
      const url = new URL(decodedReturnUrl, window.location.origin);
      url.searchParams.set('auth_return', 'true');
      if (this.pendingPayment) {
        url.searchParams.set('pending_payment', this.pendingPayment);
      }
      
      // Navigate to the return URL with parameters
      this.router.navigateByUrl(url.pathname + url.search);
    } else {
      // Fallback for server-side rendering
      this.router.navigateByUrl(decodedReturnUrl);
    }
  }
}
