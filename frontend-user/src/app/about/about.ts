import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize any animations or effects
    this.initializeAnimations();
  }

  private initializeAnimations(): void {
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
