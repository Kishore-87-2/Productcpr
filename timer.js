// One-minute page timer and direct-link gate for product pages.
(function () {
    'use strict';

    if (window.productPageTimerStarted) return;
    window.productPageTimerStarted = true;

    var script = document.currentScript;
    var home = new URL('index.html', script.src);
    var siteRoot = home.pathname.slice(0, home.pathname.lastIndexOf('/') + 1);
    var currentPath = window.location.pathname;
    var isHome = currentPath === home.pathname || currentPath === siteRoot;

    // Pages must be reached from another page on this site. A bookmark or a
    // directly opened URL has no same-site referrer, so send it to the index.
    if (!isHome) {
        var sameSiteReferrer = false;
        if (document.referrer) {
            try {
                var referrer = new URL(document.referrer);
                sameSiteReferrer = referrer.origin === home.origin &&
                    referrer.pathname.indexOf(siteRoot) === 0;
            } catch (error) {
                sameSiteReferrer = false;
            }
        }
        if (!sameSiteReferrer) {
            window.location.replace(home.href);
            return;
        }
    }

    if (isHome) return;

    var deadline = Date.now() + 180 * 1000;
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
        window.setTimeout(update, 180 * 1000);
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
