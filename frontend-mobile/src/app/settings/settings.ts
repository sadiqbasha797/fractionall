import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

interface EmailNotificationPreferences {
    enabled: boolean;
    tokenPurchase: boolean;
    bookNowToken: boolean;
    amcPayment: boolean;
    booking: boolean;
    kyc: boolean;
    refund: boolean;
    sharedMember: boolean;
}

interface NotificationType {
    key: keyof Omit<EmailNotificationPreferences, 'enabled'>;
    label: string;
    description: string;
    icon: string;
}

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.html',
    styleUrls: ['./settings.css']
})
export class SettingsComponent implements OnInit {
    preferences: EmailNotificationPreferences = {
        enabled: true,
        tokenPurchase: true,
        bookNowToken: true,
        amcPayment: true,
        booking: true,
        kyc: true,
        refund: true,
        sharedMember: true
    };

    loading = false;
    saving = false;
    message = '';
    messageType: 'success' | 'error' = 'success';

    notificationTypes: NotificationType[] = [
        {
            key: 'tokenPurchase',
            label: 'Token Purchase Confirmations',
            description: 'Get notified when you purchase a waitlist token',
            icon: '🎫'
        },
        {
            key: 'bookNowToken',
            label: 'Book Now Token Confirmations',
            description: 'Get notified when you purchase a book now token',
            icon: '🚀'
        },
        {
            key: 'amcPayment',
            label: 'AMC Payment Confirmations',
            description: 'Get notified about AMC payment confirmations',
            icon: '🔧'
        },
        {
            key: 'booking',
            label: 'Booking Confirmations',
            description: 'Get notified when you make a booking',
            icon: '📅'
        },
        {
            key: 'kyc',
            label: 'KYC Updates',
            description: 'Get notified about KYC status changes and reminders',
            icon: '✅'
        },
        {
            key: 'refund',
            label: 'Refund Notifications',
            description: 'Get notified about refund status updates',
            icon: '💰'
        },
        {
            key: 'sharedMember',
            label: 'Shared Member Updates',
            description: 'Get notified about shared member approvals',
            icon: '👥'
        }
    ];

    constructor(
        private userService: UserService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadPreferences();
    }

    loadPreferences(): void {
        this.loading = true;
        this.userService.getEmailNotificationPreferences().subscribe({
            next: (response) => {
                if (response.status === 'success') {
                    // Create a new object to ensure proper change detection
                    this.preferences = { ...response.body.emailNotifications };
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading preferences:', error);
                this.showMessage('Failed to load preferences', 'error');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onMasterToggleChange(): void {
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
            // When master toggle is turned off, individual preferences are preserved
            // so when user re-enables, their choices remain
            this.cdr.detectChanges();
            // Auto-save when master toggle changes
            this.savePreferences();
        }, 0);
    }

    savePreferences(): void {
        this.saving = true;
        console.log('Saving preferences:', this.preferences);

        this.userService.updateEmailNotificationPreferences(this.preferences).subscribe({
            next: (response) => {
                console.log('Save response:', response);
                if (response.status === 'success') {
                    // Update with the response from server
                    this.preferences = { ...response.body.emailNotifications };
                    this.showMessage('Preferences saved successfully!', 'success');
                }
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error saving preferences:', error);
                this.showMessage('Failed to save preferences', 'error');
                this.saving = false;
                this.cdr.detectChanges();
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/profile']);
    }

    private showMessage(text: string, type: 'success' | 'error'): void {
        this.message = text;
        this.messageType = type;
        setTimeout(() => {
            this.message = '';
        }, 5000);
    }
}
