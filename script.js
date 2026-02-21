document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const yearElem = document.getElementById('current-year');
    if (yearElem) {
        yearElem.textContent = new Date().getFullYear();
    }

    // Initialize theme
    initializeTheme();

    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    const projectContainer = document.getElementById('project-list-container');
    const localReposUrl = './repos.json';

    // Simple Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const fadeUpObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add a small delay based on the elements position to create a staggered effect
                // The animation is handled purely by CSS using the class we add
                entry.target.style.animationPlayState = 'running';

                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function getLanguageBadge(language) {
        if (!language) return '';
        // Minimalist badge structure
        return `<span class="badge badge-lang">${language}</span>`;
    }

    function getProjectBadge(projectType) {
        if (!projectType) return '';
        // Minimalist badge structure
        return `<span class="badge badge-type">${projectType}</span>`;
    }

    fetch(localReposUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Could not load repos.json. Make sure the file exists.`);
            }
            return response.json();
        })
        .then(repos => {
            if (!projectContainer) return;

            // Clear skeleton loaders
            projectContainer.innerHTML = '';

            // Populate with projects from JSON
            repos.forEach((repo, index) => {
                // Calculate staggered delay for initial load
                const animationDelay = (index % 3) * 0.15 + 's';

                // Wrap the whole card in an anchor tag
                const repoHTML = `
                    <a href="${repo.html_url}" class="project-card-link" target="_blank" rel="noopener noreferrer" style="animation-play-state: paused; animation-delay: ${animationDelay};">
                        <article class="project-card">
                            <div class="project-image-container">
                                <img src="./images/${repo.name}.jpg" alt="${repo.name} Preview" class="project-image" loading="lazy" onerror="this.onerror=null;this.src='./images/icon.png';">
                            </div>
                            <div class="card-content">
                                <div class="badges-container">
                                    ${getLanguageBadge(repo.language)}
                                    ${getProjectBadge(repo.type)}
                                </div>
                                <h3 class="project-title">${repo.name}</h3>
                                <p class="card-text">${repo.description || 'No description provided.'}</p>
                            </div>
                        </article>
                    </a>
                `;

                // Create a temporary container to parse the string to DOM node
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = repoHTML.trim();
                const cardElement = tempDiv.firstChild;

                projectContainer.appendChild(cardElement);

                // Observe the new element for scroll animation
                fadeUpObserver.observe(cardElement);
            });
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            if (projectContainer) {
                projectContainer.innerHTML = `<p style="color: red; grid-column: 1/-1; text-align: center;">${error.message}</p>`;
            }
        });
});

// Theme Management Functions
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggleIcon(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme) {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    const icon = toggleButton.querySelector('i');

    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        toggleButton.setAttribute('aria-label', 'Switch to light mode');
    } else {
        icon.className = 'fas fa-moon';
        toggleButton.setAttribute('aria-label', 'Switch to dark mode');
    }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually set a preference
    if (!localStorage.getItem('theme')) {
        const theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeToggleIcon(theme);
    }
});
