# Media Archives - Anime & Manga

A clean, modern web application that fetches and displays anime and manga data using the Jikan API.

## 📂 File Structure

```
activity_2_dom/
├── index.html          # Main HTML file (single page)
├── css/
│   └── unified-styles.css
├── js/
│   ├── anime-api.js    # Anime API calls
│   ├── manga-api.js    # Manga API calls
│   └── app.js          # Main app logic, search & filter
└── images/
```

**Total: 1 HTML file + 3 JavaScript files**

## 🎯 Features

### Data Fetching
- **Top 10 Anime** - Highest-rated anime from MyAnimeList
- **Top Weekly/Trending** - Currently airing anime
- **This Season's Anime** - Latest seasonal releases (auto-detects season)
- **Top 10 Manga** - Highest-rated manga from MyAnimeList

### Search & Filter
- Real-time search by title or description
- Filter by type (Anime/Manga)
- Filter by status (Ongoing/Completed/Upcoming)
- Sort by rating or title

### UI Features
- Statistics dashboard (total items, counts, average rating)
- Responsive card grid layout
- Modal detail view for each item
- Loading indicators
- Click cards to view full details

## 🚀 Quick Start

1. Open `index.html` in a modern browser
2. Wait 2-3 seconds for data to load from Jikan API
3. Browse through the 4 sections
4. Use search bar and filters to find specific content
5. Click any card to view detailed information

## 💻 JavaScript Files

### 1. anime-api.js
- Handles all anime-related API calls
- Fetches top anime, trending, and seasonal anime
- Transforms API data to consistent format
- Auto-detects current season

### 2. manga-api.js
- Handles all manga-related API calls
- Fetches top manga
- Transforms manga data

### 3. app.js
- Main application logic
- Search and filter functionality
- DOM manipulation and rendering
- Event handling
- Modal management
- Statistics calculation

## 🔗 API Endpoints

**Base URL:** `https://api.jikan.moe/v4`

1. `/top/anime?limit=10` - Top 10 Anime
2. `/seasons/now?limit=10` - Top Weekly/Trending
3. `/seasons/{year}/{season}?limit=10` - Seasonal Anime
4. `/top/manga?limit=10` - Top 10 Manga

**Rate Limit:** 3 requests/second, 60/minute (handled with 350ms delays)

## 🎨 Key Code Examples

### Fetch Top Anime
```javascript
const animeAPI = new AnimeAPI();
const topAnime = await animeAPI.fetchTopAnime(10);
```

### Apply Search Filter
```javascript
// Search automatically triggers when user types
searchInput.addEventListener('input', () => this.applyFilters());
```

### Display Modal
```javascript
// Click any card to open modal with full details
card.onclick = () => this.openModal(item);
```

## ⚙️ Technical Details

### Technologies
- **HTML5** - Semantic markup
- **CSS3** - Grid, Flexbox, modern styling
- **JavaScript (ES6+)** - Classes, Async/Await, Fetch API

### Browser Requirements
- Chrome 88+, Firefox 78+, Safari 14+, Edge 88+
- JavaScript enabled
- Internet connection required

### Performance
- Parallel API calls where possible
- Rate limiting to respect API limits
- Efficient rendering with minimal DOM manipulation
- Responsive design for all devices

## 📊 Data Flow

```
1. Page loads → Initialize App
2. Create AnimeAPI and MangaAPI instances
3. Fetch data with delays (rate limiting)
   - Top Anime → wait 350ms
   - Trending → wait 350ms
   - Seasonal → wait 350ms
   - Top Manga
4. Transform and deduplicate data
5. Render sections
6. Update statistics
7. Ready for user interaction
```

## 🎯 Clean Code Principles

- **Separation of Concerns:** Each JS file has a specific purpose
- **DRY:** Reusable functions and methods
- **Single Responsibility:** Each class handles one main task
- **Clean Naming:** Descriptive variable and function names
- **Error Handling:** Try-catch blocks for all API calls
- **Modern JavaScript:** ES6+ features (classes, async/await, arrow functions)

## 🐛 Troubleshooting

**Page is blank?**
- Open browser console (F12) for errors
- Verify internet connection
- Wait 2-3 seconds for loading

**Data not loading?**
- Jikan API might be temporarily down
- Check if API is online: https://api.jikan.moe/v4/anime/1
- Refresh the page

**Images not showing?**
- Some items may not have images
- Placeholder image will display

## 📝 Credits

- **API:** Jikan API v4 (Unofficial MyAnimeList API)
- **Data Source:** MyAnimeList
- **Icons:** Unicode Emoji

## 📄 License

Educational project. All anime/manga data belongs to respective copyright holders.

---

**Last Updated:** February 19, 2026  
**Status:** ✅ Complete and Clean  
**Files:** 1 HTML + 3 JavaScript (Clean & Organized)

