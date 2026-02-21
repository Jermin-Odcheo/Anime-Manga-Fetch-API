// Pagination helper module (kept as a plain script, not an ES module)
// Exposes a small API on window.Pagination.
(function () {
    'use strict';

    /**
     * Returns an array of page numbers and ellipsis glyphs for compact pagination.
     * @param {number} current
     * @param {number} last
     * @returns {(number|'…')[]}
     */
    function getPageNumbers(current, last) {
        if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
        const pages = [];
        pages.push(1);
        if (current > 3) pages.push('…');
        for (let p = Math.max(2, current - 1); p <= Math.min(last - 1, current + 1); p++) {
            pages.push(p);
        }
        if (current < last - 2) pages.push('…');
        pages.push(last);
        return pages;
    }

    /**
     * Builds HTML string for pagination footer.
     * @param {number} currentPage
     * @param {number} lastPage
     */
    function buildPaginationHTML(currentPage, lastPage) {
        const pages = getPageNumbers(currentPage, lastPage);
        const prevDisabled = currentPage <= 1 ? 'disabled' : '';
        const nextDisabled = currentPage >= lastPage ? 'disabled' : '';

        const pageButtons = pages
            .map(p => {
                if (p === '…') return '<span class="page-ellipsis">…</span>';
                return `<button class="page-btn ${p === currentPage ? 'page-btn--active' : ''}" data-page="${p}">${p}</button>`;
            })
            .join('');

        return `
            <div class="pagination">
                <button class="page-btn page-btn--nav ${prevDisabled}" data-page="${currentPage - 1}" ${prevDisabled}>&#8249; Prev</button>
                <div class="pagination-pages">${pageButtons}</div>
                <button class="page-btn page-btn--nav ${nextDisabled}" data-page="${currentPage + 1}" ${nextDisabled}>Next &#8250;</button>
            </div>
            <p class="pagination-info">Page ${currentPage} of ${lastPage}</p>
        `;
    }

    /**
     * Binds one delegated click handler for pagination buttons inside containerEl.
     * @param {Element} containerEl
     * @param {{onPageChange:(page:number)=>void}} opts
     */
    function bindPagination(containerEl, opts) {
        if (!containerEl || !opts || typeof opts.onPageChange !== 'function') return;

        containerEl.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('.page-btn') : null;
            if (!btn || !containerEl.contains(btn)) return;
            if (btn.disabled) return;

            const p = parseInt(btn.dataset.page, 10);
            if (Number.isNaN(p)) return;
            opts.onPageChange(p);
        });
    }

    window.Pagination = {
        getPageNumbers,
        buildPaginationHTML,
        bindPagination
    };
})();

