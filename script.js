document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    const projectContainer = document.getElementById('project-list-container');
    const localReposUrl = './repos.json';

    function getLanguageBadge(language) {
        if (!language) return '';
        const languageLower = language.toLowerCase();
        return `
            <span class="badge badge-${languageLower} language-badge">
                <i class="fas fa-code me-1"></i>${language}
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
            if (!projectContainer) return;

            // Clear the hardcoded projects
            projectContainer.innerHTML = '';

            // Populate with projects from JSON
            repos.forEach((repo, index) => {
                const repoCard = document.createElement('div');
                repoCard.className = 'col-md-6 col-lg-4';
                repoCard.setAttribute('data-aos', 'fade-up');
                repoCard.setAttribute('data-aos-delay', `${(index % 3) * 100}`);

                const description = repo.description || 'No description provided.';
                const projectUrl = `https://activebook.github.io/${repo.name}/`;
                // A simple way to guess the badge type based on repo name or tags
                const badgeType = repo.name.includes('extension') ? 'Extension' : repo.name.includes('cli') ? 'CLI Tool' : 'Project';

                repoCard.innerHTML = `
                    <div class="card project-card">
                        <div class="project-image-container">
                            ${getLanguageBadge(repo.language)}
                            <span class="badge bg-primary project-badge">${badgeType}</span>
                            <img src="https://raw.githubusercontent.com/activebook/${repo.name}/main/images/screenshot.png" alt="${repo.name} Screenshot" class="project-image" onerror="this.onerror=null;this.src='./images/icon.png';">
                        </div>
                        <div class="card-body">
                            <h5 class="project-title">${repo.name}</h5>
                            <p class="card-text">${description}</p>
                            <a href="${projectUrl}" class="btn btn-outline-primary">Explore</a>
                        </div>
                    </div>
                `;
                projectContainer.appendChild(repoCard);
            });
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            if (projectContainer) {
                projectContainer.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
            }
        });
});