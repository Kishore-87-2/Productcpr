// Each page gets one minute, regardless of mouse or keyboard activity.
(function () {
    'use strict';
    if (window.productPageTimerStarted) return;
    window.productPageTimerStarted = true;

    // Resolve against this script so GitHub Pages project paths are preserved.
    var home = new URL('index.html', document.currentScript.src);
    if (window.location.pathname === home.pathname ||
        window.location.pathname === home.pathname.replace(/index\.html$/, '')) return;

    // Bookmarks, typed URLs and links from other websites must start at home.
    // Internal links and the index page's login redirect retain a same-site referrer.
    var fromThisSite = false;
    if (document.referrer) {
        try {
            var previousPage = new URL(document.referrer);
            var sitePath = home.pathname.slice(0, home.pathname.lastIndexOf('/') + 1);
            fromThisSite = previousPage.origin === home.origin &&
                previousPage.pathname.indexOf(sitePath) === 0;
        } catch (error) {
            fromThisSite = false;
        }
    }
    if (!fromThisSite) {
        window.location.replace(home.href);
        return;
    }

    var deadline = Date.now() + 60 * 1000;
    var redirected = false;
    var interval;
    var badge;

    function update() {
        var seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (badge) {
            badge.textContent = 'Return to home in ' +
                String(Math.floor(seconds / 60)).padStart(2, '0') + ':' +
                String(seconds % 60).padStart(2, '0');
        }
        if (seconds === 0 && !redirected) {
            redirected = true;
            window.clearInterval(interval);
            window.location.replace(home.href);
        }
    }

    function start() {
        badge = document.createElement('div');
        badge.id = 'product-page-timer';
        badge.setAttribute('role', 'timer');
        badge.setAttribute('aria-label', 'Time remaining before returning to the home page');
        badge.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483647;' +
            'padding:8px 12px;border-radius:8px;background:#1e3a5f;color:#fff;' +
            'font:14px/1.4 Arial,sans-serif;box-shadow:0 2px 8px #0003;pointer-events:none;';
        document.body.appendChild(badge);
        var style = document.createElement('style');
        style.textContent = '@media print { #product-page-timer { display:none!important; } }';
        document.head.appendChild(style);
        interval = window.setInterval(update, 1000);
        window.setTimeout(update, Math.max(0, deadline - Date.now()));
        // Check elapsed wall-clock time after backgrounding or back/forward restoration.
        document.addEventListener('visibilitychange', update);
        window.addEventListener('pageshow', update);
        window.addEventListener('focus', update);
        update();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
}());
