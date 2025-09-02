import { Component } from '@angular/core';
import { AuthService, LoginCredentials } from '../../services/auth.service';
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

    this.authService.loginAdmin(this.credentials).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.authService.setToken(response.body.token);
          this.router.navigate(['/admin/dashboard']);
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
