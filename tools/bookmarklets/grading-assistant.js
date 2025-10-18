javascript:
(function(){
    /* base URL for the script */
    var baseSrc = 'https://carlbohman.github.io/wdd130-instructor-shared/tools/bookmarklets/grading-assistant-code.js';

    /* cache TTL in milliseconds (e.g. 24 hours). Set to 0 to always bypass cache. */
    var CACHE_TTL = 0;/* 24 * 60 * 60 * 1000; */

    /* storage key used to track last fetch time */
    var STORAGE_KEY = 'gradingAssistantLastFetch';

    /* helper to append a cache-busting query param correctly */
    function withCacheBuster(url, ts) {
        return url + (url.indexOf('?') === -1 ? '?' : '&') + '_=' + ts;
    }

    var now = Date.now();
    var lastFetch = parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;

    /* decide src: if TTL is 0 or entry expired, add a timestamp param to bypass cache */
    if (CACHE_TTL === 0 || (now - lastFetch) > CACHE_TTL) {
        var src = withCacheBuster(baseSrc, now);
        try { localStorage.setItem(STORAGE_KEY, String(now)); } catch (e) { /* ignore storage errors */ }
    } else {
        var src = baseSrc;
    }
    var s = document.createElement('script');
    s.src = src;
    s.onload = function(){
        if (typeof runGradingAssistant === 'function') {
            try { runGradingAssistant(); } catch (e) { console.error(e); }
        } else {
            console.error('runGradingAssistant is not defined');
        }
    };
    s.onerror = function(){ console.error('Failed to load script:', src); };
    (document.head || document.documentElement || document.body).appendChild(s);
})();