document.addEventListener("DOMContentLoaded", function () {
  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      });
    });
  });

  // Add animation to team members when they come into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  });

  document.querySelectorAll(".team-member").forEach((member) => {
    member.style.opacity = "0";
    member.style.transform = "translateY(20px)";
    member.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(member);
  });
});
