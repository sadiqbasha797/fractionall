import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

export interface DialogState {
  visible: boolean;
  config: DialogConfig;
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogState = new BehaviorSubject<DialogState>({
    visible: false,
    config: {
      title: '',
      message: '',
      type: 'info'
    },
    loading: false
  });

  get dialogState$(): Observable<DialogState> {
    return this.dialogState.asObservable();
  }

  get currentState(): DialogState {
    return this.dialogState.value;
  }

  showDialog(config: DialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogState.next({
        visible: true,
        config: {
          ...config,
          confirmText: config.confirmText || 'Confirm',
          cancelText: config.cancelText || 'Cancel',
          showCancel: config.showCancel !== false,
          showClose: config.showClose !== false,
          size: config.size || 'md'
        },
        loading: false
      });

      // Store the resolve function to be called when dialog is closed
      (this as any).resolveDialog = resolve;
    });
  }

  hideDialog() {
    this.dialogState.next({
      ...this.currentState,
      visible: false,
      loading: false
    });
  }

  setLoading(loading: boolean) {
    this.dialogState.next({
      ...this.currentState,
      loading
    });
  }

  confirm(result: boolean) {
    if ((this as any).resolveDialog) {
      (this as any).resolveDialog(result);
      (this as any).resolveDialog = null;
    }
    this.hideDialog();
  }

  // Convenience methods
  confirmDelete(itemName: string): Promise<boolean> {
    return this.showDialog({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete <strong>${itemName}</strong>? This action cannot be undone.`,
      type: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'fas fa-trash'
    });
  }

  confirmAction(action: string, itemName: string): Promise<boolean> {
    return this.showDialog({
      title: `Confirm ${action}`,
      message: `Are you sure you want to ${action.toLowerCase()} <strong>${itemName}</strong>?`,
      type: 'confirm',
      confirmText: action,
      cancelText: 'Cancel'
    });
  }

  showSuccess(title: string, message: string): Promise<boolean> {
    return this.showDialog({
      title,
      message,
      type: 'success',
      confirmText: 'OK',
      showCancel: false
    });
  }

  showError(title: string, message: string): Promise<boolean> {
    return this.showDialog({
      title,
      message,
      type: 'error',
      confirmText: 'OK',
      showCancel: false
    });
  }

  showWarning(title: string, message: string): Promise<boolean> {
    return this.showDialog({
      title,
      message,
      type: 'warning',
      confirmText: 'OK',
      showCancel: false
    });
  }

  showInfo(title: string, message: string): Promise<boolean> {
    return this.showDialog({
      title,
      message,
      type: 'info',
      confirmText: 'OK',
      showCancel: false
    });
  }
}
