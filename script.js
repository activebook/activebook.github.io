document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    // Fetch and display GitHub repositories from local JSON file
    const repoContainer = document.getElementById('repos-container');
    const loadingMessage = document.getElementById('loading-message');
    const localReposUrl = './repos.json';

    const starIcon = `<svg class="svg-icon" viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5l-2.962.43L6.2 7.965l-.5 2.943L8 9.58l2.3 1.328-.5-2.942 2.146-2.033-2.962-.43L8 2.695z"></path></svg>`;
    const forkIcon = `<svg class="svg-icon" viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zM10.75 6.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-3.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path></svg>`;

    fetch(localReposUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Could not find repos.json. Did you run the generator script?`);
            }
            return response.json();
        })
        .then(repos => {
            if (loadingMessage) loadingMessage.remove();

            if (repos.length === 0) {
                repoContainer.innerHTML = '<p class="text-center">No repositories found in repos.json.</p>';
                return;
            }

            repos.forEach(repo => {
                const repoCard = document.createElement('div');
                repoCard.className = 'col-md-6 col-lg-4';
                repoCard.setAttribute('data-aos', 'fade-up');

                const description = repo.description ? repo.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'No description provided.';

                repoCard.innerHTML = `
                    <div class="card project-card h-100">
                        <div class="card-body">
                            <h5 class="project-title">
                                <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                            </h5>
                            <p class="card-text">${description}</p>
                        </div>
                        <div class="card-footer bg-white border-top-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="text-muted small">
                                    ${repo.language ? `<span><i class="fas fa-code me-1"></i>${repo.language}</span>` : ''}
                                </div>
                                <div class="text-muted small">
                                    <span class="me-3">${starIcon} ${repo.stargazers_count}</span>
                                    <span>${forkIcon} ${repo.forks_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                repoContainer.appendChild(repoCard);
            });
        })
        .catch(error => {
            console.error('Error loading local repositories:', error);
            if (loadingMessage) loadingMessage.remove();
            repoContainer.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
        });
});
