import { Component, OnInit, signal, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
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
export class About implements OnInit, AfterViewInit, OnDestroy {

  aboutContent: AboutContent | null = null;
  loading = true;
  error: string | null = null;
  backgroundImageStyle: string = 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)';
  
  // Simple Steps
  simpleSteps = signal<SimpleStep[]>([]);
  
  // Simple Steps Toggle State
  expandedSteps = signal<Set<number>>(new Set());
  

  constructor(
    private router: Router,
    private homePublicService: HomePublicService
  ) {}

  ngOnInit(): void {
    // Load about content
    this.loadAboutContent();
    // Load simple steps
    this.loadSimpleSteps();
    // Initialize any animations or effects
    this.initializeAnimations();
  }

  ngAfterViewInit(): void {
    // Initialize any animations or effects
    this.initializeAnimations();
  }

  ngOnDestroy(): void {
    // Clean up any resources if needed
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

  loadSimpleSteps(): void {
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
              stepTitle: 'Book Your Share',
              stepName: 'Choose your preferred car and book your share. Pay a fraction of the total cost and become a co-owner of your dream car.',
              createdBy: null,
              createdAt: new Date().toISOString()
            },
            {
              _id: 'default-3',
              stepTitle: 'Drive & Enjoy',
              stepName: 'Schedule your driving days through our easy-to-use app. Enjoy hassle-free pickup, maintenance-free driving, and premium car experience.',
              createdBy: null,
              createdAt: new Date().toISOString()
            }
          ]);
        }
      },
      error: (error) => {
        console.error('Error loading simple steps:', error);
        // Set default steps on error
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
            stepTitle: 'Book Your Share',
            stepName: 'Choose your preferred car and book your share. Pay a fraction of the total cost and become a co-owner of your dream car.',
            createdBy: null,
            createdAt: new Date().toISOString()
          },
          {
            _id: 'default-3',
            stepTitle: 'Drive & Enjoy',
            stepName: 'Schedule your driving days through our easy-to-use app. Enjoy hassle-free pickup, maintenance-free driving, and premium car experience.',
            createdBy: null,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    });
  }






  // Toggle step expansion
  toggleStep(index: number): void {
    const currentExpanded = this.expandedSteps();
    const newExpanded = new Set(currentExpanded);
    
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    
    this.expandedSteps.set(newExpanded);
  }

  // Check if step is expanded
  isStepExpanded(index: number): boolean {
    return this.expandedSteps().has(index);
  }
}
