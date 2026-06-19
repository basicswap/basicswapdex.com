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

    // Mobile-launch waitlist: post the email straight to Brevo's serve endpoint
    // and show an inline message, so the user never leaves the page. Brevo's
    // serve endpoint is cross-origin, so we use a no-cors POST (response is
    // opaque) and report success optimistically — the double opt-in confirmation
    // email is the real gate. Honeypot (email_address_check) must stay empty.
    const waitlistForms = document.querySelectorAll('.waitlist-form');
    for (var w = 0; w < waitlistForms.length; w++) {
        waitlistForms[w].addEventListener('submit', function(e) {
            e.preventDefault();
            const form = e.currentTarget;
            const msg = form.parentNode.querySelector('.waitlist-msg');
            const btn = form.querySelector('.waitlist-btn');
            const email = form.querySelector('input[name="EMAIL"]');
            const honeypot = form.querySelector('input[name="email_address_check"]');

            function setMsg(text, ok) {
                if (!msg) return;
                msg.textContent = text;
                msg.classList.remove('is-ok', 'is-err');
                msg.classList.add(ok ? 'is-ok' : 'is-err');
            }

            // Silently ignore bot submissions that fill the honeypot.
            if (honeypot && honeypot.value) return;

            const value = (email && email.value || '').trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                setMsg('Please enter a valid email address.', false);
                return;
            }

            if (btn) btn.disabled = true;
            fetch(form.action, {
                method: 'POST',
                mode: 'no-cors',
                body: new FormData(form)
            }).then(function() {
                form.reset();
                setMsg("You're on the list! Check your inbox to confirm your spot.", true);
            }).catch(function() {
                setMsg('Something went wrong. Please try again.', false);
            }).finally(function() {
                if (btn) btn.disabled = false;
            });
        });
    }
});
