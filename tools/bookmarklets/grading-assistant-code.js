function addJquery() {
    if (typeof jQuery !== 'undefined') return;

    var STORAGE_KEY = 'grading_jquery_cache_v1';
    var ONE_HOUR = 60 * 60 * 1000;
    var CDN = 'https://code.jquery.com/jquery-latest.min.js';

    // try to use cached copy from localStorage if fresher than 1 hour
    try {
        var cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            var obj = JSON.parse(cached);
            if (obj && obj.ts && (Date.now() - obj.ts) < ONE_HOUR && obj.code) {
                var inline = document.createElement('script');
                inline.type = 'text/javascript';
                inline.text = obj.code;
                document.head.appendChild(inline);
                return;
            }
        }
    } catch (e) {
        // storage access or parse error — fall through to network fetch
    }

    // fallback: add script tag that will use browser cache if available,
    // and also fetch the file to update our localStorage cache in background
    var scriptTag = document.createElement('script');
    scriptTag.src = CDN;
    scriptTag.async = false;
    document.head.appendChild(scriptTag);

    // fetch and cache the response for future loads (best-effort)
    try {
        fetch(CDN, { mode: 'cors', cache: 'reload' })
            .then(function (resp) {
                if (!resp.ok) throw new Error('Network response not ok');
                return resp.text();
            })
            .then(function (code) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), code: code }));
                } catch (e) {
                    // ignore quota or storage errors
                }
            })
            .catch(function () {
                /* ignore fetch/cache errors */
            });
    } catch (e) {
        // fetch not available — nothing else to do
    }
}
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function createPopup(title, body) {
    var popup = window.open('', '_blank', 'width=600,height=400,scrollbars=yes');
    popup.document.title = title;
    popup.document.body.innerHTML = body;
    return popup;
}
function componentFromStr(numStr, percent) {
    var num = Math.max(0, parseInt(numStr, 10));
    return percent ? Math.floor(255 * Math.min(100, num) / 100) : Math.min(255, num);
}
function rgbToHex(rgb) {
    var rgbRegex = /^rgba?\(\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)(?:\s*,\s*(?:\d*\.\d+|\d+))?\s*\)$/;
    var result,
        r,
        g,
        b,
        hex = "";
    if ((result = rgbRegex.exec(rgb))) {
        r = componentFromStr(result[1], result[2]);
        g = componentFromStr(result[3], result[4]);
        b = componentFromStr(result[5], result[6]);
        hex = "0x" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    return hex;
}
function getStyle(oElm, strCssRule) {
    var strValue = "";
    var iframe = document.getElementById("originalFrame");
    if (iframe.contentWindow && iframe.contentWindow.getComputedStyle) {
        strValue = iframe.contentWindow.getComputedStyle(oElm).getPropertyValue(strCssRule);
    } else if (oElm.currentStyle) {
        strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
            return p1.toUpperCase();
        });
        strValue = oElm.currentStyle[strCssRule];
    }
    return strValue;
}
function addList(node, name, data, type) {
    data = Array.from(data).sort();
    var div = document.createElement("div");
    node.appendChild(div);
    var h = document.createElement("h3");
    h.innerHTML = name;
    div.appendChild(h);
    var ul = document.createElement("ul");
    div.appendChild(ul);
    var x = null;
    for (const d of data) {
        var li = document.createElement("li");
        if (type == "color") {
            x = d.split(' ').slice(1).join(' ');
            li.style.backgroundColor = x;
            x = document.createElement("span");
            x.innerHTML = d;
        } else if (type == "font") {
            x = document.createElement("span");
            x.innerHTML = d;
            li.appendChild(x);
            li.appendChild(document.createElement("br"));
            x = document.createElement("span");
            x.style.fontFamily = d;
            x.classList.add("font_example");
            x.innerHTML = "Example";
        } else if (type == "link") {
            x = document.createElement("a");
            x.href = d;
            x.target = "_blank";
            x.innerHTML = d;
        } else if (type == "element") {
            x = d;
        }
        li.appendChild(x);
        ul.appendChild(li);
    }
}
function getFontImportStatements() {
    const fontImports = [];
    const styleSheets = Array.from(document.styleSheets);

    for (const styleSheet of styleSheets) {
        try {
            styleSheet.cssRules;
        } catch (e) {
            continue;
        }
        const cssRules = styleSheet.cssRules;
        for (rule of cssRules) {
            if ((rule instanceof CSSImportRule) && (rule.href.match(/\/fonts\.googleapis\.com\//)))
                fontImports.push(rule);
        }
    }
    return fontImports;
}
function createIframe() {
    var iframe = null;
    var cf = document.getElementById("colors_and_fonts");
    if (cf == null) {
        var fontImports = getFontImportStatements();
        iframe = document.createElement("iframe");
        iframe.id = 'originalFrame';
        var content = document.documentElement.innerHTML;
        document.body.innerHTML = iframe.outerHTML;
        iframe = document.getElementById("originalFrame");
        var doc = iframe.contentWindow.document;
        doc.open();
        doc.write(content);
        doc.close();
        for (const element of document.head.getElementsByTagName('*')) {
            if (element.tagName.toLowerCase() != 'title')
                element.parentNode.removeChild(element);
        }
        iframe = top.document.body.getElementsByTagName('iframe')[0];
        if (iframe == null) {
            alert("Iframe not found");
            return;
        }
        // wait (up to 5s) for the iframe's document to be available/loaded,
        // prefer the iframe 'load' event but also check readyState as a fallback
        try {
            var _start = Date.now();
            var _timeout = 5000; // ms
            var _loaded = false;
            function _onIframeLoad() { _loaded = true; try { iframe.contentWindow.removeEventListener('load', _onIframeLoad); } catch (e) { } }
            try {
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.addEventListener('load', _onIframeLoad);
                }
            } catch (e) {
                // ignore (possible cross-origin access)
            }
            while (true) {
                try {
                    if (iframe && iframe.contentWindow && iframe.contentWindow.document) {
                        var _doc = iframe.contentWindow.document;
                        if (_doc.readyState === 'complete' || _doc.body) { _loaded = true; }
                    }
                } catch (e) {
                    // ignore access errors
                }
                if (_loaded) break;
                if (Date.now() - _start > _timeout) break;
            }
            try { iframe.contentWindow.removeEventListener('load', _onIframeLoad); } catch (e) { }
        } catch (e) {
            // ignore and continue if access throws
        }
        // Ensure body exists before trying to access it
        if (!iframe.contentWindow.document.body) {
            console.warn("Iframe body not available yet, skipping link target modifications");
        } else {
            for (const element of iframe.contentWindow.document.body.getElementsByTagName('a')) {
                if (element.getAttribute('target') == null) element.setAttribute('target', '_top');
            }
            iframe.contentWindow.document.body.focus();
        }
        cf = document.createElement("div");
        cf.id = "colors_and_fonts";
        document.body.insertBefore(cf, document.body.firstChild);
        var css = `
        body
        {
            margin: 0px;
        }
        div#colors_and_fonts,
        div#colors_and_fonts div,
        div#colors_and_fonts div h3,
        div#colors_and_fonts div ul,
        div#colors_and_fonts div ul li,
        div#colors_and_fonts div ul li span,
        div#colors_and_fonts div ul li a
        {
            all: revert;
            width: 100%;
            padding: 0em;
            margin: 0em;
            top: 0px;
            left: 0px;
            height: auto;
            color: black;
            background-color: white;
            font-family: sans-serif;
            font-size: medium;
            font-weight: normal;
            text-align: center;
            border: none;
        }
        div#colors_and_fonts
        {
            border: 1px solid black;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            width: auto;
            grid-column: 1/-1;
            overflow-wrap: anywhere;
        }
        div#colors_and_fonts div
        {   
        }
        div#colors_and_fonts div h3
        {
            padding: 0.1em;
            width: auto;
            font-size: large;
            font-weight: bold;
            background-color: #EEEEEE;
        }
        div#colors_and_fonts div ul
        {
            list-style-type: none;
            position: unset;
        }
        div#colors_and_fonts div ul li
        {
            padding: 0.1em;
            width: auto;
            float: none;
        }
        div#colors_and_fonts div ul li span
        {
        }
        div#colors_and_fonts div ul li span.font_example
        {
            font-size: large;
        }
        div#colors_and_fonts div ul li a
        {
            text-decoration: underline;
        }
        div#colors_and_fonts div ul li a:visited
        {
            color: purple;
            text-decoration: underline;
        }
        div#colors_and_fonts div ul li a:active
        {
            color: red;
            text-decoration: underline;
        }
        iframe#originalFrame
        {
            width: 100%;
            height: calc(100vh - 50px);
            resize: vertical;
        }
        `;
        var styles = document.createElement("style");
        styles.innerHTML = css;
        document.head.appendChild(styles);
        const styleSheets = document.styleSheets;
        for (const fontImport of fontImports) {
            styleSheets[styleSheets.length - 1].insertRule(fontImport.cssText);
        }
    } else {
        iframe = document.getElementById("originalFrame");
    }
    return iframe;
}
function displayFontsAndColors() {
    var cf = document.getElementById("colors_and_fonts");
    var iframe = document.getElementById("originalFrame");
    cf.innerHTML = "";
    var bg = new Set();
    var fg = new Set();
    var font = new Set();
    var links = new Set();
    var elinks = new Set();
    var tests = new Set();
    var elements = iframe.contentWindow.document.getElementsByTagName("*");
    var s = null;
    for (const cur of elements) {
        s = getStyle(cur, "background-color");
        bg.add(rgbToHex(s) + " " + s);
        s = getStyle(cur, "color");
        fg.add(rgbToHex(s) + " " + s);
        font.add('"' + getStyle(cur, "font-family").replace(/^['"]+|['"]+$/g, '') + '"');
        if (cur.tagName.toLowerCase() == 'a') {
            links.add(cur.href);
        }
    }
    var a = document.createElement("a");
    a.href = "http://validator.w3.org/check?uri=" + escape(document.location);
    a.target = "_blank";
    a.innerHTML = "HTML validator";
    elinks.add(a);
    a = document.createElement("a");
    a.href = "http://jigsaw.w3.org/css-validator/validator?uri=" + escape(document.location);
    a.target = "_blank";
    a.innerHTML = "CSS validator";
    elinks.add(a);
    a = document.createElement("a");
    a.href = "site-plan.html";
    a.target = "_blank";
    a.innerHTML = "Site Plan";
    elinks.add(a);
    a = document.createElement("a");
    a.href = "javascript:iframe = $('#originalFrame'); $('header', iframe.contents()).toggle();";
    a.innerHTML = "Toggle &lt;header&gt;";
    elinks.add(a);
    a = document.createElement("a");
    a.href = "javascript:iframe = $('#originalFrame'); $('img', iframe.contents()).css('max-width', '100%');";
    a.innerHTML = "&lt;img&gt; max-width: 100%";
    elinks.add(a);
    a = document.createElement("a");
    for (i = 1; i <= 5; i++) {
        a = document.createElement("a");
        a.href = "javascript:runGradingTest('Rafting', " + i + ");";
        a.innerHTML = "Rafting #" + i;
        tests.add(a);
    }
    addList(cf, "background-color", bg, 'color');
    addList(cf, "color", fg, 'color');
    addList(cf, "font-family", font, 'font');
    addList(cf, "links", links, 'link');
    addList(cf, "External Links", elinks, 'element');
    addList(cf, "Run Tests", tests, 'element');
    document.body.scrollTop = document.documentElement.scrollTop = 0;
}
function runGradingTest(activity, number) {
    var iframe = document.getElementById("originalFrame");
    var iframeDoc = iframe.contentWindow.document;
    var results = [];

    if (activity == 'Rafting') {
        if (number == 4) {
            runGradingTestRafting4(iframe, iframeDoc, results);
        } else if (number == 5) {
            runGradingTestRafting5(iframe, iframeDoc, results);
        } else {
            results.push('❌ Test Rafting #' + number + ' is not implemented yet.');
        }
    } else {
        alert('Unknown activity: ' + activity);
        return;
    }
    // open a popup and show results as an unordered list
    var html = '<html><head><title>Grading Results</title></head><body><h2>Results for ' + escapeHtml(activity) + ' #' + number + '</h2>';
    html += '<p><a href="' + escapeHtml(window.location) + '">' + escapeHtml(window.location) + '</a></p>';
    if (results.length > 0) {
        (function () {
            function renderItem(item) {
                if (Array.isArray(item)) {
                    return '<li>Results: <ul>' + item.map(renderItem).join('') + '</ul></li>';
                }
                return '<li>' + escapeHtml(item) + '</li>';
            }
            html += '<ol>' + results.map(renderItem).join('') + '</ol>';
        })();
    } else {
        html += '<p>No results found.</p>';
    }
    html += '<button onclick="window.close()">Close</button></body></html>';
    var popup = createPopup('Grading Results', html);
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
}
function runGradingAssistant() {
    addJquery();
    var iframe = createIframe();
    if (iframe.contentWindow.document.readyState === 'complete') {
        displayFontsAndColors()
    } else {
        iframe.contentWindow.addEventListener('load', displayFontsAndColors)
    }
}
function runGradingTestRafting4(iframe, iframeDoc, results) {
    // check for <style> tags inside the iframe
    (function () {
        var subResults = [];
        var styleTags = iframeDoc.getElementsByTagName('style');
        if (styleTags.length > 0) {
            subResults.push('❌ Found <style> tag(s) in the document; please use external CSS files instead.');
        }

        // check for at least one external stylesheet that is actually accessible
        var linkElems = Array.from(iframeDoc.getElementsByTagName('link')).filter(function (l) {
            return (l.rel || '').toLowerCase().indexOf('stylesheet') !== -1 && /^https?:\/\//i.test(l.href || '');
        });

        if (linkElems.length === 0) {
            subResults.push('ℹ️ No external <link rel=\"stylesheet\"> elements found.');
        } else {
            var foundWorking = false;
            for (const linkEl of linkElems) {
                try {
                    // Accessing cssRules will throw if stylesheet is blocked by CORS or failed to load
                    var rules = linkEl.sheet && linkEl.sheet.cssRules;
                    // If we got rules (even empty) without throwing, treat as working
                    foundWorking = true;
                    subResults.push('✅ External stylesheet loaded and accessible: ' + linkEl.href);
                    break;
                } catch (e) {
                    // stylesheet exists but is not accessible (CORS or error)
                    subResults.push('❌ External stylesheet blocked or failed to load: ' + linkEl.href);
                }
            }
            if (!foundWorking) {
                subResults.push('❌ No external stylesheet links are accessible (they may be blocked by CORS or failed to load).');
            }
        }
        results.push(subResults);
    })();

    // check for a single wrapper div around body
    (function () {
        var subResults = [];
        var bodyChildren = Array.from(iframeDoc.body.children);
        if (bodyChildren.length === 1 && bodyChildren[0].tagName.toLowerCase() === 'div') {
            var wrapper = bodyChildren[0];
            subResults.push('✅ Body is wrapped by a single <div>');
            // check id
            if (wrapper.id === 'content') {
                subResults.push('✅ Wrapper div has id=\"content\"');
            } else {
                subResults.push('❌ Wrapper div must have id=\"content\" (found \"' + (wrapper.id || '') + '\")');
            }
            // check computed max-width
            var computedMaxWidth = getStyle(wrapper, 'max-width');
            var inlineMaxWidth = wrapper.style && wrapper.style.maxWidth;
            var found = false;
            if (computedMaxWidth && computedMaxWidth !== 'none') {
                if (/^\s*1600(?:\.0+)?px\s*$/i.test(computedMaxWidth)) {
                    subResults.push('✅ #content has CSS max-width: ' + computedMaxWidth);
                    found = true;
                } else {
                    // computed exists but not 1600px
                    subResults.push('❌ #content max-width should be 1600px (found computed: ' + computedMaxWidth + ')');
                    found = true;
                }
            }
            if (!found && inlineMaxWidth) {
                if (/^\s*1600(?:\.0+)?px\s*$/i.test(inlineMaxWidth)) {
                    subResults.push('✅ #content has inline max-width: ' + inlineMaxWidth);
                } else {
                    subResults.push('❌ #content max-width should be 1600px (found inline: ' + inlineMaxWidth + ')');
                }
                found = true;
            }
            if (!found) {
                subResults.push('❌ #content is missing a CSS max-width of 1600px');
            }
        } else {
            subResults.push('❌ Body must contain a single wrapping <div id=\"content\"> that surrounds all content');
        }
        results.push(subResults);
    })();

    // check centering for nav links, headlines, buttons, and sections
    (function () {
        var subResults = [];
        function describe(el) {
            var desc = el.tagName.toLowerCase();
            if (el.id) desc += '#' + el.id;
            if (el.className) desc += '.' + (el.className.replace(/\s+/g, '.'));
            var txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
            if (txt) desc += ' "' + txt.slice(0, 30) + (txt.length > 30 ? '…' : '') + '"';
            return desc;
        }

        function pxValue(v) {
            if (!v) return null;
            if (v === 'auto') return 'auto';
            var m = v.match(/^(-?\d+(?:\.\d+)?)px$/);
            return m ? parseFloat(m[1]) : null;
        }

        function isCentered(el) {
            // check any ancestor has text-align:center
            var node = el;
            while (node && node.nodeType === 1) {
                var ta = getStyle(node, 'text-align');
                if (ta && ta.toLowerCase() === 'center') return { ok: true, reason: 'ancestor text-align:center on ' + describe(node) };
                node = node.parentElement;
            }

            // check parent flex justify-content:center
            var parent = el.parentElement;
            if (parent) {
                var disp = (getStyle(parent, 'display') || '').toLowerCase();
                if (disp.indexOf('flex') !== -1) {
                    var jc = (getStyle(parent, 'justify-content') || '').toLowerCase();
                    if (jc.indexOf('center') !== -1) return { ok: true, reason: 'parent flex justify-content:center on ' + describe(parent) };
                }
            }

            /*
                        // check margins auto or symmetric margins
                        var ml = getStyle(el, 'margin-left');
                        var mr = getStyle(el, 'margin-right');
                        if (ml === 'auto' && mr === 'auto') return { ok: true, reason: 'margin-left and margin-right are auto' };
                        var mlpx = pxValue(ml), mrpx = pxValue(mr);
                        if (typeof mlpx === 'number' && typeof mrpx === 'number') {
                            if (Math.abs(mlpx - mrpx) <= 2) return { ok: true, reason: 'symmetric margins (' + mlpx + 'px / ' + mrpx + 'px)' };
                        }
            */

            return { ok: false, reason: 'no centering CSS found' };
        }

        function checkSet(list, label) {
            if (!list || list.length === 0) {
                subResults.push('ℹ️ No ' + label + ' found.');
                return;
            }
            var notCentered = [];
            for (var i = 0; i < list.length; i++) {
                var el = list[i];
                var res = isCentered(el);
                if (res.ok) {
                    // report a few positives for visibility (but not every single element)
                    if (i < 3) subResults.push('✅ ' + label + ' centered: ' + describe(el) + ' (' + res.reason + ')');
                } else {
                    notCentered.push(describe(el));
                }
            }
            if (notCentered.length === 0) {
                subResults.push('✅ All ' + label + ' are centered.');
            } else {
                subResults.push('❌ The following ' + label + ' are NOT centered: ' + notCentered.slice(0, 10).join(', ') +
                    (notCentered.length > 10 ? ' (and ' + (notCentered.length - 10) + ' more)' : ''));
            }
        }

        // Nav links
        var navAnchors = [];
        var navs = iframeDoc.getElementsByTagName('nav');
        for (var ni = 0; ni < navs.length; ni++) {
            var nav = navs[ni];
            var anchors = nav.getElementsByTagName('a');
            for (var ai = 0; ai < anchors.length; ai++) navAnchors.push(anchors[ai]);
        }
        checkSet(navAnchors, 'nav links');

        // Headline elements (h1-h6)
        var headlines = [];
        for (var h = 1; h <= 6; h++) {
            var hs = iframeDoc.getElementsByTagName('h' + h);
            for (var j = 0; j < hs.length; j++) headlines.push(hs[j]);
        }
        checkSet(headlines, 'headline elements (h1-h6)');

        // Buttons (button, input[type=button|submit|reset])
        var buttons = [];
        var bEls = iframeDoc.getElementsByTagName('button');
        for (var b = 0; b < bEls.length; b++) buttons.push(bEls[b]);
        var inputs = iframeDoc.getElementsByTagName('input');
        for (var ii = 0; ii < inputs.length; ii++) {
            var t = (inputs[ii].type || '').toLowerCase();
            if (t === 'button' || t === 'submit' || t === 'reset') buttons.push(inputs[ii]);
        }
        checkSet(buttons, 'buttons');

        // Section elements
        var sections = iframeDoc.getElementsByTagName('section');
        checkSet(Array.prototype.slice.call(sections), 'section elements');

        results.push(subResults);
    })();

    // check for element with id="background" and verify it has a CSS height
    (function () {
        var subResults = [];
        const background = iframeDoc.getElementById('background');
        if (background) {
            subResults.push('✅ Found element with id="background"');
            var computedHeight = getStyle(background, 'height');
            if (computedHeight && computedHeight !== 'auto' && computedHeight !== '0px') {
                subResults.push('✅ #background has CSS height: ' + computedHeight);
            } else if (background.style && background.style.height) {
                subResults.push('✅ #background has inline height: ' + background.style.height);
            } else {
                subResults.push('❌ #background is missing a CSS height');
            }
        } else {
            subResults.push('❌ Missing element with id="background"');
        }
        results.push(subResults);
    })();

    // check background colors for body, header, nav:hover, buttons, divs, and footer
    (function () {
        var subResults = [];
        function hasVisibleBackground(val) {
            if (!val) return false;
            val = val.trim().toLowerCase();
            if (val === 'transparent' || val === 'inherit' || val === 'initial' || val === 'none') return false;
            // rgba(..., 0) -> fully transparent
            if (/^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0(?:\.0+)?\s*\)$/.test(val)) return false;
            return true;
        }

        // body
        var bodyBg = getStyle(iframeDoc.body, 'background-color');
        if (hasVisibleBackground(bodyBg)) {
            subResults.push('✅ body background-color set: ' + bodyBg);
        } else {
            subResults.push('❌ body is missing a visible background-color (computed: ' + (bodyBg || 'none') + ')');
        }

        // header
        var headers = iframeDoc.getElementsByTagName('header');
        if (headers.length === 0) {
            subResults.push('ℹ️ No <header> element found.');
        } else {
            for (var hi = 0; hi < headers.length; hi++) {
                var hb = getStyle(headers[hi], 'background-color');
                if (hasVisibleBackground(hb)) {
                    subResults.push('✅ <header' + (headers[hi].id ? '#' + headers[hi].id : '') + '> background-color: ' + hb);
                } else {
                    subResults.push('❌ <header' + (headers[hi].id ? '#' + headers[hi].id : '') + '"> is missing a visible background-color (computed: ' + (hb || 'none') + ')');
                }
            }
        }

        // footer
        var footers = iframeDoc.getElementsByTagName('footer');
        if (footers.length === 0) {
            subResults.push('ℹ️ No <footer> element found.');
        } else {
            for (var fi = 0; fi < footers.length; fi++) {
                var fb = getStyle(footers[fi], 'background-color');
                if (hasVisibleBackground(fb)) {
                    subResults.push('✅ <footer' + (footers[fi].id ? '#' + footers[fi].id : '') + '> background-color: ' + fb);
                } else {
                    subResults.push('❌ <footer' + (footers[fi].id ? '#' + footers[fi].id : '') + '"> is missing a visible background-color (computed: ' + (fb || 'none') + ')');
                }
            }
        }

        // nav:hover — check style rules for any nav:hover selector in accessible stylesheets
        (function () {
            var foundHoverRule = false;
            var styleSheets = Array.from(iframeDoc.styleSheets || []);
            for (const ss of styleSheets) {
                try {
                    var cssRules = ss.cssRules;
                } catch (e) {
                    continue;
                }
                for (const rule of Array.from(cssRules || [])) {
                    try {
                        if (rule.type === CSSRule.STYLE_RULE && rule.selectorText && /(^|[ ,>+~])nav\b[^,]*:hover\b/i.test(rule.selectorText)) {
                            foundHoverRule = true;
                            subResults.push('✅ Found CSS rule for nav:hover: ' + rule.selectorText);
                            break;
                        }
                    } catch (e) {
                        // ignore
                    }
                }
                if (foundHoverRule) break;
            }
            if (!foundHoverRule) {
                subResults.push('❌ Missing a CSS rule that targets nav:hover (no visible nav hover background detected via stylesheet rules).');
            }
        })();

        // buttons
        (function () {
            var btns = [];
            var bEls = iframeDoc.getElementsByTagName('button');
            for (var b = 0; b < bEls.length; b++) btns.push(bEls[b]);
            var inputs = iframeDoc.getElementsByTagName('input');
            for (var ii = 0; ii < inputs.length; ii++) {
                var t = (inputs[ii].type || '').toLowerCase();
                if (t === 'button' || t === 'submit' || t === 'reset') btns.push(inputs[ii]);
            }
            if (btns.length === 0) {
                subResults.push('ℹ️ No buttons or button-like inputs found.');
            } else {
                var missing = [];
                for (var i = 0; i < btns.length; i++) {
                    var bg = getStyle(btns[i], 'background-color');
                    if (!hasVisibleBackground(bg)) {
                        var desc = btns[i].tagName.toLowerCase() + (btns[i].id ? '#' + btns[i].id : '') + (btns[i].className ? '.' + btns[i].className.split(/\s+/).join('.') : '');
                        missing.push(desc || ('button #' + i));
                    }
                }
                if (missing.length === 0) {
                    subResults.push('✅ All buttons have a visible background-color.');
                } else {
                    subResults.push('❌ The following buttons are missing a visible background-color: ' + missing.slice(0, 10).join(', ') + (missing.length > 10 ? ' (and ' + (missing.length - 10) + ' more)' : ''));
                }
            }
        })();

        // divs — require at least one prominent div with background or report how many lack one
        (function () {
            var divs = Array.from(iframeDoc.getElementsByTagName('div'));
            if (divs.length === 0) {
                subResults.push('ℹ️ No <div> elements found.');
            } else {
                var withBg = 0, without = 0;
                for (var di = 0; di < divs.length; di++) {
                    var vb = getStyle(divs[di], 'background-color');
                    if (hasVisibleBackground(vb)) withBg++; else without++;
                }
                if (withBg > 0) {
                    subResults.push('✅ Found ' + withBg + ' <div> element(s) with a visible background-color; ' + without + ' without.');
                } else {
                    subResults.push('❌ No <div> elements have a visible background-color (checked ' + divs.length + ' divs).');
                }
            }
        })();

        results.push(subResults);
    })();

    // check foreground colors for links, headlines, buttons, and paragraphs
    (function () {
        var subResults = [];
        function hasVisibleForeground(val) {
            if (!val) return false;
            val = val.trim().toLowerCase();
            if (val === 'transparent' || val === 'inherit' || val === 'initial' || val === 'none') return false;
            if (/^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0(?:\.0+)?\s*\)$/.test(val)) return false;
            return true;
        }

        function describe(el) {
            var desc = el.tagName.toLowerCase();
            if (el.id) desc += '#' + el.id;
            if (el.className) desc += '.' + (el.className.replace(/\s+/g, '.'));
            var txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
            if (txt) desc += ' "' + txt.slice(0, 30) + (txt.length > 30 ? '…' : '') + '"';
            return desc;
        }

        function checkColorSet(list, label) {
            if (!list || list.length === 0) {
                subResults.push('ℹ️ No ' + label + ' found.');
                return;
            }
            var missing = [];
            for (var i = 0; i < list.length; i++) {
                var el = list[i];
                var col = getStyle(el, 'color');
                if (hasVisibleForeground(col)) {
                    if (i < 3) subResults.push('✅ ' + label + ' has visible color: ' + describe(el) + ' (' + col + ')');
                } else {
                    missing.push(describe(el));
                }
            }
            if (missing.length === 0) {
                subResults.push('✅ All ' + label + ' have a visible foreground color.');
            } else {
                subResults.push('❌ The following ' + label + ' are missing a visible foreground color: ' + missing.slice(0, 10).join(', ') +
                    (missing.length > 10 ? ' (and ' + (missing.length - 10) + ' more)' : ''));
            }
        }

        // links
        var linkEls = Array.from(iframeDoc.getElementsByTagName('a'));
        checkColorSet(linkEls, 'links');

        // headings (h1-h6)
        var headings = [];
        for (var h = 1; h <= 6; h++) {
            var hs = iframeDoc.getElementsByTagName('h' + h);
            for (var j = 0; j < hs.length; j++) headings.push(hs[j]);
        }
        checkColorSet(headings, 'headline elements (h1-h6)');

        // buttons and button-like inputs
        var btns = [];
        var bEls = iframeDoc.getElementsByTagName('button');
        for (var b = 0; b < bEls.length; b++) btns.push(bEls[b]);
        var inputs = iframeDoc.getElementsByTagName('input');
        for (var ii = 0; ii < inputs.length; ii++) {
            var t = (inputs[ii].type || '').toLowerCase();
            if (t === 'button' || t === 'submit' || t === 'reset') btns.push(inputs[ii]);
        }
        checkColorSet(btns, 'buttons');

        // paragraphs
        var paras = Array.from(iframeDoc.getElementsByTagName('p'));
        checkColorSet(paras, 'paragraphs (<p>)');

        results.push(subResults);
    })();

    // check CSS rules and computed styles for .icon and .logo width:80px
    (function () {
        var subResults = [];
        function classHasRuleWidth(className) {
            var foundRule = false;
            var okRule = false;
            var seenValues = new Set();
            var styleSheets = Array.from(iframeDoc.styleSheets || []);
            for (const ss of styleSheets) {
                try {
                    var cssRules = ss.cssRules;
                } catch (e) {
                    continue;
                }
                for (const rule of Array.from(cssRules || [])) {
                    if (rule.type === CSSRule.STYLE_RULE && rule.selectorText) {
                        try {
                            if (new RegExp('\\.' + className + '\\b', 'i').test(rule.selectorText)) {
                                foundRule = true;
                                var w = (rule.style && rule.style.width) || '';
                                if (w) {
                                    seenValues.add(w);
                                    if (/^\s*80(?:\.0+)?px\s*$/i.test(w)) {
                                        okRule = true;
                                    }
                                }
                            }
                        } catch (e) {
                            // ignore selector parsing edge cases
                        }
                    }
                }
            }
            return { foundRule: foundRule, okRule: okRule, seenValues: Array.from(seenValues) };
        }

        function checkClassWidth(className) {
            var res = classHasRuleWidth(className);
            if (res.okRule) {
                subResults.push('✅ CSS rule for .' + className + ' sets width: 80px (found in stylesheet).');
                return;
            }
            if (res.foundRule && res.seenValues.length > 0) {
                subResults.push('❌ CSS rule(s) for .' + className + ' set width to: ' + res.seenValues.join(', ') + ' (expected 80px).');
                return;
            }
            // fallback to checking computed style on elements with that class inside the iframe
            var elems = Array.from(iframeDoc.getElementsByClassName(className));
            if (elems.length === 0) {
                subResults.push('❌ No elements with class "' + className + '" were found to verify width:80px.');
                return;
            }
            // check computed width of first few elements
            var okCount = 0, checked = 0, seenWidths = new Set();
            for (var i = 0; i < Math.min(elems.length, 5); i++) {
                var cw = getStyle(elems[i], 'width') || '';
                seenWidths.add(cw);
                checked++;
                if (/^\s*80(?:\.0+)?px\s*$/i.test(cw)) okCount++;
            }
            if (okCount === checked) {
                subResults.push('✅ Computed width for .' + className + ' elements is 80px (' + elems.length + ' element(s) found).');
            } else {
                subResults.push('❌ Computed widths for .' + className + ' elements: ' + Array.from(seenWidths).join(', ') + ' (expected 80px).');
            }
        }

        checkClassWidth('icon');
        checkClassWidth('logo');

        // check img counts with those classes
        var imgs = Array.from(iframeDoc.getElementsByTagName('img'));
        var logoCount = 0, iconCount = 0;
        for (const im of imgs) {
            try {
                if (im.classList && im.classList.contains('logo')) logoCount++;
                if (im.classList && im.classList.contains('icon')) iconCount++;
            } catch (e) {
                // ignore
            }
        }
        if (logoCount === 1) {
            subResults.push('✅ Exactly one <img> has class="logo" (' + logoCount + ' found).');
        } else {
            subResults.push('❌ Expected 1 <img> with class="logo", found ' + logoCount + '.');
        }
        if (iconCount === 3) {
            subResults.push('✅ Exactly three <img> elements have class="icon" (' + iconCount + ' found).');
        } else {
            subResults.push('❌ Expected 3 <img> elements with class="icon", found ' + iconCount + '.');
        }
        results.push(subResults);
    })();

    // check that all <a> elements have underlines removed
    (function () {
        var subResults = [];
        var anchors = Array.from(iframeDoc.getElementsByTagName('a'));
        if (anchors.length === 0) {
            subResults.push('ℹ️ No <a> elements found to check underlines.');
            return;
        }
        var underlined = [];
        for (var i = 0; i < anchors.length; i++) {
            var a = anchors[i];
            var td = getStyle(a, 'text-decoration') || getStyle(a, 'text-decoration-line') || '';
            var bbStyle = getStyle(a, 'border-bottom-style') || '';
            var bbWidth = getStyle(a, 'border-bottom-width') || '';
            var hasUnderline = /\bunderline\b/i.test(td) ||
                (bbStyle && bbStyle.toLowerCase() !== 'none' && bbStyle.toLowerCase() !== 'hidden' && !/^0(?:px)?/.test(bbWidth));
            if (hasUnderline) {
                if (a.id === 'logo_link') {
                    subResults.push('ℹ️ Skipping link with id="logo_link" from underline check (ignored).');
                    continue;
                }
                var desc = a.tagName.toLowerCase();
                if (a.id) desc += '#' + a.id;
                if (a.className) desc += '.' + a.className.replace(/\s+/g, '.');
                var txt = (a.textContent || '').trim().replace(/\s+/g, ' ');
                if (txt) desc += ' "' + txt.slice(0, 30) + (txt.length > 30 ? '…' : '') + '"';
                underlined.push(desc);
            }
        }
        if (underlined.length === 0) {
            subResults.push('✅ All <a> elements have the default underline removed.');
        } else {
            subResults.push('❌ The following <a> elements still have an underline: ' + underlined.slice(0, 10).join(', ') + (underlined.length > 10 ? ' (and ' + (underlined.length - 10) + ' more)' : ''));
        }
        results.push(subResults);
    })();

    // check that all external links have target="_blank"
    (function () {
        var subResults = [];
        var links = iframeDoc.getElementsByTagName('a');
        var foundExternal = false;
        for (const a of links) {
            var href = a.getAttribute('href');
            if (!href) continue;
            try {
                var url = new URL(href, iframeDoc.baseURI);
            } catch (e) {
                continue; // skip invalid URLs (javascript:, mailto:, etc.)
            }
            if (!/^https?:/.test(url.protocol)) continue; // ignore non-http(s) schemes
            if (url.host !== iframe.contentWindow.location.host) {
                foundExternal = true;
                var target = a.getAttribute('target');
                if (target === '_blank') {
                    subResults.push('✅ External link "' + url.href + '" has target=\"_blank\"');
                } else {
                    subResults.push('❌ External link "' + url.href + '" is missing target=\"_blank\"');
                }
            }
        }
        if (!foundExternal) {
            subResults.push('ℹ️ No external links found.');
        }
        results.push(subResults);
    })();

    return results;
}
function runGradingTestRafting5(iframe, iframeDoc, results) {
    // check for margin/padding rules in stylesheets
    (function () {
        var subResults = [];
        var examples = new Map();
        var styleSheets = Array.from(iframeDoc.styleSheets || []);

        if (styleSheets.length === 0) {
            subResults.push('ℹ️ No stylesheets found to inspect.');
        } else {
            for (const ss of styleSheets) {
                try {
                    var cssRules = ss.cssRules;
                } catch (e) {
                    // inaccessible stylesheet (CORS or other), skip
                    continue;
                }
                for (const rule of Array.from(cssRules || [])) {
                    try {
                        if (rule.type !== CSSRule.STYLE_RULE || !rule.selectorText) continue;
                        const selectors = rule.selectorText.split(',').map(s => s.trim());
                        for (const sel of selectors) {
                            // only consider selectors that target classes or ids
                            if (!/[.#][A-Za-z0-9_-]/.test(sel)) continue;
                            // check rule.style for margin/padding properties
                            for (let i = 0; i < rule.style.length; i++) {
                                const prop = rule.style[i];
                                if (/^(margin|padding)(?:$|-)/i.test(prop)) {
                                    const val = rule.style.getPropertyValue(prop).trim();
                                    // consider property present if it has a non-empty value
                                    if (val !== '') {
                                        const key = sel + ' { ' + prop + ': ' + val + ' }';
                                        if (!examples.has(key)) examples.set(key, key);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // ignore individual rule parsing errors
                    }
                }
            }

            const found = Array.from(examples.values());
            if (found.length >= 2) {
                subResults.push('✅ Found at least 2 class/id-based selectors in attached stylesheets that set margin or padding.');
                // show two representative examples (more available in verbose output)
                subResults.push('Examples: ' + found.slice(0, 5).join(' ; '));
            } else if (found.length === 1) {
                subResults.push('❌ Only 1 class/id-based selector found that sets margin or padding (need at least 2).');
                subResults.push('Example: ' + found[0]);
            } else {
                subResults.push('❌ No class/id-based selectors in attached stylesheets set a margin or padding property.');
            }
        }

        results.push(subResults);
    })();

    // check for font-family usage in stylesheets and computed styles
    (function () {
        var subResults = [];

        // helper to describe an element briefly
        function describeElement(el) {
            var desc = el.tagName.toLowerCase();
            if (el.id) desc += '#' + el.id;
            if (el.className) desc += '.' + (el.className.replace(/\s+/g, '.'));
            var txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
            if (txt) desc += ' "' + txt.slice(0, 30) + (txt.length > 30 ? '…' : '') + '"';
            return desc;
        }

        var genericKeywords = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace']);

        // Inspect computed font-family on elements
        var elements = Array.from(iframeDoc.getElementsByTagName('*'));
        var genericOnlyElements = [];
        var singleFamilyElements = [];
        var elementsWith3OrMore = 0;
        for (const el of elements) {
            try {
                var ff = getStyle(el, 'font-family') || '';
                if (!ff) continue;
                var families = ff.split(',').map(s => s.trim().replace(/^['"]+|['"]+$/g, '')).filter(Boolean);
                var lower = families.map(f => f.toLowerCase());
                if (families.length >= 3) elementsWith3OrMore++;
                if (families.length === 1) singleFamilyElements.push(describeElement(el) + ' (' + families[0] + ')');
                if (families.length > 0 && lower.every(f => genericKeywords.has(f))) {
                    genericOnlyElements.push(describeElement(el) + ' (' + ff + ')');
                }
            } catch (e) {
                // ignore individual element errors
            }
        }

        if (genericOnlyElements.length === 0) {
            subResults.push('✅ No elements were detected using only generic/default font families (serif, sans-serif, etc.).');
        } else {
            subResults.push('❌ Some elements appear to be using only generic/default font families: ' + genericOnlyElements.slice(0, 10).join(', ') +
                (genericOnlyElements.length > 10 ? ' (and ' + (genericOnlyElements.length - 10) + ' more)' : ''));
        }

        if (singleFamilyElements.length === 0) {
            subResults.push('✅ No elements were found with a computed font-family that contains only a single family name (no fallbacks).');
        } else {
            subResults.push('❌ Elements with a single font-family (no fallbacks) detected: ' + singleFamilyElements.slice(0, 10).join(', ') +
                (singleFamilyElements.length > 10 ? ' (and ' + (singleFamilyElements.length - 10) + ' more)' : ''));
        }

        // Inspect stylesheets for font-family declarations and whether they include at least 3 fonts
        var fontRules = [];
        var fontRulesWith3Plus = [];
        var styleSheets = Array.from(iframeDoc.styleSheets || []);
        for (const ss of styleSheets) {
            try {
                var cssRules = ss.cssRules;
            } catch (e) {
                continue; // inaccessible stylesheet
            }
            for (const rule of Array.from(cssRules || [])) {
                try {
                    if (rule.type === CSSRule.STYLE_RULE && rule.style && rule.style.fontFamily) {
                        var raw = rule.style.fontFamily;
                        var fams = raw.split(',').map(s => s.trim().replace(/^['"]+|['"]+$/g, '')).filter(Boolean);
                        fontRules.push(rule.selectorText + ' { font-family: ' + raw + ' }');
                        if (fams.length >= 3) {
                            fontRulesWith3Plus.push(rule.selectorText + ' { font-family: ' + raw + ' }');
                        }
                    }
                } catch (e) {
                    // ignore per-rule parse problems
                }
            }
        }

        if (fontRulesWith3Plus.length > 0) {
            subResults.push('✅ Found CSS font-family rule(s) that provide at least three fallback fonts: ' + fontRulesWith3Plus.slice(0, 5).join(' ; '));
        } else if (fontRules.length > 0) {
            subResults.push('❌ No CSS font-family rules with 3 or more fonts were found. Example font-family rules found: ' + fontRules.slice(0, 5).join(' ; '));
        } else {
            subResults.push('ℹ️ No CSS font-family declarations were found in accessible stylesheets.');
        }

        // Check the page-wide font usage (html/body)
        try {
            var rootFF = getStyle(iframeDoc.documentElement, 'font-family') || '';
            var bodyFF = getStyle(iframeDoc.body, 'font-family') || '';
            function ffIsGenericOnly(ff) {
                if (!ff) return true;
                var parts = ff.split(',').map(s => s.trim().replace(/^['"]+|['"]+$/g, '')).filter(Boolean).map(s => s.toLowerCase());
                return parts.length === 0 || parts.every(p => genericKeywords.has(p));
            }
            if (!ffIsGenericOnly(rootFF) || !ffIsGenericOnly(bodyFF)) {
                subResults.push('✅ The page root/body have explicit font-family values (html: "' + rootFF + '", body: "' + bodyFF + '").');
            } else {
                subResults.push('❌ The page root/body appear to be using generic/default fonts (html: "' + rootFF + '", body: "' + bodyFF + '"). Consider setting a site-wide font-family with fallbacks (at least 3 fonts).');
            }
        } catch (e) {
            subResults.push('ℹ️ Could not determine computed font-family for document root/body due to access errors.');
        }

        // Summary about prevalence of 3+ font-family usage among elements
        if (elementsWith3OrMore > 0) {
            subResults.push('✅ ' + elementsWith3OrMore + ' element(s) have a computed font-family that lists 3 or more families (examples shown above if any).');
        } else {
            subResults.push('❌ No individual elements were observed with a computed font-family listing 3 or more fonts.');
        }

        results.push(subResults);
    })();

    // check for card images and their styles
    (function () {
        var subResults = [];

        function hasVisibleBackground(val) {
            if (!val) return false;
            val = val.trim().toLowerCase();
            if (val === 'transparent' || val === 'inherit' || val === 'initial' || val === 'none') return false;
            if (/^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0(?:\.0+)?\s*\)$/.test(val)) return false;
            return true;
        }

        function hasVisibleBorder(el) {
            var style = getStyle(el, 'border-style') || '';
            var width = getStyle(el, 'border-width') || '';
            var color = getStyle(el, 'border-color') || '';
            style = style.toLowerCase();
            width = width.toLowerCase();
            if (!style || style === 'none' || style === 'hidden') return false;
            if (/^0(?:px)?$/.test(width.trim())) return false;
            // color could be transparent
            if (!hasVisibleBackground(color) && !/^rgba\(.+,0(?:\.0+)?\)$/.test(color)) {
                // If color appears transparent treat as no border color
                // But if style/width present we'll still consider it a border unless color explicitly transparent
            }
            return true;
        }

        function normalizeColor(val) {
            if (!val) return '';
            try {
                var h = rgbToHex(val);
                if (h) return h.toString().toLowerCase();
            } catch (e) { }
            return String(val).trim().toLowerCase();
        }

        function findContainingBg(el) {
            var node = el.parentElement;
            while (node) {
                var bg = getStyle(node, 'background-color');
                if (hasVisibleBackground(bg)) return bg;
                node = node.parentElement;
            }
            // fallback to document body computed background
            return getStyle(iframeDoc.body, 'background-color') || '';
        }

        // 1) Check for three img.card-img inside section tags
        try {
            var cardImgs = Array.from(iframeDoc.querySelectorAll('section img.card-img'));
            if (cardImgs.length === 3) {
                subResults.push('✅ Found exactly 3 <img class="card-img"> elements inside <section> tags.');
            } else {
                subResults.push('❌ Expected 3 <img class="card-img"> elements inside <section>, found ' + cardImgs.length + '.');
            }

            if (cardImgs.length > 0) {
                var imgsMissingBorder = [];
                var imgsWrongBoxSizing = [];
                for (var i = 0; i < cardImgs.length; i++) {
                    var im = cardImgs[i];
                    try {
                        if (!hasVisibleBorder(im)) imgsMissingBorder.push(describeElementForReport(im));
                        var box = (getStyle(im, 'box-sizing') || '').toLowerCase();
                        if (box !== 'border-box') imgsWrongBoxSizing.push((describeElementForReport(im) + ' (box-sizing: ' + (box || 'default') + ')'));
                    } catch (e) {
                        // ignore element-specific errors
                    }
                }
                if (imgsMissingBorder.length === 0) {
                    subResults.push('✅ All card images have a visible border.');
                } else {
                    subResults.push('❌ The following card images do not have a visible border: ' + imgsMissingBorder.slice(0, 10).join(', ') + (imgsMissingBorder.length > 10 ? ' (and more)' : ''));
                }
                if (imgsWrongBoxSizing.length === 0) {
                    subResults.push('✅ All card images use box-sizing: border-box.');
                } else {
                    subResults.push('❌ The following card images are missing box-sizing: border-box: ' + imgsWrongBoxSizing.slice(0, 10).join(', ') + (imgsWrongBoxSizing.length > 10 ? ' (and more)' : ''));
                }
            }
        } catch (e) {
            subResults.push('ℹ️ Could not evaluate card images due to an error.');
        }

        // helper used above (kept local to avoid name collisions)
        function describeElementForReport(el) {
            try {
                var desc = el.tagName.toLowerCase();
                if (el.id) desc += '#' + el.id;
                if (el.className) desc += '.' + (el.className.replace(/\s+/g, '.'));
                var txt = (el.alt || el.getAttribute('alt') || el.getAttribute('title') || el.textContent || '').toString().trim().replace(/\s+/g, ' ');
                if (txt) desc += ' "' + txt.slice(0, 30) + (txt.length > 30 ? '…' : '') + '"';
                return desc;
            } catch (e) {
                return el.tagName ? el.tagName.toLowerCase() : 'element';
            }
        }

        // 2) Look for two button-like links: <a class="join"> and <a class="book">
        try {
            var joinLink = iframeDoc.querySelector('a.join');
            var bookLink = iframeDoc.querySelector('a.book');

            if (joinLink) {
                subResults.push('✅ Found <a class="join"> link.');
            } else {
                subResults.push('❌ Missing <a class="join"> link.');
            }
            if (bookLink) {
                subResults.push('✅ Found <a class="book"> link.');
            } else {
                subResults.push('❌ Missing <a class="book"> link.');
            }

            function checkButtonLike(aEl, name) {
                if (!aEl) return;
                var br = getStyle(aEl, 'border-radius') || '';
                var brNorm = br.trim().toLowerCase();
                var nonZero = !(brNorm === '' || brNorm === '0' || brNorm === '0px' || brNorm === 'none' || brNorm === '0%');
                if (nonZero) {
                    subResults.push('✅ ' + name + ' has non-zero border-radius (' + br + ').');
                } else {
                    subResults.push('❌ ' + name + ' border-radius is zero or not set (' + (br || 'not set') + ').');
                }

                var btnBg = getStyle(aEl, 'background-color') || '';
                var containerBg = findContainingBg(aEl) || '';
                var nBtn = normalizeColor(btnBg);
                var nCont = normalizeColor(containerBg);

                if (!hasVisibleBackground(btnBg)) {
                    subResults.push('❌ ' + name + ' does not have a visible background-color (computed: ' + (btnBg || 'none') + ').');
                } else if (!hasVisibleBackground(containerBg)) {
                    // If container has no visible background, consider this a pass for "not matching" but report info
                    subResults.push('ℹ️ ' + name + ' has a visible background (' + btnBg + '), but container has no visible background to compare.');
                } else if (nBtn && nCont && nBtn !== nCont) {
                    subResults.push('✅ ' + name + ' background (' + btnBg + ') does not match its containing element background (' + containerBg + ').');
                } else if (nBtn === nCont) {
                    subResults.push('❌ ' + name + ' background (' + btnBg + ') matches its containing element background (' + containerBg + ').');
                } else {
                    subResults.push('ℹ️ Could not reliably compare ' + name + ' background to its container (computed values: ' + btnBg + ' / ' + containerBg + ').');
                }
            }

            checkButtonLike(joinLink, '<a class="join">');
            checkButtonLike(bookLink, '<a class="book">');
        } catch (e) {
            subResults.push('ℹ️ Could not evaluate button-like links due to an error.');
        }

        results.push(subResults);
    })();

    return results;
}