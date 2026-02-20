// MANGA API - Fetch Manga Data
class MangaAPI {
    constructor() {
        this.baseURL = 'https://api.jikan.moe/v4';
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
