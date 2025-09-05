import { Injectable, ElementRef, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private observer: IntersectionObserver | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Only create IntersectionObserver in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );
    }
  }

  // Animation definitions
  static getAnimations() {
    return [
      trigger('fadeUp', [
        state('hidden', style({
          opacity: 0,
          transform: 'translateY(30px)'
        })),
        state('visible', style({
          opacity: 1,
          transform: 'translateY(0)'
        })),
        transition('hidden => visible', animate('600ms ease-out'))
      ]),
      trigger('fadeRight', [
        state('hidden', style({
          opacity: 0,
          transform: 'translateX(-30px)'
        })),
        state('visible', style({
          opacity: 1,
          transform: 'translateX(0)'
        })),
        transition('hidden => visible', animate('600ms ease-out'))
      ]),
      trigger('fadeLeft', [
        state('hidden', style({
          opacity: 0,
          transform: 'translateX(30px)'
        })),
        state('visible', style({
          opacity: 1,
          transform: 'translateX(0)'
        })),
        transition('hidden => visible', animate('600ms ease-out'))
      ]),
      trigger('zoomIn', [
        state('hidden', style({
          opacity: 0,
          transform: 'scale(0.8)'
        })),
        state('visible', style({
          opacity: 1,
          transform: 'scale(1)'
        })),
        transition('hidden => visible', animate('600ms ease-out'))
      ]),
      trigger('fadeDown', [
        state('hidden', style({
          opacity: 0,
          transform: 'translateY(-30px)'
        })),
        state('visible', style({
          opacity: 1,
          transform: 'translateY(0)'
        })),
        transition('hidden => visible', animate('600ms ease-out'))
      ]),
      trigger('slideInUp', [
        state('hidden', style({
          opacity: 0,
          transform: 'translateY(50px)'
        })),
        state('visible', style({
          opacity: 1,
          transform: 'translateY(0)'
        })),
        transition('hidden => visible', animate('800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'))
      ])
    ];
  }

  // Initialize animations for elements
  initAnimations(elementRef: ElementRef, renderer: Renderer2) {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId) || !this.observer) {
      return;
    }

    const elements = elementRef.nativeElement.querySelectorAll('[data-animation]');
    console.log('Initializing animations for', elements.length, 'elements');
    
    elements.forEach((el: HTMLElement, index: number) => {
      const animationType = el.getAttribute('data-animation');
      const delay = parseInt(el.getAttribute('data-delay') || '0');
      
      // Set initial state - ensure element is hidden initially
      renderer.addClass(el, 'animation-hidden');
      renderer.setStyle(el, 'animation-delay', `${delay}ms`);
      
      // Ensure the element has the proper initial styles
      if (animationType) {
        renderer.addClass(el, `animation-${animationType}`);
      }
      
      // Add to intersection observer
      this.observer!.observe(el);
    });

    // Check if any elements are already in viewport and trigger them immediately
    setTimeout(() => {
      this.checkElementsInViewport(elements);
    }, 100);

    // Fallback: Force show all elements after 3 seconds to prevent them from staying hidden
    setTimeout(() => {
      this.forceShowAllElements(elements);
    }, 3000);
  }

  // Check if elements are already in viewport and trigger them
  private checkElementsInViewport(elements: NodeListOf<Element>) {
    elements.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.classList.contains('animation-hidden')) {
        const rect = htmlEl.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
          console.log('Element already in viewport, triggering animation:', htmlEl);
          htmlEl.classList.remove('animation-hidden');
          htmlEl.classList.add('animation-visible');
          htmlEl.offsetHeight; // Force reflow
        }
      }
    });
  }

  // Fallback method to force show all animated elements
  private forceShowAllElements(elements: NodeListOf<Element>) {
    elements.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.classList.contains('animation-hidden')) {
        console.log('Force showing element:', htmlEl);
        htmlEl.classList.remove('animation-hidden');
        htmlEl.classList.add('animation-visible');
      }
    });
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        console.log('Element entering viewport:', element);
        
        // Remove hidden class and add visible class
        element.classList.remove('animation-hidden');
        element.classList.add('animation-visible');
        
        // Force a reflow to ensure the transition starts
        element.offsetHeight;
        
        // Stop observing this element
        if (this.observer) {
          this.observer.unobserve(element);
        }
      }
    });
  }

  // Clean up observer
  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
