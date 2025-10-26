import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ScrollSection {
  id: string;
  element: HTMLElement;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollNavigationService {
  private activeSectionSubject = new BehaviorSubject<string>('');
  public activeSection$ = this.activeSectionSubject.asObservable();

  private sections: ScrollSection[] = [];
  private scrollListener: (() => void) | null = null;

  constructor() {}

  /**
   * Register sections to track for scroll-based navigation
   * @param sections Array of section objects with id, element, and offset
   */
  registerSections(sections: ScrollSection[]): void {
    this.sections = sections.sort((a, b) => a.offset - b.offset);
    this.startScrollListener();
  }

  /**
   * Unregister all sections and stop scroll listening
   */
  unregisterSections(): void {
    this.sections = [];
    this.stopScrollListener();
    this.activeSectionSubject.next('');
  }

  /**
   * Set active section manually (useful for programmatic navigation)
   * @param sectionId The ID of the section to set as active
   */
  setActiveSection(sectionId: string): void {
    this.activeSectionSubject.next(sectionId);
  }

  /**
   * Get current active section
   */
  getActiveSection(): string {
    return this.activeSectionSubject.value;
  }

  /**
   * Check if a specific section is currently active
   * @param sectionId The section ID to check
   */
  isSectionActive(sectionId: string): boolean {
    return this.activeSectionSubject.value === sectionId;
  }

  /**
   * Start listening to scroll events and update active section
   */
  private startScrollListener(): void {
    if (this.scrollListener) {
      return; // Already listening
    }

    this.scrollListener = () => {
      const scrollPosition = window.scrollY + 100; // Offset for navbar height
      
      // Find the current section based on scroll position
      let currentSection = '';
      
      for (let i = this.sections.length - 1; i >= 0; i--) {
        const section = this.sections[i];
        if (scrollPosition >= section.offset) {
          currentSection = section.id;
          break;
        }
      }

      // If we're at the top of the page, set home as active
      if (scrollPosition < 200) {
        currentSection = 'home';
      }

      // Only update if the active section has changed
      if (currentSection !== this.activeSectionSubject.value) {
        this.activeSectionSubject.next(currentSection);
      }
    };

    // Add scroll listener with throttling
    let ticking = false;
    const throttledScrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (this.scrollListener) {
            this.scrollListener();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollListener, { passive: true });
  }

  /**
   * Stop listening to scroll events
   */
  private stopScrollListener(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }

  /**
   * Scroll to a specific section
   * @param sectionId The ID of the section to scroll to
   * @param behavior Scroll behavior ('smooth' or 'auto')
   */
  scrollToSection(sectionId: string, behavior: ScrollBehavior = 'smooth'): void {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.element.scrollIntoView({ 
        behavior,
        block: 'start'
      });
    }
  }

  /**
   * Get all registered sections
   */
  getSections(): ScrollSection[] {
    return [...this.sections];
  }
}
