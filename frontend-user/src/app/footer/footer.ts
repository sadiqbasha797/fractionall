import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  protected showPrivacyModal = false;
  protected showTermsModal = false;
  protected showDisclaimerModal = false;

  protected openPrivacyPolicy(): void {
    this.showPrivacyModal = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  protected closePrivacyPolicy(): void {
    this.showPrivacyModal = false;
    document.body.style.overflow = 'auto'; // Restore scrolling
  }

  protected openTermsConditions(): void {
    this.showTermsModal = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  protected closeTermsConditions(): void {
    this.showTermsModal = false;
    document.body.style.overflow = 'auto'; // Restore scrolling
  }

  protected openDisclaimerPolicy(): void {
    this.showDisclaimerModal = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  protected closeDisclaimerPolicy(): void {
    this.showDisclaimerModal = false;
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
}
