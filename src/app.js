document.addEventListener('DOMContentLoaded', () => {
    // ── Folder toggle ────────────────────────────────────────────────────────
    document.querySelectorAll('.folder-header').forEach((header) => {
        header.addEventListener('click', () => {
            header.closest('li.folder').classList.toggle('collapsed');
        });
    });

    // ── Copy URL to clipboard ────────────────────────────────────────────────
    document.querySelectorAll('.file-icon-wrapper').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const relUrl = btn.dataset.url;
            const absUrl = new URL(relUrl, window.location.href).href;

            const showCopied = () => {
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.classList.remove('copied');
                }, 1800);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(absUrl).then(showCopied).catch(() => {
                    fallbackCopy(absUrl, showCopied);
                });
            } else {
                fallbackCopy(absUrl, showCopied);
            }
        });
    });

    function fallbackCopy(text, callback) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            callback();
        } catch (_) {}
        document.body.removeChild(ta);
    }

    // ── Live search / filter ─────────────────────────────────────────────────
    const searchInput = document.getElementById('search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();

        if (!term) {
            // Restore everything
            document.querySelectorAll('.directory-list li').forEach((li) => {
                li.classList.remove('hidden');
            });
            return;
        }

        const fileItems = document.querySelectorAll('li.file-item');
        const foldersToShow = new Set();

        // Evaluate each file
        fileItems.forEach((item) => {
            const nameEl = item.querySelector('.file-name');
            const name = nameEl ? nameEl.textContent.toLowerCase() : '';

            if (name.includes(term)) {
                item.classList.remove('hidden');
                // Walk up to collect ancestor folders
                let node = item.parentElement && item.parentElement.closest('li.folder');
                while (node) {
                    foldersToShow.add(node);
                    node = node.parentElement && node.parentElement.closest('li.folder');
                }
            } else {
                item.classList.add('hidden');
            }
        });

        // Show/hide + expand folders
        document.querySelectorAll('li.folder').forEach((folder) => {
            if (foldersToShow.has(folder)) {
                folder.classList.remove('hidden', 'collapsed');
            } else {
                folder.classList.add('hidden');
            }
        });
    });
});
