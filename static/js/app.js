// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;

    if (currentPage === '/' || currentPage === '/index.html') {
        loadLatestDigest();
    } else if (currentPage === '/archive' || currentPage === '/archive.html') {
        loadArchive();
    }
});

// Load the latest digest
async function loadLatestDigest() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const containerEl = document.getElementById('digest-container');

    try {
        const response = await fetch('/latest?format=json');

        if (!response.ok) {
            throw new Error('Failed to fetch digest');
        }

        const data = await response.json();

        // Hide loading, show content
        loadingEl.classList.add('hidden');
        containerEl.classList.remove('hidden');

        // Render the digest
        renderDigest(data, containerEl);

    } catch (error) {
        console.error('Error loading digest:', error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
    }
}

// Render digest data
function renderDigest(data, container) {
    const digest = data.digest || data;

    // Create header
    const header = document.createElement('div');
    header.className = 'digest-header';
    header.innerHTML = `
        <h2>Today's MENA Digest</h2>
        <p class="digest-date">${formatDate(digest.date || new Date().toISOString())}</p>
    `;

    // Create body
    const body = document.createElement('div');
    body.className = 'digest-body';

    // Add TL;DR section
    if (digest.tldr) {
        const tldrSection = document.createElement('div');
        tldrSection.className = 'tldr-section';
        tldrSection.innerHTML = `
            <h3>⚡ TL;DR</h3>
            <p>${digest.tldr}</p>
        `;
        body.appendChild(tldrSection);
    }

    // Add articles by section
    if (digest.sections && typeof digest.sections === 'object') {
        const articlesSection = document.createElement('div');
        articlesSection.className = 'articles-section';

        // Define section emojis
        const sectionEmojis = {
            'Egypt': '🇪🇬',
            'Saudi Arabia': '🇸🇦',
            'UAE': '🇦🇪',
            'Logistics & Shipping': '🚢',
            'Policy & Regulation': '📋',
            'Other News': '📰',
            'MENA': '🌍',
            'General': '📰'
        };

        // Render each section
        Object.entries(digest.sections).forEach(([sectionName, articles]) => {
            if (articles && articles.length > 0) {
                const sectionGroup = createSectionGroup(sectionName, articles, sectionEmojis[sectionName] || '📰');
                articlesSection.appendChild(sectionGroup);
            }
        });

        body.appendChild(articlesSection);
    } else if (digest.articles && Array.isArray(digest.articles)) {
        // Fallback: render articles as a single list
        const articlesSection = document.createElement('div');
        articlesSection.className = 'articles-section';
        const sectionGroup = createSectionGroup('Latest News', digest.articles, '📰');
        articlesSection.appendChild(sectionGroup);
        body.appendChild(articlesSection);
    }

    // Check if digest is empty
    if (!digest.tldr && (!digest.sections || Object.keys(digest.sections).length === 0) && (!digest.articles || digest.articles.length === 0)) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <h3>No digest available</h3>
            <p>Check back later for today's news summary.</p>
        `;
        body.appendChild(emptyState);
    }

    container.appendChild(header);
    container.appendChild(body);
}

// Create section group
function createSectionGroup(sectionName, articles, emoji) {
    const section = document.createElement('div');
    section.className = 'section-group';

    const header = document.createElement('h3');
    header.className = 'section-header';
    header.innerHTML = `${emoji} ${sectionName}`;

    const list = document.createElement('ul');
    list.className = 'article-list';

    articles.forEach(article => {
        const item = document.createElement('li');
        item.className = 'article-item';

        // Handle different article formats
        let title = article.title || article.text || article;
        let url = article.url || article.link || '#';

        // Extract URL from parentheses if it's in the text (e.g., "Title (http://...)")
        if (typeof title === 'string') {
            const urlMatch = title.match(/\(https?:\/\/[^\)]+\)/);
            if (urlMatch) {
                url = urlMatch[0].slice(1, -1); // Remove parentheses
                title = title.replace(urlMatch[0], '').trim();
            }
        }

        item.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`;
        list.appendChild(item);
    });

    section.appendChild(header);
    section.appendChild(list);

    return section;
}

// Load archive of past digests
async function loadArchive() {
    const containerEl = document.querySelector('.archive-grid');

    if (!containerEl) return;

    try {
        const response = await fetch('/digests?limit=30');

        if (!response.ok) {
            throw new Error('Failed to fetch archive');
        }

        const data = await response.json();
        const digests = data.digests || [];

        if (digests.length === 0) {
            containerEl.innerHTML = `
                <div class="empty-state">
                    <h3>No digests available yet</h3>
                    <p>Check back soon!</p>
                </div>
            `;
            return;
        }

        // Render digest cards
        digests.forEach(digest => {
            const card = createDigestCard(digest);
            containerEl.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading archive:', error);
        containerEl.innerHTML = `
            <div class="error">
                <p>Unable to load archive. Please try again later.</p>
            </div>
        `;
    }
}

// Create digest card for archive
function createDigestCard(digest) {
    const card = document.createElement('div');
    card.className = 'digest-card';

    const tldrPreview = digest.tldr ? digest.tldr.substring(0, 150) + '...' : 'Click to read full digest';

    card.innerHTML = `
        <h3>Daily Digest</h3>
        <p class="date">${formatDate(digest.date)}</p>
        <p class="preview">${tldrPreview}</p>
    `;

    card.addEventListener('click', () => {
        window.location.href = `/digest/${digest.id}`;
    });

    return card;
}

// Format date to readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

// Navigation helper
function navigateTo(path) {
    window.location.href = path;
}
