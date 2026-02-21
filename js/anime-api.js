// ANIME API - Fetch Anime Data
class AnimeAPI {
    constructor() {
        this.baseURL = 'https://api.jikan.moe/v4';
    }

    /**
     * Search anime with full filter support and pagination.
     * @param {string} query  - search term (can be empty for filter-only)
     * @param {object} filters - { status, genre, yearMin, yearMax, ratingMin, sort }
     * @param {number} page   - 1-based page number
     * @param {number} limit  - results per page (max 25 per Jikan; we fetch 2 pages when limit=50)
     * @returns {{ items, total, currentPage, lastPage }}
     */
    async searchAnime(query = '', filters = {}, page = 1, limit = 25) {
        try {
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            params.set('limit', limit);
            params.set('page', page);

            // Map status filter to Jikan values
            if (filters.status && filters.status !== 'all') {
                const statusMap = { ongoing: 'airing', completed: 'complete', upcoming: 'upcoming' };
                params.set('status', statusMap[filters.status] || filters.status);
            }

            // Genre filter — Jikan uses numeric genre IDs; map common genres
            if (filters.genre && filters.genre !== 'all') {
                const genreId = this.getGenreId(filters.genre);
                if (genreId) params.set('genres', genreId);
            }

            // Year range via start_date / end_date
            if (filters.yearMin) params.set('start_date', `${filters.yearMin}-01-01`);
            if (filters.yearMax) params.set('end_date', `${filters.yearMax}-12-31`);

            // Min score
            if (filters.ratingMin && filters.ratingMin !== '0') {
                params.set('min_score', filters.ratingMin);
            }

            // Sort — Jikan supports order_by + sort
            const { orderBy, sort } = this.mapSort(filters.sort);
            params.set('order_by', orderBy);
            params.set('sort', sort);

            const response = await fetch(`${this.baseURL}/anime?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to search anime');
            const data = await response.json();

            return {
                items: data.data.map(a => this.transformAnimeData(a)),
                total: data.pagination?.items?.total ?? data.data.length,
                currentPage: data.pagination?.current_page ?? page,
                lastPage: data.pagination?.last_visible_page ?? 1
            };
        } catch (error) {
            console.error('AnimeAPI.searchAnime error:', error);
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

    async fetchTopAnime(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/top/anime?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch top anime');
            const data = await response.json();
            return data.data.map(anime => this.transformAnimeData(anime));
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }

    async fetchTrendingAnime(limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/seasons/now?limit=${limit}`);
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            return data.data.map(anime => this.transformAnimeData(anime));
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }

    async fetchSeasonalAnime(limit = 10) {
        try {
            const { year, season } = this.getCurrentSeason();
            const response = await fetch(`${this.baseURL}/seasons/${year}/${season}?limit=${limit}`);
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            return { data: data.data.map(anime => this.transformAnimeData(anime)), season, year };
        } catch (error) {
            console.error('Error:', error);
            return { data: [], season: 'Unknown', year: 0 };
        }
    }

    getCurrentSeason() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        let season = 'winter';
        if (month >= 4 && month <= 6) season = 'spring';
        else if (month >= 7 && month <= 9) season = 'summer';
        else if (month >= 10 && month <= 12) season = 'fall';
        return { year, season };
    }

    transformAnimeData(anime) {
        return {
            id: `anime-${anime.mal_id}`,
            malId: anime.mal_id,
            title: anime.title || 'Unknown',
            type: 'anime',
            genres: anime.genres ? anime.genres.map(g => g.name) : [],
            status: this.normalizeStatus(anime.status),
            rating: anime.score || 0,
            year: anime.year || (anime.aired?.from ? new Date(anime.aired.from).getFullYear() : 0),
            image: anime.images?.jpg?.large_image_url || '',
            description: anime.synopsis || 'No description available.',
            link: anime.url
        };
    }

    normalizeStatus(status) {
        if (!status) return 'Unknown';
        const s = status.toLowerCase();
        if (s.includes('airing')) return 'ongoing';
        if (s.includes('finished')) return 'completed';
        if (s.includes('upcoming')) return 'upcoming';
        return 'ongoing';
    }
}
window.AnimeAPI = AnimeAPI;
