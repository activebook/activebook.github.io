/**
 * ACTIVEBOOK AGORA LAB — CLIENT APPLICATION ENGINE
 * Features: Telemetry Aggregation, Real-Time Search, Multi-Taxonomy Filtering,
 * Mouse Spotlight Shader, Dynamic Shimmer Skeletons, and Smooth Theme Transitions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Footer Year
    const yearElem = document.getElementById('current-year');
    if (yearElem) {
        yearElem.textContent = new Date().getFullYear();
    }

    // 2. Initialize Theme Management
    initializeTheme();

    // 3. State Management
    let allRepos = [];
    let currentFilter = 'all';
    let currentSearchQuery = '';
    let currentSort = 'featured';

    const projectContainer = document.getElementById('project-list-container');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('project-search');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const filterChips = document.querySelectorAll('.filter-chip');
    const sortSelect = document.getElementById('project-sort');
    const resultsCountText = document.getElementById('results-count-text');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    // Language Color Map (Authentic GitHub Language Palette)
    const languageColors = {
        'Go': '#00ADD8',
        'Swift': '#F05138',
        'TypeScript': '#3178C6',
        'JavaScript': '#F7DF1E',
        'Python': '#3572A5',
        'C': '#555555',
        'C++': '#F34B7D',
        'Rust': '#DEA584',
        'Dart': '#00B4AB',
        'HTML': '#E34F26',
        'CSS': '#563D7C',
        'Shell': '#89E051'
    };

    // Curated Craftsmanship & Domain Capability Metadata
    const repoCraftsmanship = {
        'tranz-video': {
            badge: 'OCR & Video',
            highlight: 'In-Stream Subtitle Extraction',
            icon: 'fa-closed-captioning'
        },
        'tranz': {
            badge: 'AppKit • Accessibility',
            highlight: 'In-Place macOS LLM Injection',
            icon: 'fa-wand-magic-sparkles'
        },
        'clash_forge': {
            badge: 'Multi-Protocol Core',
            highlight: 'Automated YAML Proxy Pipeline',
            icon: 'fa-shield-halved'
        },
        'gllm': {
            badge: 'Multi-Agent CLI',
            highlight: 'Autonomous LLM Workflows & MCP',
            icon: 'fa-terminal'
        },
        'gllm-companion': {
            badge: 'IDE Workspace Bridge',
            highlight: 'Native Inline Diff & Context Sync',
            icon: 'fa-code-compare'
        },
        'tunnel-worker': {
            badge: 'Cloudflare Edge',
            highlight: 'Zero-Trust Global Edge Tunnel',
            icon: 'fa-network-wired'
        },
        'auto-wechat': {
            badge: 'CV Computer Vision',
            highlight: 'Non-Invasive GUI Driver',
            icon: 'fa-eye'
        },
        'unlock-wechat': {
            badge: 'Low-Level C Mutex',
            highlight: 'Multi-Instance Process Unlocker',
            icon: 'fa-lock-open'
        },
        'EverEtch': {
            badge: 'Spaced Repetition',
            highlight: 'Offline-First AI Vocabulary',
            icon: 'fa-brain'
        },
        'media_downloader': {
            badge: 'Chromium Sniffer',
            highlight: 'Automated Stream Extractor',
            icon: 'fa-download'
        },
        'atom-updater': {
            badge: 'Self-Updating Daemon',
            highlight: 'Atomic Binary Rollback Engine',
            icon: 'fa-arrows-rotate'
        },
        'tts-mcp-server': {
            badge: 'MCP Protocol',
            highlight: 'Google Neural Speech Server',
            icon: 'fa-server'
        },
        'copilot_sidebar': {
            badge: 'DOM Prompt Engine',
            highlight: 'Contextual AI Web Extractor',
            icon: 'fa-table-columns'
        },
        'speechie': {
            badge: 'Instant Hotkey TTS',
            highlight: 'Lightweight Web Audio Reader',
            icon: 'fa-volume-high'
        },
        'SakanaVision': {
            badge: 'Native Window Hook',
            highlight: 'Global Japanese In-Place OCR',
            icon: 'fa-language'
        },
        'SakanaLens': {
            badge: 'Python Vision Pipeline',
            highlight: 'Hotkeyed Screen Translator',
            icon: 'fa-magnifying-glass'
        },
        'GVoice': {
            badge: 'Gemini Audio Engine',
            highlight: 'Desktop Neural Speech Synthesis',
            icon: 'fa-microphone-lines'
        },
        'KokoroVoice': {
            badge: 'Local Neural Model',
            highlight: 'Kokoro-82M Zero-Token TTS',
            icon: 'fa-wave-square'
        }
    };

    // Category Classification Classifier
    function getCategoryForRepo(repo) {
        const name = (repo.name || '').toLowerCase();
        const type = (repo.type || '').toLowerCase();
        const desc = (repo.description || '').toLowerCase();

        const isAI = type.includes('agent') || type.includes('cli') || type.includes('mcp') ||
                     name.includes('gllm') || desc.includes('llm') || desc.includes('model') || desc.includes('copilot');
        
        const isNative = type.includes('macos') || type.includes('native') || type.includes('cv') ||
                         name === 'tranz' || name.includes('sakana') || name.includes('wechat');

        const isExtension = type.includes('extension') || type.includes('chrome') || type.includes('vs code');

        const isVoice = type.includes('tts') || type.includes('voice') || name.includes('voice') || 
                        name.includes('speech') || name.includes('tts') || desc.includes('text-to-speech');

        const isTools = type.includes('worker') || type.includes('proxy') || type.includes('package') || 
                        type.includes('learning') || name.includes('tunnel') || name.includes('updater') || name.includes('clash');

        return { isAI, isNative, isExtension, isVoice, isTools };
    }

    function matchesCategory(repo, filter) {
        if (filter === 'all') return true;
        const cat = getCategoryForRepo(repo);
        switch (filter) {
            case 'ai-agent': return cat.isAI;
            case 'macos-native': return cat.isNative;
            case 'extensions': return cat.isExtension;
            case 'voice-audio': return cat.isVoice;
            case 'tools-edge': return cat.isTools;
            default: return true;
        }
    }

    // 4. Fetch Repos and Initialize Engine
    fetch('./repos.json?v=' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(repos => {
            allRepos = repos;
            updateTelemetryKPIs(repos);
            updateFilterCounts(repos);
            renderProjects();
        })
        .catch(err => {
            console.error('Failed to load repos.json:', err);
            if (projectContainer) {
                projectContainer.innerHTML = `
                    <div class="empty-state glass-card" style="grid-column: 1/-1;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 1rem;"></i>
                        <h3>Unable to load project data</h3>
                        <p style="color: var(--text-secondary);">${err.message}</p>
                    </div>
                `;
            }
        });

    // 5. KPI Telemetry Calculator
    function updateTelemetryKPIs(repos) {
        const totalProjectsElem = document.getElementById('kpi-projects-count');
        const totalDomainsElem = document.getElementById('kpi-domains-count');
        const totalLangsElem = document.getElementById('kpi-langs-count');

        if (totalProjectsElem) animateValue(totalProjectsElem, 0, repos.length, 800);

        // Core domain categories (AI & CLI, macOS Native, Extensions, Voice & TTS, Tools & Edge)
        const domainCount = 6;
        if (totalDomainsElem) animateValue(totalDomainsElem, 0, domainCount, 800);

        const uniqueLangs = new Set(repos.map(r => r.language).filter(Boolean));
        if (totalLangsElem) animateValue(totalLangsElem, 0, uniqueLangs.size, 800);
    }

    function updateFilterCounts(repos) {
        const countAll = document.getElementById('count-all');
        const countAI = document.getElementById('count-ai');
        const countNative = document.getElementById('count-native');
        const countExt = document.getElementById('count-ext');
        const countVoice = document.getElementById('count-voice');
        const countTools = document.getElementById('count-tools');

        if (countAll) countAll.textContent = repos.length;
        if (countAI) countAI.textContent = repos.filter(r => matchesCategory(r, 'ai-agent')).length;
        if (countNative) countNative.textContent = repos.filter(r => matchesCategory(r, 'macos-native')).length;
        if (countExt) countExt.textContent = repos.filter(r => matchesCategory(r, 'extensions')).length;
        if (countVoice) countVoice.textContent = repos.filter(r => matchesCategory(r, 'voice-audio')).length;
        if (countTools) countTools.textContent = repos.filter(r => matchesCategory(r, 'tools-edge')).length;
    }

    // Number Animation Helper
    function animateValue(element, start, end, duration) {
        if (start === end) {
            element.textContent = end;
            return;
        }
        const range = end - start;
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range)) || 20;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    // 6. Project Rendering & Filtering Core
    function renderProjects() {
        if (!projectContainer) return;

        // Filter by Category and Search Query
        let filtered = allRepos.filter(repo => {
            const matchesCat = matchesCategory(repo, currentFilter);
            if (!matchesCat) return false;

            if (!currentSearchQuery) return true;

            const q = currentSearchQuery.toLowerCase();
            const name = (repo.name || '').toLowerCase();
            const desc = (repo.description || '').toLowerCase();
            const type = (repo.type || '').toLowerCase();
            const lang = (repo.language || '').toLowerCase();

            return name.includes(q) || desc.includes(q) || type.includes(q) || lang.includes(q);
        });

        // Apply Sorting
        if (currentSort === 'name') {
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (currentSort === 'language') {
            filtered.sort((a, b) => (a.language || '').localeCompare(b.language || ''));
        }

        // Update Results Count Text
        if (resultsCountText) {
            resultsCountText.textContent = `Showing ${filtered.length} of ${allRepos.length} projects`;
        }

        // Handle Empty State
        if (filtered.length === 0) {
            projectContainer.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }

        // Clear Container and Construct DOM Elements
        projectContainer.innerHTML = '';

        filtered.forEach((repo, idx) => {
            const delay = (idx % 6) * 0.08 + 's';
            const langColor = languageColors[repo.language] || 'var(--accent-indigo)';
            const meta = repoCraftsmanship[repo.name] || {
                badge: repo.type || 'Engineering Tool',
                highlight: repo.type || 'System Utility',
                icon: 'fa-cube'
            };

            const cardHTML = `
                <a href="${repo.html_url}" class="project-card-link" target="_blank" rel="noopener noreferrer" style="animation-delay: ${delay};" aria-label="Explore ${repo.name} repository">
                    <article class="project-card">
                        <div class="project-media-wrapper">
                            <img src="./images/${repo.name}.jpg" alt="${repo.name} Preview" class="project-image" loading="lazy" onerror="this.onerror=null;this.src='./images/icon.png';">
                            <div class="media-overlay"></div>
                            <div class="media-shine-sweep" aria-hidden="true"></div>
                            <span class="media-type-badge">${repo.type || 'Tool'}</span>
                            <span class="media-domain-pill"><i class="fas ${meta.icon}"></i> ${meta.badge}</span>
                        </div>
                        <div class="project-card-body">
                            <div class="project-header-row">
                                <h3 class="project-title">${repo.name}</h3>
                                <span class="explore-icon-bubble" aria-hidden="true">
                                    <i class="fas fa-arrow-up-right-from-square"></i>
                                </span>
                            </div>
                            <div class="project-highlight-badge">
                                <i class="fas fa-bolt text-indigo"></i>
                                <span>${meta.highlight}</span>
                            </div>
                            <p class="project-desc">${repo.description || 'No description provided.'}</p>
                            <div class="project-card-footer">
                                <div class="language-pill">
                                    <span class="lang-dot" style="background-color: ${langColor};"></span>
                                    <span>${repo.language || 'Plain'}</span>
                                </div>
                                <div class="action-explore-pill">
                                    <span>View Architecture</span>
                                    <i class="fas fa-arrow-right explore-arrow" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                    </article>
                </a>
            `;

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHTML.trim();
            const cardElement = tempDiv.firstChild;

            // Attach Mouse Spotlight Coordinate Tracking with Immediate Enter Sync
            const cardArticle = cardElement.querySelector('.project-card');
            if (cardArticle) {
                const updateCoords = (e) => {
                    const rect = cardArticle.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    cardArticle.style.setProperty('--mouse-x', `${x}px`);
                    cardArticle.style.setProperty('--mouse-y', `${y}px`);
                };
                cardArticle.addEventListener('mouseenter', updateCoords, { passive: true });
                cardArticle.addEventListener('mousemove', updateCoords, { passive: true });
            }

            projectContainer.appendChild(cardElement);
        });
    }

    // 7. Event Listeners for Controls
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.trim();
            if (searchClearBtn) {
                searchClearBtn.style.display = currentSearchQuery ? 'flex' : 'none';
            }
            renderProjects();
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                currentSearchQuery = '';
                searchClearBtn.style.display = 'none';
                searchInput.focus();
                renderProjects();
            }
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-selected', 'false');
            });
            chip.classList.add('active');
            chip.setAttribute('aria-selected', 'true');
            currentFilter = chip.getAttribute('data-filter') || 'all';
            renderProjects();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProjects();
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            currentFilter = 'all';
            currentSearchQuery = '';
            currentSort = 'featured';

            if (searchInput) {
                searchInput.value = '';
                if (searchClearBtn) searchClearBtn.style.display = 'none';
            }
            if (sortSelect) sortSelect.value = 'featured';

            filterChips.forEach(c => {
                const isAll = c.getAttribute('data-filter') === 'all';
                c.classList.toggle('active', isAll);
                c.setAttribute('aria-selected', isAll ? 'true' : 'false');
            });

            renderProjects();
        });
    }

    // 8. Theme Management Subsystem
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // Listen for OS Theme Changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        });
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    }
});
