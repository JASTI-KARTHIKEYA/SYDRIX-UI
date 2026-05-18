// Navbar scroll effect and progress bar
const navbar = document.getElementById("navbar");
const scrollProgress = document.getElementById("scrollProgress");

function handleScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (scrollTop > 40) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }

    scrollProgress.style.width = `${progress}%`;
}

window.addEventListener("scroll", handleScroll);
handleScroll();

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("open");
    });
}

// Smooth scroll and close mobile menu
const anchorLinks = document.querySelectorAll('a[href^="#"]');

anchorLinks.forEach(link => {
    link.addEventListener("click", event => {
        const targetId = link.getAttribute("href");
        const targetElement = document.querySelector(targetId);

        if (!targetElement) return;

        event.preventDefault();
        navLinks.classList.remove("open");

        const offset = 86;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: "smooth"
        });
    });
});

// Reveal animation
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.16
});

revealElements.forEach(element => {
    revealObserver.observe(element);
});

// Active nav link on scroll
const sections = document.querySelectorAll("section[id], header[id]");
const navItems = document.querySelectorAll(".nav-links a");

function setActiveNavLink() {
    let currentSection = "";

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 160;

        if (window.scrollY >= sectionTop) {
            currentSection = section.getAttribute("id");
        }
    });

    navItems.forEach(link => {
        link.classList.remove("active");

        if (link.getAttribute("href") === `#${currentSection}`) {
            link.classList.add("active");
        }
    });
}

window.addEventListener("scroll", setActiveNavLink);
setActiveNavLink();

// Copy email button
const copyEmailButton = document.getElementById("copyEmail");
const email = "contact-us@sydrixglobal.com";

if (copyEmailButton) {
    copyEmailButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(email);
            copyEmailButton.textContent = "Email Copied";

            setTimeout(() => {
                copyEmailButton.textContent = "Copy Email";
            }, 1600);
        } catch (error) {
            copyEmailButton.textContent = email;
        }
    });
}

// Footer year
const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
