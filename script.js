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
                                <span class="badge bg-primary project-badge">${repo.type || 'Project'}</span>
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
