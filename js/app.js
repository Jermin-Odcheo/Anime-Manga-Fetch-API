// MAIN APP - Search, Filter & Display
class App {
    constructor() {
        this.animeAPI = new AnimeAPI();
        this.mangaAPI = new MangaAPI();
        this.allItems = [];
        this.filteredItems = [];
        this.initElements();
        this.setupEvents();
        this.loadData();
    }
    initElements() {
        this.el = {
            searchInput: document.getElementById('searchInput'),
            filterToggleBtn: document.getElementById('filterToggleBtn'),
            filtersSection: document.getElementById('filtersSection'),
            typeFilter: document.getElementById('typeFilter'),
            statusFilter: document.getElementById('statusFilter'),
            genreFilter: document.getElementById('genreFilter'),
            yearMinFilter: document.getElementById('yearMinFilter'),
            yearMaxFilter: document.getElementById('yearMaxFilter'),
            ratingMinFilter: document.getElementById('ratingMinFilter'),
            sortFilter: document.getElementById('sortFilter'),
            applyFiltersBtn: document.getElementById('applyFiltersBtn'),
            clearFiltersBtn: document.getElementById('clearFiltersBtn'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            totalItems: document.getElementById('totalItems'),
            animeCount: document.getElementById('animeCount'),
            mangaCount: document.getElementById('mangaCount'),
            avgRating: document.getElementById('avgRating'),
            topAnimeSection: document.getElementById('topAnimeSection'),
            trendingSection: document.getElementById('trendingSection'),
            seasonalSection: document.getElementById('seasonalSection'),
            topMangaSection: document.getElementById('topMangaSection'),
            topAnimeGrid: document.getElementById('topAnimeGrid'),
            trendingGrid: document.getElementById('trendingGrid'),
            seasonalGrid: document.getElementById('seasonalGrid'),
            topMangaGrid: document.getElementById('topMangaGrid'),
            seasonTitle: document.getElementById('seasonTitle'),
            itemModal: document.getElementById('itemModal'),
            modalClose: document.getElementById('modalClose'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalImage: document.getElementById('modalImage'),
            modalTypeBadge: document.getElementById('modalTypeBadge'),
            modalTitle: document.getElementById('modalTitle'),
            modalYear: document.getElementById('modalYear'),
            modalStatus: document.getElementById('modalStatus'),
            modalRating: document.getElementById('modalRating'),
            modalGenres: document.getElementById('modalGenres'),
            modalDescription: document.getElementById('modalDescription'),
            modalLink: document.getElementById('modalLink')
        };
    }
    setupEvents() {
        this.el.filterToggleBtn.addEventListener('click', () => this.toggleFilters());
        this.el.searchInput.addEventListener('input', () => this.applyFilters());
        this.el.typeFilter.addEventListener('change', () => this.applyFilters());
        this.el.statusFilter.addEventListener('change', () => this.applyFilters());
        this.el.genreFilter.addEventListener('change', () => this.applyFilters());
        this.el.yearMinFilter.addEventListener('input', () => this.applyFilters());
        this.el.yearMaxFilter.addEventListener('input', () => this.applyFilters());
        this.el.ratingMinFilter.addEventListener('change', () => this.applyFilters());
        this.el.sortFilter.addEventListener('change', () => this.applyFilters());
        this.el.applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        this.el.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        this.el.modalClose.addEventListener('click', () => this.closeModal());
        this.el.modalOverlay.addEventListener('click', () => this.closeModal());
    }
    toggleFilters() {
        const isVisible = this.el.filtersSection.style.display !== 'none';
        this.el.filtersSection.style.display = isVisible ? 'none' : 'block';
    }
    async loadData() {
        try {
            this.topAnimeData = await this.animeAPI.fetchTopAnime(10);
            await this.delay(350);
            this.trendingData = await this.animeAPI.fetchTrendingAnime(10);
            await this.delay(350);
            const seasonalResult = await this.animeAPI.fetchSeasonalAnime(10);
            this.seasonalData = seasonalResult.data;
            this.el.seasonTitle.textContent = `${seasonalResult.season.charAt(0).toUpperCase() + seasonalResult.season.slice(1)} ${seasonalResult.year} Anime`;
            await this.delay(350);
            this.topMangaData = await this.mangaAPI.fetchTopManga(10);
            this.allItems = [...this.topAnimeData, ...this.trendingData, ...this.seasonalData, ...this.topMangaData];
            this.allItems = this.removeDuplicates(this.allItems);
            this.filteredItems = [...this.allItems];
            this.render();
            this.updateStats();
            this.showSections();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            this.el.loadingIndicator.style.display = 'none';
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = `${item.type}-${item.malId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    applyFilters() {
        const search = this.el.searchInput.value.toLowerCase().trim();
        const type = this.el.typeFilter.value;
        const status = this.el.statusFilter.value;
        const genre = this.el.genreFilter.value;
        const yearMin = parseInt(this.el.yearMinFilter.value) || 0;
        const yearMax = parseInt(this.el.yearMaxFilter.value) || 9999;
        const ratingMin = parseFloat(this.el.ratingMinFilter.value) || 0;

        this.filteredItems = this.allItems.filter(item => {
            // Search filter (title, description, genres)
            if (search) {
                const matchesTitle = item.title.toLowerCase().includes(search);
                const matchesDescription = item.description.toLowerCase().includes(search);
                const matchesGenre = item.genres.some(g => g.toLowerCase().includes(search));
                if (!matchesTitle && !matchesDescription && !matchesGenre) return false;
            }

            // Type filter
            if (type !== 'all' && item.type !== type) return false;

            // Status filter
            if (status !== 'all' && item.status !== status) return false;

            // Genre filter
            if (genre !== 'all' && !item.genres.includes(genre)) return false;

            // Year range filter
            if (item.year < yearMin || item.year > yearMax) return false;

            // Rating filter
            if (item.rating < ratingMin) return false;

            return true;
        });

        this.sortItems();
        this.updateSectionVisibility();
        this.updateFilterStats();
    }
    sortItems() {
        const sort = this.el.sortFilter.value;
        if (sort === 'rating-desc') this.filteredItems.sort((a, b) => b.rating - a.rating);
        else if (sort === 'rating-asc') this.filteredItems.sort((a, b) => a.rating - b.rating);
        else if (sort === 'title-asc') this.filteredItems.sort((a, b) => a.title.localeCompare(b.title));
        else if (sort === 'title-desc') this.filteredItems.sort((a, b) => b.title.localeCompare(a.title));
        else if (sort === 'year-desc') this.filteredItems.sort((a, b) => b.year - a.year);
        else if (sort === 'year-asc') this.filteredItems.sort((a, b) => a.year - b.year);
    }
    updateSectionVisibility() {
        const hasFilters = this.el.searchInput.value.trim() ||
                          this.el.typeFilter.value !== 'all' ||
                          this.el.statusFilter.value !== 'all' ||
                          this.el.genreFilter.value !== 'all' ||
                          this.el.yearMinFilter.value ||
                          this.el.yearMaxFilter.value ||
                          this.el.ratingMinFilter.value !== '0';

        if (hasFilters) {
            this.el.topAnimeSection.style.display = 'none';
            this.el.trendingSection.style.display = 'none';
            this.el.seasonalSection.style.display = 'none';
            this.el.topMangaSection.style.display = 'none';
            this.renderFilteredResults();
        } else {
            // Remove any existing search results section
            const existingSearchSection = document.querySelector('.search-results-section');
            if (existingSearchSection) existingSearchSection.remove();

            this.render();
            this.showSections();
        }
    }
    renderFilteredResults() {
        // Remove existing search section if any
        const existingSearchSection = document.querySelector('.search-results-section');
        if (existingSearchSection) existingSearchSection.remove();

        // Create new search results section
        const section = document.createElement('section');
        section.className = 'search-results-section';
        section.innerHTML = `
            <div class="section-header">
                <h2>Search Results</h2>
                <p class="section-description">Found ${this.filteredItems.length} items matching your filters</p>
            </div>
            <div id="searchGrid" class="results-grid"></div>
        `;

        this.el.topAnimeSection.parentElement.insertBefore(section, this.el.topAnimeSection);

        const grid = document.getElementById('searchGrid');
        if (this.filteredItems.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-light);">
                    <h3 style="margin-bottom: 0.5rem;">No results found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
        } else {
            this.filteredItems.forEach(item => grid.appendChild(this.createCard(item)));
        }
    }
    render() {
        this.el.topAnimeGrid.innerHTML = '';
        this.el.trendingGrid.innerHTML = '';
        this.el.seasonalGrid.innerHTML = '';
        this.el.topMangaGrid.innerHTML = '';
        this.topAnimeData.forEach(item => this.el.topAnimeGrid.appendChild(this.createCard(item)));
        this.trendingData.forEach(item => this.el.trendingGrid.appendChild(this.createCard(item)));
        this.seasonalData.forEach(item => this.el.seasonalGrid.appendChild(this.createCard(item)));
        this.topMangaData.forEach(item => this.el.topMangaGrid.appendChild(this.createCard(item)));
    }
    createCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.onclick = () => this.openModal(item);
        card.innerHTML = `
            <div class="item-card-image-wrapper">
                <img src="${item.image}" alt="${item.title}" class="item-card-image" onerror="this.src='https://via.placeholder.com/220x308'">
                <span class="type-badge ${item.type}">${item.type.toUpperCase()}</span>
            </div>
            <div class="item-card-content">
                <h3 class="item-card-title">${item.title}</h3>
                <div class="item-card-meta">
                    <span>${item.year || 'N/A'}</span>
                    <span>${item.status}</span>
                </div>
                <div class="item-card-genres">
                    ${item.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
                <div class="item-card-rating">
                    <span class="rating-stars">${this.generateStars(item.rating)}</span>
                    <span class="rating-number">${item.rating.toFixed(1)}</span>
                </div>
            </div>
        `;
        return card;
    }
    generateStars(rating) {
        const fullStars = Math.floor(rating / 2);
        return '★'.repeat(fullStars) || '★';
    }
    openModal(item) {
        this.el.modalImage.src = item.image;
        this.el.modalTypeBadge.textContent = item.type.toUpperCase();
        this.el.modalTypeBadge.className = `type-badge ${item.type}`;
        this.el.modalTitle.textContent = item.title;
        this.el.modalYear.textContent = `${item.year || 'N/A'}`;
        this.el.modalStatus.textContent = `${item.status}`;
        this.el.modalRating.textContent = `${item.rating.toFixed(1)} / 10`;
        this.el.modalGenres.innerHTML = item.genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
        this.el.modalDescription.textContent = item.description;
        this.el.modalLink.href = item.link;
        this.el.itemModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    closeModal() {
        this.el.itemModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    updateStats() {
        const anime = this.allItems.filter(i => i.type === 'anime').length;
        const manga = this.allItems.filter(i => i.type === 'manga').length;
        const avgRating = (this.allItems.reduce((sum, i) => sum + i.rating, 0) / this.allItems.length).toFixed(1);
        this.el.totalItems.textContent = this.allItems.length;
        this.el.animeCount.textContent = anime;
        this.el.mangaCount.textContent = manga;
        this.el.avgRating.textContent = avgRating;
    }
    showSections() {
        this.el.topAnimeSection.style.display = 'block';
        this.el.trendingSection.style.display = 'block';
        this.el.seasonalSection.style.display = 'block';
        this.el.topMangaSection.style.display = 'block';
    }
    clearAllFilters() {
        this.el.searchInput.value = '';
        this.el.typeFilter.value = 'all';
        this.el.statusFilter.value = 'all';
        this.el.genreFilter.value = 'all';
        this.el.yearMinFilter.value = '';
        this.el.yearMaxFilter.value = '';
        this.el.ratingMinFilter.value = '0';
        this.el.sortFilter.value = 'rating-desc';
        this.applyFilters();
    }
    updateFilterStats() {
        // Update stats to show filtered count if filters are active
        const hasFilters = this.el.searchInput.value.trim() ||
                          this.el.typeFilter.value !== 'all' ||
                          this.el.statusFilter.value !== 'all' ||
                          this.el.genreFilter.value !== 'all' ||
                          this.el.yearMinFilter.value ||
                          this.el.yearMaxFilter.value ||
                          this.el.ratingMinFilter.value !== '0';

        if (hasFilters && this.filteredItems.length > 0) {
            const anime = this.filteredItems.filter(i => i.type === 'anime').length;
            const manga = this.filteredItems.filter(i => i.type === 'manga').length;
            const avgRating = (this.filteredItems.reduce((sum, i) => sum + i.rating, 0) / this.filteredItems.length).toFixed(1);

            this.el.totalItems.textContent = this.filteredItems.length;
            this.el.animeCount.textContent = anime;
            this.el.mangaCount.textContent = manga;
            this.el.avgRating.textContent = avgRating;
        } else {
            this.updateStats();
        }
    }
}
document.addEventListener('DOMContentLoaded', () => new App());
