// Hamburger Menu Toggle
function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('navMenu');
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

function closeMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('navMenu');
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('navMenu');
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Active link highlighting
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Smooth scroll
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Hero buttons smooth scroll
document.querySelectorAll('.hero-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(btn.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Scroll reveal
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.card, .step, .section-text').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(40px)';
    el.style.transition = '0.6s ease';
    observer.observe(el);
});

// Counter Animation for Statistics
const counters = document.querySelectorAll('.stat-number');
let hasAnimated = false;

const animateCounters = () => {
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    });
};

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            animateCounters();
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Email Popup Functionality
const initiateBtn = document.getElementById('initiateDiscussionBtn');
const emailPopup = document.getElementById('emailPopup');
const popupClose = document.querySelector('.popup-close');

// Open popup when button is clicked
if (initiateBtn) {
    initiateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        emailPopup.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
}

// Close popup when X is clicked
if (popupClose) {
    popupClose.addEventListener('click', () => {
        emailPopup.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scrolling
    });
}

// Close popup when clicking outside the content
if (emailPopup) {
    emailPopup.addEventListener('click', (e) => {
        if (e.target === emailPopup) {
            emailPopup.classList.remove('active');
            document.body.style.overflow = 'auto'; // Restore scrolling
        }
    });
}

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && emailPopup.classList.contains('active')) {
        emailPopup.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
});
