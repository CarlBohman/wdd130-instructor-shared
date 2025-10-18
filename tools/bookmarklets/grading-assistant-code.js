function addJquery() {
    if (typeof jQuery == 'undefined') {
        var script_jQuery = document.createElement('script');
        script_jQuery.src = 'https://code.jquery.com/jquery-latest.min.js';
        document.body.appendChild(script_jQuery);
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
        for (const element of document.head.getElementsByTagName('*'))
        {
            if (element.tagName.toLowerCase() != 'title')
                element.parentNode.removeChild(element);
        }
        for (const element of iframe.contentWindow.document.body.getElementsByTagName('a'))
        {
            if (element.getAttribute('target') == null) element.setAttribute('target', '_top');
        }
        iframe.contentWindow.document.body.focus();
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
        if (number === 5) {
            const background = iframeDoc.getElementById('background');
            if (background) {
                results.push('✅ Found element with id="background"');
                var computedHeight = getStyle(background, 'height');
                if (computedHeight && computedHeight !== 'auto' && computedHeight !== '0px') {
                    results.push('✅ #background has CSS height: ' + computedHeight);
                } else if (background.style && background.style.height) {
                    results.push('✅ #background has inline height: ' + background.style.height);
                } else {
                    results.push('❌ #background is missing a CSS height');
                }
            } else {
                results.push('❌ Missing element with id="background"');
            }
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
                        results.push('✅ External link "' + url.href + '" has target=\"_blank\"');
                    } else {
                        results.push('❌ External link "' + url.href + '" is missing target=\"_blank\"');
                    }
                }
            }
            if (!foundExternal) {
                results.push('ℹ️ No external links found.');
            }
        } else {
            results.push('❌ Test Rafting #' + number + ' is not implemented yet.');
        }
    } else {
        alert('Unknown activity: ' + activity);
        return;
    }
    // open a popup and show results as an unordered list
    var html = '<html><head><title>Grading Results</title></head><body><h2>Results for ' + escapeHtml(activity) + ' #' + number + '</h2>';
    if (results.length > 0) {
        html += '<ul>' + results.map(function(r){ return '<li>' + escapeHtml(r) + '</li>'; }).join('') + '</ul>';
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