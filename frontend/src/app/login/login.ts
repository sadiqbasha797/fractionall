import { Component } from '@angular/core';
import { AuthService, LoginCredentials } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  credentials: LoginCredentials = { email: '', password: '' };
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    // Try admin login first
    this.authService.loginAdmin(this.credentials).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.authService.setToken(response.body.token);
          // Store admin data in localStorage for role detection
          if (response.body.admin) {
            localStorage.setItem('admin', JSON.stringify(response.body.admin));
          }
          this.router.navigate(['/cars']);
        } else {
          // If admin login fails, try superadmin login
          this.trySuperAdminLogin();
        }
      },
      error: (err) => {
        // If admin login fails, try superadmin login
        this.trySuperAdminLogin();
      }
    });
  }

  trySuperAdminLogin() {
    this.authService.loginSuperAdmin(this.credentials).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.authService.setToken(response.body.token);
          // Store superadmin data in localStorage for role detection
          if (response.body.superAdmin) {
            localStorage.setItem('superadmin', JSON.stringify(response.body.superAdmin));
          }
          this.router.navigate(['/cars']);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'An error occurred during login.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
