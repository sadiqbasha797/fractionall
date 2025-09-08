import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-dialog.component.html',
  styleUrl: './loading-dialog.component.css'
})
export class LoadingDialogComponent {
  @Input() visible: boolean = false;
  @Input() title: string = 'Processing...';
  @Input() message: string = 'Please wait while we process your request.';
  @Input() showProgress: boolean = false;
  @Input() progress: number = 0;
  @Input() allowCancel: boolean = false;
  
  @Output() cancel = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }
}
