// ANIME API - Fetch Anime Data
class AnimeAPI {
    constructor() {
        this.baseURL = 'https://api.jikan.moe/v4';
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
