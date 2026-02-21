// MAIN APP - Search, Filter, Pagination & Display
class App {
    constructor() {
        this.animeAPI = new AnimeAPI();
        this.mangaAPI = new MangaAPI();
        // Pre-loaded default data
        this.allItems     = [];
        this.topAnimeData = [];
        this.trendingData = [];
        this.seasonalData = [];
        this.topMangaData = [];
        // Search / pagination state
        this.currentPage   = 1;
        this.LIMIT         = 25; // Jikan hard max per request
        this.PAGE_SIZE     = 50; // Displayed results per page (2 x API requests)
        this.totalAnime    = 0;
        this.totalManga    = 0;
        this.lastPageAnime = 1;
        this.lastPageManga = 1;
        this.searchTimeout = null;
        this.initElements();
        this.setupEvents();
        this.showSkeletonSections();
        this.loadData();
    }
    initElements() {
        this.el = {
            searchInput:      document.getElementById('searchInput'),
            filterToggleBtn:  document.getElementById('filterToggleBtn'),
            filtersSection:   document.getElementById('filtersSection'),
            typeFilter:       document.getElementById('typeFilter'),
            statusFilter:     document.getElementById('statusFilter'),
            genreFilter:      document.getElementById('genreFilter'),
            yearMinFilter:    document.getElementById('yearMinFilter'),
            yearMaxFilter:    document.getElementById('yearMaxFilter'),
            ratingMinFilter:  document.getElementById('ratingMinFilter'),
            sortFilter:       document.getElementById('sortFilter'),
            applyFiltersBtn:  document.getElementById('applyFiltersBtn'),
            clearFiltersBtn:  document.getElementById('clearFiltersBtn'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            totalItems:       document.getElementById('totalItems'),
            totalItemsLabel:  document.querySelector('#totalItems + p'),
            animeCount:       document.getElementById('animeCount'),
            animeCountLabel:  document.querySelector('#animeCount + p'),
            mangaCount:       document.getElementById('mangaCount'),
            mangaCountLabel:  document.querySelector('#mangaCount + p'),
            avgRating:        document.getElementById('avgRating'),
            topAnimeSection:  document.getElementById('topAnimeSection'),
            trendingSection:  document.getElementById('trendingSection'),
            seasonalSection:  document.getElementById('seasonalSection'),
            topMangaSection:  document.getElementById('topMangaSection'),
            topAnimeGrid:     document.getElementById('topAnimeGrid'),
            trendingGrid:     document.getElementById('trendingGrid'),
            seasonalGrid:     document.getElementById('seasonalGrid'),
            topMangaGrid:     document.getElementById('topMangaGrid'),
            seasonTitle:      document.getElementById('seasonTitle'),
            itemModal:        document.getElementById('itemModal'),
            modalClose:       document.getElementById('modalClose'),
            modalOverlay:     document.getElementById('modalOverlay'),
            modalImage:       document.getElementById('modalImage'),
            modalTypeBadge:   document.getElementById('modalTypeBadge'),
            modalTitle:       document.getElementById('modalTitle'),
            modalYear:        document.getElementById('modalYear'),
            modalStatus:      document.getElementById('modalStatus'),
            modalRating:      document.getElementById('modalRating'),
            modalGenres:      document.getElementById('modalGenres'),
            modalDescription: document.getElementById('modalDescription'),
            modalLink:        document.getElementById('modalLink')
        };
    }
    setupEvents() {
        this.el.filterToggleBtn.addEventListener('click', () => this.toggleFilters());
        this.el.searchInput.addEventListener('input', () => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.handleSearchOrFilter();
            }, 500);
        });
        [
            this.el.typeFilter,
            this.el.statusFilter,
            this.el.genreFilter,
            this.el.ratingMinFilter,
            this.el.sortFilter
        ].forEach(el => el.addEventListener('change', () => {
            this.currentPage = 1;
            this.handleSearchOrFilter();
        }));
        [this.el.yearMinFilter, this.el.yearMaxFilter].forEach(el =>
            el.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.currentPage = 1;
                    this.handleSearchOrFilter();
                }, 500);
            })
        );
        this.el.applyFiltersBtn.addEventListener('click', () => {
            this.currentPage = 1;
            this.handleSearchOrFilter();
        });
        this.el.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        this.el.modalClose.addEventListener('click',   () => this.closeModal());
        this.el.modalOverlay.addEventListener('click', () => this.closeModal());
    }
    toggleFilters() {
        const visible = this.el.filtersSection.style.display !== 'none';
        this.el.filtersSection.style.display = visible ? 'none' : 'block';
    }
    async loadData() {
        try {
            this.topAnimeData = await this.animeAPI.fetchTopAnime(10);
            await this.delay(350);
            this.trendingData = await this.animeAPI.fetchTrendingAnime(10);
            await this.delay(350);
            const seasonalResult = await this.animeAPI.fetchSeasonalAnime(10);
            this.seasonalData = seasonalResult.data;
            this.el.seasonTitle.textContent =
                `${seasonalResult.season.charAt(0).toUpperCase() + seasonalResult.season.slice(1)} ${seasonalResult.year} Anime`;
            await this.delay(350);
            this.topMangaData = await this.mangaAPI.fetchTopManga(10);
            this.allItems = this.removeDuplicates([
                ...this.topAnimeData, ...this.trendingData,
                ...this.seasonalData, ...this.topMangaData
            ]);
            this.render();
            this.updateStats();
            this.showSections();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            this.el.loadingIndicator.style.display = 'none';
        }
    }
    delay(ms) { return new Promise(r => setTimeout(r, ms)); }
    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = `${item.type}-${item.malId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    hasActiveFilters() {
        return !!(
            this.el.searchInput.value.trim()       ||
            this.el.typeFilter.value    !== 'all'  ||
            this.el.statusFilter.value  !== 'all'  ||
            this.el.genreFilter.value   !== 'all'  ||
            this.el.yearMinFilter.value            ||
            this.el.yearMaxFilter.value            ||
            this.el.ratingMinFilter.value !== '0'
        );
    }
    getFilters() {
        return {
            status:    this.el.statusFilter.value,
            genre:     this.el.genreFilter.value,
            yearMin:   this.el.yearMinFilter.value,
            yearMax:   this.el.yearMaxFilter.value,
            ratingMin: this.el.ratingMinFilter.value,
            sort:      this.el.sortFilter.value
        };
    }
    async handleSearchOrFilter() {
        if (!this.hasActiveFilters()) {
            this.showDefaultView();
            return;
        }
        const query      = this.el.searchInput.value.trim();
        const typeFilter = this.el.typeFilter.value;
        const filters    = this.getFilters();
        this.hideSections();
        this.removeSearchSection();
        this.insertLoadingSkeleton();
        // Jikan limit = 25 max. Fetch 2 pages per app-page to deliver 50 results.
        // App page 1 -> Jikan pages 1+2, App page 2 -> Jikan pages 3+4, etc.
        const apiPage1 = (this.currentPage - 1) * 2 + 1;
        const apiPage2 = apiPage1 + 1;
        let animeItems = [], mangaItems = [];
        let animeTotal = 0, mangaTotal = 0;
        let animeLastPage = 1, mangaLastPage = 1;
        if (typeFilter === 'all' || typeFilter === 'anime') {
            const r1 = await this.animeAPI.searchAnime(query, filters, apiPage1, this.LIMIT);
            animeItems.push(...r1.items);
            animeTotal    = r1.total;
            animeLastPage = r1.lastPage;
            if (apiPage2 <= r1.lastPage) {
                await this.delay(350);
                const r2 = await this.animeAPI.searchAnime(query, filters, apiPage2, this.LIMIT);
                animeItems.push(...r2.items);
            }
        }
        if (typeFilter === 'all' || typeFilter === 'manga') {
            await this.delay(350);
            const r1 = await this.mangaAPI.searchManga(query, filters, apiPage1, this.LIMIT);
            mangaItems.push(...r1.items);
            mangaTotal    = r1.total;
            mangaLastPage = r1.lastPage;
            if (apiPage2 <= r1.lastPage) {
                await this.delay(350);
                const r2 = await this.mangaAPI.searchManga(query, filters, apiPage2, this.LIMIT);
                mangaItems.push(...r2.items);
            }
        }
        let items = this.removeDuplicates([...animeItems, ...mangaItems]);
        this.sortItemsArray(items);
        this.totalAnime    = animeTotal;
        this.totalManga    = mangaTotal;
        this.lastPageAnime = animeLastPage;
        this.lastPageManga = mangaLastPage;
        const combinedLastPage = Math.ceil(Math.max(animeLastPage, mangaLastPage) / 2);
        const grandTotal = typeFilter === 'all'
            ? animeTotal + mangaTotal
            : typeFilter === 'anime' ? animeTotal : mangaTotal;
        this.removeSearchSection();
        this.renderSearchResults(items, grandTotal, this.currentPage, combinedLastPage);
        this.updateSearchStats(items, grandTotal);
    }
    insertLoadingSkeleton() {
        const section = document.createElement('section');
        section.className = 'search-results-section';
        section.innerHTML = `
            <div class="section-header">
                <h2>Search Results</h2>
                <p class="section-description">Searching the Jikan API…</p>
            </div>
            <div id="searchSkeletonGrid" class="results-grid"></div>`;
        this.el.topAnimeSection.parentElement.insertBefore(section, this.el.topAnimeSection);
        const grid = document.getElementById('searchSkeletonGrid');
        for (let i = 0; i < 10; i++) grid.appendChild(this.createSkeletonCard());
    }
    renderSearchResults(items, grandTotal, currentPage, lastPage) {
        const section = document.createElement('section');
        section.className = 'search-results-section';
        const start = (currentPage - 1) * this.PAGE_SIZE + 1;
        const end   = grandTotal === 0 ? 0 : Math.min(start + items.length - 1, grandTotal);
        const desc = grandTotal === 0
            ? 'Found 0 items matching your filters'
            : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${grandTotal.toLocaleString()} results`;
        section.innerHTML = `
            <div class="section-header">
                <h2>Search Results</h2>
                <p class="section-description">${desc}</p>
            </div>
            <div id="searchGrid" class="results-grid"></div>
            ${lastPage > 1 ? window.Pagination.buildPaginationHTML(currentPage, lastPage) : ''}
        `;
        this.el.topAnimeSection.parentElement.insertBefore(section, this.el.topAnimeSection);
        const grid = document.getElementById('searchGrid');
        if (items.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light);">
                    <h3 style="margin-bottom:0.5rem;">No results found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>`;
        } else {
            items.forEach(item => grid.appendChild(this.createCard(item)));
        }

        window.Pagination.bindPagination(section, {
            onPageChange: (p) => {
                if (!Number.isNaN(p) && p !== this.currentPage) {
                    this.currentPage = p;
                    this.handleSearchOrFilter();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        });
    }
    removeSearchSection() {
        document.querySelectorAll('.search-results-section').forEach(el => el.remove());
    }
    hideSections() {
        this.el.topAnimeSection.style.display = 'none';
        this.el.trendingSection.style.display = 'none';
        this.el.seasonalSection.style.display = 'none';
        this.el.topMangaSection.style.display = 'none';
    }
    showDefaultView() {
        this.removeSearchSection();
        this.render();
        this.showSections();
        this.updateStats();
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
    createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-content">
                <div class="skeleton-line full"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
            </div>`;
        return card;
    }
    showSkeletonSections() {
        [
            this.el.topAnimeGrid,
            this.el.trendingGrid,
            this.el.seasonalGrid,
            this.el.topMangaGrid
        ].forEach(grid => {
            grid.innerHTML = '';
            for (let i = 0; i < 10; i++) grid.appendChild(this.createSkeletonCard());
        });
    }
    sortItemsArray(items) {
        const sort = this.el.sortFilter.value;
        if      (sort === 'rating-desc') items.sort((a, b) => b.rating - a.rating);
        else if (sort === 'rating-asc')  items.sort((a, b) => a.rating - b.rating);
        else if (sort === 'title-asc')   items.sort((a, b) => a.title.localeCompare(b.title));
        else if (sort === 'title-desc')  items.sort((a, b) => b.title.localeCompare(a.title));
        else if (sort === 'year-desc')   items.sort((a, b) => b.year - a.year);
        else if (sort === 'year-asc')    items.sort((a, b) => a.year - b.year);
    }
    createCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.onclick = () => this.openModal(item);
        card.innerHTML = `
            <div class="item-card-image-wrapper">
                <img src="${item.image}" alt="${item.title}" class="item-card-image"
                     onerror="this.src='https://via.placeholder.com/220x308'">
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
            </div>`;
        return card;
    }
    generateStars(rating) {
        const full = Math.floor(rating / 2);
        return '★'.repeat(full) || '★';
    }
    openModal(item) {
        this.el.modalImage.src               = item.image;
        this.el.modalTypeBadge.textContent   = item.type.toUpperCase();
        this.el.modalTypeBadge.className     = `type-badge ${item.type}`;
        this.el.modalTitle.textContent       = item.title;
        this.el.modalYear.textContent        = item.year || 'N/A';
        this.el.modalStatus.textContent      = item.status;
        this.el.modalRating.textContent      = `${item.rating.toFixed(1)} / 10`;
        this.el.modalGenres.innerHTML        = item.genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
        this.el.modalDescription.textContent = item.description;
        this.el.modalLink.href               = item.link;
        this.el.itemModal.style.display      = 'flex';
        document.body.style.overflow         = 'hidden';
    }
    closeModal() {
        this.el.itemModal.style.display = 'none';
        document.body.style.overflow    = 'auto';
    }
    updateStats() {
        const anime     = this.allItems.filter(i => i.type === 'anime').length;
        const manga     = this.allItems.filter(i => i.type === 'manga').length;
        const avgRating = this.allItems.length
            ? (this.allItems.reduce((s, i) => s + i.rating, 0) / this.allItems.length).toFixed(1)
            : '0.0';
        this.el.totalItems.textContent = this.allItems.length;
        this.el.animeCount.textContent = anime;
        this.el.mangaCount.textContent = manga;
        this.el.avgRating.textContent  = avgRating;
        if (this.el.totalItemsLabel) this.el.totalItemsLabel.textContent = 'Total Items Loaded';
        if (this.el.animeCountLabel) this.el.animeCountLabel.textContent = 'Anime Titles';
        if (this.el.mangaCountLabel) this.el.mangaCountLabel.textContent = 'Manga Titles';
        // Remove shimmer from stat cards once data is ready
        document.querySelectorAll('.stat-card.skeleton-card').forEach(c => c.classList.remove('skeleton-card'));
    }
    updateSearchStats(pageItems, grandTotal) {
        const type = this.el.typeFilter.value;
        this.el.totalItems.textContent = grandTotal.toLocaleString();
        this.el.animeCount.textContent = type === 'manga' ? 0 : this.totalAnime.toLocaleString();
        this.el.mangaCount.textContent = type === 'anime' ? 0 : this.totalManga.toLocaleString();
        const avgRating = pageItems.length
            ? (pageItems.reduce((s, i) => s + i.rating, 0) / pageItems.length).toFixed(1)
            : '0.0';
        this.el.avgRating.textContent = avgRating;
        if (this.el.totalItemsLabel) this.el.totalItemsLabel.textContent = 'Total Results Found';
        if (this.el.animeCountLabel) this.el.animeCountLabel.textContent = 'Anime Results';
        if (this.el.mangaCountLabel) this.el.mangaCountLabel.textContent = 'Manga Results';
    }
    showSections() {
        this.el.topAnimeSection.style.display = 'block';
        this.el.trendingSection.style.display = 'block';
        this.el.seasonalSection.style.display = 'block';
        this.el.topMangaSection.style.display = 'block';
    }
    clearAllFilters() {
        this.el.searchInput.value     = '';
        this.el.typeFilter.value      = 'all';
        this.el.statusFilter.value    = 'all';
        this.el.genreFilter.value     = 'all';
        this.el.yearMinFilter.value   = '';
        this.el.yearMaxFilter.value   = '';
        this.el.ratingMinFilter.value = '0';
        this.el.sortFilter.value      = 'rating-desc';
        this.currentPage = 1;
        this.showDefaultView();
    }
}
document.addEventListener('DOMContentLoaded', () => new App());
