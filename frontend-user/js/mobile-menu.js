// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenu = document.getElementById('mobile-menu');
  const menuButton = document.getElementById('mobile-menu-button');
  const closeButton = document.getElementById('close-menu-button');
  
  // Check if all required elements exist
  if (!mobileMenu || !menuButton || !closeButton) {
    return; // Exit early if elements don't exist
  }
  
  const menuContent = mobileMenu.querySelector('.absolute.right-0') || mobileMenu.querySelector('.absolute.inset-y-0.right-0');
  const backdrop = mobileMenu.querySelector('.absolute.inset-0');
  const menuItems = mobileMenu.querySelectorAll('nav a, button');
  
  // Check if menu content and backdrop exist
  if (!menuContent || !backdrop) {
    return; // Exit early if required child elements don't exist
  }
  
  function openMenu() {
    // Make menu visible
    mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
    mobileMenu.classList.remove('pointer-events-none');
    mobileMenu.style.opacity = '1';
    
    // Animate backdrop
    backdrop.classList.add('opacity-100');
    backdrop.style.opacity = '1';
    
    // Animate menu panel with a delay
    setTimeout(() => {
      menuContent.classList.remove('translate-x-full', 'scale-95', 'opacity-0');
      menuContent.style.transform = 'translateX(0) scale(1)';
      menuContent.style.opacity = '1';
      
      // Animate menu items one by one with longer delays
      menuItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('animate-fadeSlideIn');
          if (item.style) {
            item.style.opacity = '1';
          }
        }, 300 + (index * 150));
      });
    }, 300);
  }

  function closeMenu() {
    // Animate menu panel out
    menuContent.classList.add('translate-x-full', 'scale-95', 'opacity-0');
    menuContent.style.transform = 'translateX(100%) scale(0.95)';
    menuContent.style.opacity = '0';
    
    // Fade out backdrop
    backdrop.classList.remove('opacity-100');
    backdrop.style.opacity = '0';
    mobileMenu.style.opacity = '0';
    
    // Reset menu items animation
    menuItems.forEach(item => {
      item.classList.remove('animate-fadeSlideIn');
      if (item.style) {
        item.style.opacity = '0';
      }
    });
    
    // Hide menu after animations
    setTimeout(() => {
      mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      mobileMenu.classList.add('pointer-events-none');
    }, 700);
  }

  // Add event listeners
  menuButton.addEventListener('click', openMenu);
  closeButton.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);
});
