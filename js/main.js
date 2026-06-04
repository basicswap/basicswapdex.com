// Burger menus
document.addEventListener('DOMContentLoaded', function() {
    // open
    const burger = document.querySelectorAll('.navbar-burger');
    const menu = document.querySelectorAll('.navbar-menu');

    if (burger.length && menu.length) {
        for (var i = 0; i < burger.length; i++) {
            burger[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                }
            });
        }
    }

    // close
    const close = document.querySelectorAll('.navbar-close');
    const backdrop = document.querySelectorAll('.navbar-backdrop');

    if (close.length) {
        for (var i = 0; i < close.length; i++) {
            close[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                }
            });
        }
    }

    if (backdrop.length) {
        for (var i = 0; i < backdrop.length; i++) {
            backdrop[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                }
            });
        }
    }

    // Fetch latest BasicSwap release tag from GitHub and update the download button.
    // Cached in localStorage for 1 hour to avoid GitHub's anonymous API rate limit.
    const versionEl = document.getElementById('latest-release-version');
    const linkEl = document.getElementById('latest-release-link');
    if (versionEl && linkEl) {
        const CACHE_KEY = 'basicswap_latest_release';
        const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

        function applyRelease(tagName, htmlUrl) {
            if (!tagName) return;
            versionEl.textContent = tagName;
            if (htmlUrl) linkEl.href = htmlUrl;
        }

        let cached = null;
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) cached = JSON.parse(raw);
        } catch (e) { /* ignore parse / storage errors */ }

        const fresh = cached && (Date.now() - cached.cached_at) < CACHE_TTL_MS;
        if (fresh) {
            applyRelease(cached.tag_name, cached.html_url);
        } else {
            fetch('https://api.github.com/repos/basicswap/basicswap/releases/latest')
                .then(function(res) { return res.ok ? res.json() : null; })
                .then(function(data) {
                    if (data && data.tag_name) {
                        applyRelease(data.tag_name, data.html_url);
                        try {
                            localStorage.setItem(CACHE_KEY, JSON.stringify({
                                tag_name: data.tag_name,
                                html_url: data.html_url,
                                cached_at: Date.now()
                            }));
                        } catch (e) { /* storage may be full or disabled */ }
                    } else if (cached && cached.tag_name) {
                        // API failed but we have a stale cache - use it rather than nothing
                        applyRelease(cached.tag_name, cached.html_url);
                    }
                })
                .catch(function() {
                    if (cached && cached.tag_name) {
                        applyRelease(cached.tag_name, cached.html_url);
                    }
                });
        }
    }
});
