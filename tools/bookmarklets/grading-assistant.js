javascript:
(function(){
    var src = 'https://carlbohman.github.io/wdd130-instructor-shared/tools/bookmarklets/grading-assistant-code.js';
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