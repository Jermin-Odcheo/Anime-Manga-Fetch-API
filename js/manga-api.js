// MANGA API - Fetch Manga Data
class MangaAPI {
    constructor() {
        this.baseURL = 'https://api.jikan.moe/v4';
    }

    /**
     * Search manga with full filter support and pagination.
     * @param {string} query  - search term (can be empty for filter-only)
     * @param {object} filters - { status, genre, yearMin, yearMax, ratingMin, sort }
     * @param {number} page   - 1-based page number
     * @param {number} limit  - results per page
     * @returns {{ items, total, currentPage, lastPage }}
     */
    async searchManga(query = '', filters = {}, page = 1, limit = 25) {
        try {
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            params.set('limit', limit);
            params.set('page', page);

            // Map status filter to Jikan values
            if (filters.status && filters.status !== 'all') {
                const statusMap = { ongoing: 'publishing', completed: 'complete', upcoming: 'upcoming' };
                params.set('status', statusMap[filters.status] || filters.status);
            }

            // Genre filter
            if (filters.genre && filters.genre !== 'all') {
                const genreId = this.getGenreId(filters.genre);
                if (genreId) params.set('genres', genreId);
            }

            // Year range
            if (filters.yearMin) params.set('start_date', `${filters.yearMin}-01-01`);
            if (filters.yearMax) params.set('end_date', `${filters.yearMax}-12-31`);

            // Min score
            if (filters.ratingMin && filters.ratingMin !== '0') {
                params.set('min_score', filters.ratingMin);
            }

            // Sort
            const { orderBy, sort } = this.mapSort(filters.sort);
            params.set('order_by', orderBy);
            params.set('sort', sort);

            const response = await fetch(`${this.baseURL}/manga?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to search manga');
            const data = await response.json();

            return {
                items: data.data.map(m => this.transformMangaData(m)),
                total: data.pagination?.items?.total ?? data.data.length,
                currentPage: data.pagination?.current_page ?? page,
                lastPage: data.pagination?.last_visible_page ?? 1
            };
        } catch (error) {
            console.error('MangaAPI.searchManga error:', error);
            return { items: [], total: 0, currentPage: page, lastPage: 1 };
        }
    }

    mapSort(sort) {
        switch (sort) {
            case 'rating-asc':  return { orderBy: 'score',   sort: 'asc'  };
            case 'title-asc':   return { orderBy: 'title',   sort: 'asc'  };
            case 'title-desc':  return { orderBy: 'title',   sort: 'desc' };
            case 'year-desc':   return { orderBy: 'start_date', sort: 'desc' };
            case 'year-asc':    return { orderBy: 'start_date', sort: 'asc'  };
            default:            return { orderBy: 'score',   sort: 'desc' };
        }
    }

    getGenreId(genre) {
        const map = {
            'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8,
            'Fantasy': 10, 'Horror': 14, 'Mystery': 7, 'Romance': 22,
            'Sci-Fi': 24, 'Slice of Life': 36, 'Sports': 30,
            'Supernatural': 37, 'Thriller': 41, 'Psychological': 40, 'Mecha': 18
        };
        return map[genre] || null;
    }

    async fetchTopManga(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/top/manga?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch top manga');
            const data = await response.json();
            return data.data.map(manga => this.transformMangaData(manga));
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }

    transformMangaData(manga) {
        return {
            id: `manga-${manga.mal_id}`,
            malId: manga.mal_id,
            title: manga.title || 'Unknown',
            type: 'manga',
            genres: manga.genres ? manga.genres.map(g => g.name) : [],
            status: this.normalizeStatus(manga.status),
            rating: manga.score || 0,
            year: manga.published?.from ? new Date(manga.published.from).getFullYear() : 0,
            image: manga.images?.jpg?.large_image_url || '',
            description: manga.synopsis || 'No description available.',
            link: manga.url
        };
    }

    normalizeStatus(status) {
        if (!status) return 'Unknown';
        const s = status.toLowerCase();
        if (s.includes('publishing')) return 'ongoing';
        if (s.includes('finished')) return 'completed';
        if (s.includes('upcoming')) return 'upcoming';
        return 'ongoing';
    }
}
window.MangaAPI = MangaAPI;
