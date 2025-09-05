import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preloader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preloader.html',
  styleUrl: './preloader.css'
})
export class PreloaderComponent {
  @Input() showPreloader: boolean = false;
}
