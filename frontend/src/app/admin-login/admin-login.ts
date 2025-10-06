import { Component } from '@angular/core';
import { AuthService, LoginCredentials } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLogin {
  credentials: LoginCredentials = { email: '', password: '' };
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginAdmin(this.credentials).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.authService.setToken(response.body.token);
          // Store admin data in localStorage for role detection
          if (response.body.admin) {
            localStorage.setItem('admin', JSON.stringify(response.body.admin));
            localStorage.setItem('userRole', 'admin');
          }
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid admin credentials. Please try again.';
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
