document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    const projectContainer = document.getElementById('project-list-container');
    const localReposUrl = './repos.json';

    function getLanguageBadge(language) {
        if (!language) return '';

        // Normalize language name for badge class
        const languageMap = {
            'typescript': 'badge-typescript',
            'javascript': 'badge-javascript',
            'python': 'badge-python',
            'go': 'badge-golang',
            'golang': 'badge-golang',
            'dart': 'badge-dart',
            'java': 'badge-java',
            'c++': 'badge-cpp',
            'cpp': 'badge-cpp',
            'rust': 'badge-rust',
            'php': 'badge-php',
            'ruby': 'badge-ruby',
            'c#': 'badge-csharp',
            'csharp': 'badge-csharp',
            'swift': 'badge-swift',
            'kotlin': 'badge-kotlin',
            'html': 'badge-html',
            'css': 'badge-css'
        };

        const badgeClass = languageMap[language.toLowerCase()] || 'badge-typescript';
        const iconMap = {
            'html': 'fab fa-html5',
            'css': 'fab fa-css3',
            'javascript': 'fab fa-js-square',
            'typescript': 'fab fa-js-square',
            'python': 'fab fa-python',
            'java': 'fab fa-java',
            'php': 'fab fa-php',
            'swift': 'fas fa-swift',
            'go': 'fas fa-code',
            'golang': 'fas fa-code',
            'rust': 'fas fa-cog',
            'c++': 'fas fa-code',
            'cpp': 'fas fa-code',
            'c#': 'fas fa-code',
            'csharp': 'fas fa-code',
            'dart': 'fas fa-code',
            'kotlin': 'fas fa-code',
            'ruby': 'fas fa-gem'
        };

        const iconClass = iconMap[language.toLowerCase()] || 'fas fa-code';

        return `
            <span class="language-badge ${badgeClass}">
                <i class="${iconClass} me-1"></i>${language}
            </span>
        `;
    }

    function getProjectBadge(projectType) {
        if (!projectType) return '<span class="project-badge badge-web">Project</span>';

        // Normalize project type for badge class
        const typeMap = {
            'learning': 'badge-learning',
            'cli tool': 'badge-cli',
            'cli': 'badge-cli',
            'npm package': 'badge-package',
            'npm': 'badge-package',
            'mcp server': 'badge-mcp',
            'mcp': 'badge-mcp',
            'chrome extension': 'badge-extension',
            'extension': 'badge-extension',
            'networking': 'badge-networking',
            'translation': 'badge-translation',
            'tts': 'badge-tts',
            'tts engine': 'badge-tts',
            'web app': 'badge-web',
            'web': 'badge-web',
            'mobile app': 'badge-mobile',
            'mobile': 'badge-mobile'
        };

        const badgeClass = typeMap[projectType.toLowerCase()] || 'badge-web';

        // Icon mapping for project types
        const iconMap = {
            'learning': 'fas fa-graduation-cap',
            'cli': 'fas fa-terminal',
            'package': 'fab fa-npm',
            'mcp': 'fas fa-exchange-alt',
            'extension': 'fas fa-puzzle-piece',
            'networking': 'fas fa-network-wired',
            'translation': 'fas fa-language',
            'tts': 'fas fa-microphone',
            'web': 'fas fa-globe',
            'mobile': 'fas fa-mobile-alt'
        };

        const iconClass = iconMap[projectType.toLowerCase()] || 'fas fa-code';

        return `
            <span class="project-badge ${badgeClass}">
                <i class="${iconClass} me-1"></i>${projectType}
            </span>
        `;
    }

    fetch(localReposUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Could not load repos.json. Make sure the file exists.`);
            }
            return response.json();
        })
        .then(repos => {
            if (!projectContainer) {
                console.error('Error: Could not find the project container element with ID project-list-container.');
                return;
            }

            // Clear the hardcoded projects
            projectContainer.innerHTML = '';

            // Populate with projects from JSON
            repos.forEach((repo, index) => {
                const repoCardHTML = `
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${(index % 3) * 100}">
                        <div class="card project-card">
                            <div class="project-image-container">
                                ${getLanguageBadge(repo.language)}
                                ${getProjectBadge(repo.type)}
                                <img src="./images/${repo.name}.jpg" alt="${repo.name} Screenshot" class="project-image" onerror="this.onerror=null;this.src='./images/icon.png';">
                            </div>
                            <div class="card-body">
                                <h5 class="project-title">${repo.name}</h5>
                                <p class="card-text">${repo.description || 'No description provided.'}</p>
                                <a href="https://activebook.github.io/${repo.name}/" class="btn btn-outline-primary">Explore</a>
                            </div>
                        </div>
                    </div>
                `;
                projectContainer.innerHTML += repoCardHTML;
            });
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            if (projectContainer) {
                projectContainer.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
            }
        });
});
