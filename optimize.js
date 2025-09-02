// optimize.js
document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".fade-in");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // Stop observing after visible
      }
    });
  }, {
    threshold: 0.2, // 20% of element visible
  });

  elements.forEach((el) => observer.observe(el));
});
