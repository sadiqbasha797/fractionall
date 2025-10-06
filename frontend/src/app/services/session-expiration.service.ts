import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionExpirationService {
  private sessionExpiredSubject = new BehaviorSubject<boolean>(false);
  public sessionExpired$ = this.sessionExpiredSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  handleSessionExpiration(): void {
    // Check if already handling session expiration to avoid multiple calls
    if (this.sessionExpiredSubject.value) {
      return;
    }

    // Mark session as expired
    this.sessionExpiredSubject.next(true);

    // Show warning message
    this.showSessionExpiredWarning();

    // Clear authentication data
    this.authService.logout();

    // Redirect to login after a short delay to allow user to see the warning
    setTimeout(() => {
      this.router.navigate(['/login-selection']);
      this.sessionExpiredSubject.next(false); // Reset the state
    }, 3000); // 3 second delay to show the warning
  }

  private showSessionExpiredWarning(): void {
    // Create a modal/alert to show the warning
    const warningModal = document.createElement('div');
    warningModal.className = 'session-expired-modal';
    warningModal.innerHTML = `
      <div class="session-expired-content">
        <div class="session-expired-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </div>
        <h3>Session Expired</h3>
        <p>Your session has expired. You will be logged out automatically.</p>
        <div class="session-expired-countdown">
          <span id="countdown">3</span> seconds
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .session-expired-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-in-out;
      }

      .session-expired-content {
        background: #1f2937;
        border: 1px solid #374151;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: slideIn 0.3s ease-out;
      }

      .session-expired-icon {
        color: #f59e0b;
        margin-bottom: 1rem;
        display: flex;
        justify-content: center;
      }

      .session-expired-content h3 {
        color: #f9fafb;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .session-expired-content p {
        color: #d1d5db;
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
      }

      .session-expired-countdown {
        color: #f59e0b;
        font-weight: 600;
        font-size: 1.1rem;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(warningModal);

    // Add countdown functionality
    let countdown = 3;
    const countdownElement = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownElement) {
        countdownElement.textContent = countdown.toString();
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        // Remove modal and style
        document.body.removeChild(warningModal);
        document.head.removeChild(style);
      }
    }, 1000);

    // Prevent user interaction with the modal
    warningModal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }


  // Method to check if session is currently expired
  isSessionExpired(): boolean {
    return this.sessionExpiredSubject.value;
  }
}
