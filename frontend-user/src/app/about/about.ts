import { Component, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomePublicService, About as AboutContent, SimpleStep } from '../services/home-public.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About implements OnInit, AfterViewInit {
  @ViewChild('timelineRef', { static: false }) private timelineRef?: ElementRef<HTMLDivElement>;

  aboutContent: AboutContent | null = null;
  loading = true;
  error: string | null = null;
  backgroundImageStyle: string = 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)';

  // Simple steps functionality
  simpleSteps = signal<SimpleStep[]>([]);
  simpleStepsLoading = signal<boolean>(true);

  constructor(
    private router: Router,
    private homePublicService: HomePublicService
  ) {}

  ngOnInit(): void {
    // Load about content and simple steps
    this.loadAboutContent();
    this.loadSimpleSteps();
    // Initialize any animations or effects
    this.initializeAnimations();
  }

  ngAfterViewInit(): void {
    // Update timeline height after view initialization
    setTimeout(() => this.updateTimelineHeight(), 100);
  }

  loadAboutContent(): void {
    this.homePublicService.getPublicAbout().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.body.about && response.body.about.length > 0) {
          // Use the first about content item
          this.aboutContent = response.body.about[0];
          // Update background image style
          if (this.aboutContent.aboutheroimage) {
            this.backgroundImageStyle = `url(${this.aboutContent.aboutheroimage})`;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading about content:', error);
        this.error = 'Failed to load about content';
        this.loading = false;
      }
    });
  }

  loadSimpleSteps(): void {
    this.simpleStepsLoading.set(true);
    this.homePublicService.getPublicSimpleSteps().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.simpleSteps.set(response.body.simpleSteps);
        } else {
          // Set default steps if no data from API
          this.simpleSteps.set([
            {
              _id: 'default-1',
              stepTitle: 'Find Your Dream Car',
              stepName: 'Browse our curated fleet of luxury sedans, sports cars, SUVs, and exotic supercars. Each listing comes with complete car specifications, transparent pricing, token plans, and availability calendars, ensuring clarity before you book your car.',
              createdBy: null,
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-2', 
              stepTitle: 'Purchase Your Share',
              stepName: 'Buy your share through secure payment options. Each car is divided into 12 equal shares, making luxury car ownership accessible and affordable.',
              createdBy: null,
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-3',
              stepTitle: 'Book & Drive',
              stepName: 'Schedule your driving days through our easy-to-use app. Enjoy hassle-free pickup, maintenance-free driving, and premium car experience.',
              createdBy: null,
              createdAt: new Date().toISOString()
            }
          ]);
        }
        this.simpleStepsLoading.set(false);
        setTimeout(() => this.updateTimelineHeight(), 0);
      },
      error: (error) => {
        console.error('Error loading simple steps:', error);
        this.simpleStepsLoading.set(false);
      }
    });
  }

  private initializeAnimations(): void {
    // Check if we're in browser environment (not SSR)
    if (typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined') {
      // Add intersection observer for scroll animations
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      }, observerOptions);

      // Observe all elements with data-animation attribute
      document.querySelectorAll('[data-animation]').forEach(el => {
        observer.observe(el);
      });
    }
  }

  navigateToCars(): void {
    this.router.navigate(['/cars']);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Simple steps helper methods - simplified since we always show all steps
  private updateTimelineHeight(): void {
    if (typeof window === 'undefined' || !this.timelineRef) return;
    const timelineEl = this.timelineRef.nativeElement;
    
    // Force a reflow to ensure DOM is updated
    timelineEl.offsetHeight;
    
    // Find all timeline items (since we always show all steps)
    const items = Array.from(timelineEl.querySelectorAll<HTMLElement>('.timeline-item'))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);
        return rect.height > 0 && 
               computedStyle.display !== 'none' && 
               computedStyle.visibility !== 'hidden' &&
               computedStyle.opacity !== '0';
      });
    
    if (items.length === 0) {
      timelineEl.style.setProperty('--timeline-height', '100%');
      return;
    }
    
    // Get the last item to set timeline height
    const lastItem = items[items.length - 1];
    
    if (!lastItem) {
      timelineEl.style.setProperty('--timeline-height', '100%');
      return;
    }
    
    const icon = lastItem.querySelector<HTMLElement>('.timeline-icon');
    const iconHalf = icon ? Math.round(icon.clientHeight / 2) : 16;
    const timelineTop = timelineEl.getBoundingClientRect().top + window.scrollY;
    const lastCenterY = lastItem.getBoundingClientRect().top + window.scrollY + iconHalf;
    const heightPx = Math.max(0, Math.round(lastCenterY - timelineTop));
    const finalHeight = heightPx + iconHalf;
    
    timelineEl.style.setProperty('--timeline-height', finalHeight + 'px');
  }
}
