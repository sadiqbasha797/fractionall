import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login-selection.html',
  styleUrl: './login-selection.css'
})
export class LoginSelection {
  constructor(private router: Router) {}

  goToAdminLogin() {
    this.router.navigate(['/admin-login']);
  }

  goToSuperAdminLogin() {
    this.router.navigate(['/superadmin-login']);
  }
}
