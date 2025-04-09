document.addEventListener('DOMContentLoaded', function() {
    // Handle mobile navigation
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Close mobile navigation if needed
            if (window.innerWidth <= 768) {
                // Add mobile navigation toggle logic here if needed
            }
        });
    });
});
