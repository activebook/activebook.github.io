document.addEventListener('DOMContentLoaded', () => {
    const repoContainer = document.getElementById('repo-container');
    const loadingMessage = document.getElementById('loading-message');
    const orgName = 'activebook'; // Your GitHub organization name
    const apiUrl = `https://api.github.com/orgs/${orgName}/repos?sort=updated&per_page=50`; // Fetch up to 50 repos, sorted by last updated

    // Simple SVG icons (replace with FontAwesome or other libraries if preferred)
    const starIcon = `<svg viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5l-2.962.43L6.2 7.965l-.5 2.943L8 9.58l2.3 1.328-.5-2.942 2.146-2.033-2.962-.43L8 2.695z"></path></svg>`;
    const forkIcon = `<svg viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zM10.75 6.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-3.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"></path></svg>`;
    const codeIcon = `<svg viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M4.72 3.22a.75.75 0 011.06 1.06L2.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L.47 8.53a.75.75 0 010-1.06l4.25-4.25zm6.56 0a.75.75 0 10-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 101.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25z"></path></svg>`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(repos => {
            loadingMessage.remove(); // Remove loading message

            if (repos.length === 0) {
                repoContainer.innerHTML = '<p id="error-message">No repositories found for this organization.</p>';
                return;
            }

            repos.forEach(repo => {
                // Create the card element
                const card = document.createElement('div');
                card.className = 'repo-card';

                // Sanitize description to prevent XSS if description contained HTML/JS
                const description = repo.description ? repo.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'No description provided.';

                // Card content
                card.innerHTML = `
                    <h3>
                        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                    </h3>
                    <p>${description}</p>
                    <div class="repo-meta">
                        ${repo.language ? `<span>${codeIcon} ${repo.language}</span>` : ''}
                        <span>${starIcon} ${repo.stargazers_count}</span>
                        <span>${forkIcon} ${repo.forks_count}</span>
                    </div>
                `;

                // Append the card to the container
                repoContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error fetching repositories:', error);
            if (loadingMessage) loadingMessage.remove();
            repoContainer.innerHTML = `<p id="error-message">Failed to load repositories. Please check the organization name or try again later. Error: ${error.message}</p>`;
        });
});
