import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimationService } from '../services/animation.service';

@Component({
  selector: 'app-our-story',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './our-story.html',
  styleUrls: ['./our-story.css', '../animations.css'],
  animations: AnimationService.getAnimations()
})
export class OurStoryComponent implements OnInit, AfterViewInit {

  constructor(
    private animationService: AnimationService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Initialize animations after view is ready
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initAngularAnimations();
      }, 100);
    }
  }

  private initAngularAnimations(): void {
    this.animationService.initAnimations(this.elRef, this.renderer);
  }

  scrollToSection(sectionId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}