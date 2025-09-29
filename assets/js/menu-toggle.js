// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-menu");

  if (hamburger && nav) {
    // Set ARIA attributes for accessibility
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-controls", "nav-menu");
    hamburger.setAttribute("aria-label", "Toggle navigation menu");

    hamburger.addEventListener("click", () => {
      const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", !isExpanded);
      nav.classList.toggle("show");

      // Focus management for accessibility
      if (!isExpanded) {
        // When opening menu, focus on first link
        setTimeout(() => {
          const firstLink = nav.querySelector("a");
          if (firstLink) firstLink.focus();
        }, 100);
      }
    });

    // Hide menu after clicking a link (for mobile UX)
    nav.querySelectorAll("a").forEach(link =>
      link.addEventListener("click", () => {
        nav.classList.remove("show");
        hamburger.setAttribute("aria-expanded", "false");
      })
    );

    // Close menu when clicking outside
    document.addEventListener("click", (event) => {
      if (nav.classList.contains("show") &&
          !nav.contains(event.target) &&
          !hamburger.contains(event.target)) {
        nav.classList.remove("show");
        hamburger.setAttribute("aria-expanded", "false");
      }
    });

    // Close menu on Escape key
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("show")) {
        nav.classList.remove("show");
        hamburger.setAttribute("aria-expanded", "false");
        hamburger.focus();
      }
    });
  }
});
