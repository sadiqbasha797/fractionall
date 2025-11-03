import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef, Renderer2, Inject, PLATFORM_ID, signal } from '@angular/core';
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

  // Modal states
  visionModal = signal<boolean>(false);
  philosophyModal = signal<boolean>(false);
  whyModal = signal<boolean>(false);
  aheadModal = signal<boolean>(false);
  founderModal = signal<boolean>(false);

  constructor(
    private animationService: AnimationService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  // Modal methods
  openVisionModal() {
    this.visionModal.set(true);
  }

  closeVisionModal() {
    this.visionModal.set(false);
  }

  openPhilosophyModal() {
    this.philosophyModal.set(true);
  }

  closePhilosophyModal() {
    this.philosophyModal.set(false);
  }

  openWhyModal() {
    this.whyModal.set(true);
  }

  closeWhyModal() {
    this.whyModal.set(false);
  }

  openAheadModal() {
    this.aheadModal.set(true);
  }

  closeAheadModal() {
    this.aheadModal.set(false);
  }

  openFounderModal() {
    this.founderModal.set(true);
  }

  closeFounderModal() {
    this.founderModal.set(false);
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