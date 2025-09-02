const mobileMenuButton = document.getElementById('mobile-menu-button');
const closeMenuButton = document.getElementById('close-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuOverlay = mobileMenu.querySelector('.absolute.inset-0');
const mobileMenuContent = mobileMenu.querySelector('.absolute.inset-y-0.right-0');
const menuLinks = mobileMenu.querySelectorAll('nav a');

function openMenu() {
  mobileMenu.classList.remove('pointer-events-none');
  mobileMenu.classList.add('pointer-events-auto');
  mobileMenu.style.opacity = '1';
  mobileMenuOverlay.style.opacity = '1';
  mobileMenuContent.style.transform = 'translateX(0) scale(1)';
  mobileMenuContent.style.opacity = '1';
  
  // Animate menu items
  menuLinks.forEach((link, index) => {
    setTimeout(() => {
      link.style.opacity = '1';
    }, 100 + (index * 100));
  });
}

function closeMenu() {
  mobileMenu.style.opacity = '0';
  mobileMenuOverlay.style.opacity = '0';
  mobileMenuContent.style.transform = 'translateX(100%) scale(0.95)';
  mobileMenuContent.style.opacity = '0';
  
  // Reset menu items opacity
  menuLinks.forEach(link => {
    link.style.opacity = '0';
  });

  setTimeout(() => {
    mobileMenu.classList.remove('pointer-events-auto');
    mobileMenu.classList.add('pointer-events-none');
  }, 700);
}

mobileMenuButton.addEventListener('click', openMenu);
closeMenuButton.addEventListener('click', closeMenu);
mobileMenuOverlay.addEventListener('click', closeMenu);

document.addEventListener('DOMContentLoaded', function() {
  const mobileMenu = document.getElementById('mobile-menu');
  const menuButton = document.getElementById('mobile-menu-button');
  const closeButton = document.getElementById('close-menu-button');
  const menuContent = mobileMenu.querySelector('.absolute.right-0');
  const backdrop = mobileMenu.querySelector('.absolute.inset-0');
  const menuItems = mobileMenu.querySelectorAll('nav a, button');
  
  function openMenu() {
    // Make menu visible
    mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
    
    // Animate backdrop
    backdrop.classList.add('opacity-100');
    
    // Animate menu panel with a delay
    setTimeout(() => {
      menuContent.classList.remove('translate-x-full', 'scale-95', 'opacity-0');
      
      // Animate menu items one by one with longer delays
      menuItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('animate-fadeSlideIn');
        }, 300 + (index * 150)); // Increased delay between items
      });
    }, 300); // Increased initial delay
  }

  function closeMenu() {
    // Animate menu panel out
    menuContent.classList.add('translate-x-full', 'scale-95', 'opacity-0');
    
    // Fade out backdrop
    backdrop.classList.remove('opacity-100');
    
    // Reset menu items animation
    menuItems.forEach(item => {
      item.classList.remove('animate-fadeSlideIn');
    });
    
    // Hide menu after animations
    setTimeout(() => {
      mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
    }, 700); // Increased closing delay
  }

  menuButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);
});