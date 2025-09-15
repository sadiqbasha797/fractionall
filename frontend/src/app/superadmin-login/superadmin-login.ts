import { Component } from '@angular/core';
import { AuthService, LoginCredentials } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-superadmin-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './superadmin-login.html',
  styleUrl: './superadmin-login.css'
})
export class SuperAdminLogin {
  credentials: LoginCredentials = { email: '', password: '' };
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginSuperAdmin(this.credentials).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.authService.setToken(response.body.token);
          // Store superadmin data in localStorage for role detection
          if (response.body.superAdmin) {
            localStorage.setItem('superadmin', JSON.stringify(response.body.superAdmin));
            localStorage.setItem('userRole', 'superadmin');
          }
          this.router.navigate(['/cars']);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid superadmin credentials. Please try again.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/login-selection']);
  }
}
