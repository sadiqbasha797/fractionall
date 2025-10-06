import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomePublicService, About as AboutContent } from '../services/home-public.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About implements OnInit {

  aboutContent: AboutContent | null = null;
  loading = true;
  error: string | null = null;
  backgroundImageStyle: string = 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)';

  constructor(
    private router: Router,
    private homePublicService: HomePublicService
  ) {}

  ngOnInit(): void {
    // Load about content
    this.loadAboutContent();
    // Initialize any animations or effects
    this.initializeAnimations();
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
}
