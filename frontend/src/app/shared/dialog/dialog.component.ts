import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DialogConfig {
  title: string;
  message: string;
  type: 'confirm' | 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css'
})
export class DialogComponent implements OnInit {
  @Input() config: DialogConfig = {
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    showCancel: true,
    showClose: true,
    size: 'md',
    icon: ''
  };
  
  @Input() visible: boolean = false;
  @Input() loading: boolean = false;
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    // Set default icons based on type if not provided
    if (!this.config.icon) {
      switch (this.config.type) {
        case 'confirm':
          this.config.icon = 'fas fa-question-circle';
          break;
        case 'success':
          this.config.icon = 'fas fa-check-circle';
          break;
        case 'error':
          this.config.icon = 'fas fa-exclamation-circle';
          break;
        case 'warning':
          this.config.icon = 'fas fa-exclamation-triangle';
          break;
        case 'info':
        default:
          this.config.icon = 'fas fa-info-circle';
          break;
      }
    }
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getIconColor(): string {
    switch (this.config.type) {
      case 'confirm':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  }

  getButtonColor(): string {
    switch (this.config.type) {
      case 'confirm':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  }

  getSizeClasses(): string {
    switch (this.config.size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  }
}
