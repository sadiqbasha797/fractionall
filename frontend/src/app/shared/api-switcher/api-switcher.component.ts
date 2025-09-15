import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-api-switcher',
  template: `
    <div class="api-switcher">
      <div class="api-switcher-header">
        <h4>API Configuration</h4>
      </div>
      <div class="api-switcher-content">
        <div class="current-api">
          <strong>Current API:</strong> {{ currentApiUrl }}
        </div>
        <div class="api-options">
          <button 
            class="btn btn-sm" 
            [class.btn-primary]="isUsingProduction"
            [class.btn-outline-primary]="!isUsingProduction"
            (click)="switchToProduction()"
            [disabled]="isUsingProduction">
            Production API
          </button>
          <button 
            class="btn btn-sm" 
            [class.btn-primary]="!isUsingProduction"
            [class.btn-outline-primary]="isUsingProduction"
            (click)="switchToLocalhost()"
            [disabled]="!isUsingProduction">
            Localhost API
          </button>
        </div>
        <div class="api-info">
          <small class="text-muted">
            Environment: {{ environment }} | 
            API: {{ isUsingProduction ? 'Production' : 'Development' }}
          </small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .api-switcher {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .api-switcher-header h4 {
      margin: 0 0 12px 0;
      color: #495057;
      font-size: 16px;
    }
    
    .api-switcher-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .current-api {
      font-size: 14px;
      color: #6c757d;
    }
    
    .api-options {
      display: flex;
      gap: 8px;
    }
    
    .btn {
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }
    
    .btn-outline-primary {
      background-color: transparent;
      color: #007bff;
      border-color: #007bff;
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .api-info {
      font-size: 12px;
    }
    
    .text-muted {
      color: #6c757d !important;
    }
  `]
})
export class ApiSwitcherComponent implements OnInit {
  currentApiUrl: string = '';
  isUsingProduction: boolean = false;
  environment: string = '';

  constructor(private configService: ConfigService) {}

  ngOnInit() {
    this.updateApiInfo();
  }

  switchToProduction() {
    this.configService.switchApiUrl(true);
    this.updateApiInfo();
    this.showNotification('Switched to Production API');
  }

  switchToLocalhost() {
    this.configService.switchApiUrl(false);
    this.updateApiInfo();
    this.showNotification('Switched to Localhost API');
  }

  private updateApiInfo() {
    this.currentApiUrl = this.configService.getBaseUrl();
    this.isUsingProduction = this.configService.isUsingProductionApi();
    this.environment = this.configService.getEnvironment();
  }

  private showNotification(message: string) {
    // Simple notification - you can replace this with a proper notification service
    // You could also use a toast notification library here
  }
}
