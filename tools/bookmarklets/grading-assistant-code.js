function addJquery() {
    if (typeof jQuery == 'undefined') {
        var script_jQuery = document.createElement('script');
        script_jQuery.src = 'https://code.jquery.com/jquery-latest.min.js';
        document.head.appendChild(script_jQuery);
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
        if (number === 4) {
            // check for <style> tags inside the iframe
            var styleTags = iframeDoc.getElementsByTagName('style');
            if (styleTags.length > 0) {
                results.push('❌ Found <style> tag(s) in the document; please use external CSS files instead.');
            }

            // check for at least one external stylesheet that is actually accessible
            var linkElems = Array.from(iframeDoc.getElementsByTagName('link')).filter(function(l){
                return (l.rel || '').toLowerCase().indexOf('stylesheet') !== -1 && /^https?:\/\//i.test(l.href || '');
            });

            if (linkElems.length === 0) {
                results.push('ℹ️ No external <link rel=\"stylesheet\"> elements found.');
            } else {
                var foundWorking = false;
                for (const linkEl of linkElems) {
                    try {
                        // Accessing cssRules will throw if stylesheet is blocked by CORS or failed to load
                        var rules = linkEl.sheet && linkEl.sheet.cssRules;
                        // If we got rules (even empty) without throwing, treat as working
                        foundWorking = true;
                        results.push('✅ External stylesheet loaded and accessible: ' + linkEl.href);
                        break;
                    } catch (e) {
                        // stylesheet exists but is not accessible (CORS or error)
                        results.push('❌ External stylesheet blocked or failed to load: ' + linkEl.href);
                    }
                }
                if (!foundWorking) {
                    results.push('❌ No external stylesheet links are accessible (they may be blocked by CORS or failed to load).');
                }
            }

            // check for a single wrapper div around body
            var bodyChildren = Array.from(iframeDoc.body.children);
            if (bodyChildren.length === 1 && bodyChildren[0].tagName.toLowerCase() === 'div') {
                var wrapper = bodyChildren[0];
                results.push('✅ Body is wrapped by a single <div>');
                // check id
                if (wrapper.id === 'content') {
                    results.push('✅ Wrapper div has id=\"content\"');
                } else {
                    results.push('❌ Wrapper div must have id=\"content\" (found \"' + (wrapper.id || '') + '\")');
                }
                // check computed max-width
                var computedMaxWidth = getStyle(wrapper, 'max-width');
                var inlineMaxWidth = wrapper.style && wrapper.style.maxWidth;
                var found = false;
                if (computedMaxWidth && computedMaxWidth !== 'none') {
                    if (/^\s*1600(?:\.0+)?px\s*$/i.test(computedMaxWidth)) {
                        results.push('✅ #content has CSS max-width: ' + computedMaxWidth);
                        found = true;
                    } else {
                        // computed exists but not 1600px
                        results.push('❌ #content max-width should be 1600px (found computed: ' + computedMaxWidth + ')');
                        found = true;
                    }
                }
                if (!found && inlineMaxWidth) {
                    if (/^\s*1600(?:\.0+)?px\s*$/i.test(inlineMaxWidth)) {
                        results.push('✅ #content has inline max-width: ' + inlineMaxWidth);
                    } else {
                        results.push('❌ #content max-width should be 1600px (found inline: ' + inlineMaxWidth + ')');
                    }
                    found = true;
                }
                if (!found) {
                    results.push('❌ #content is missing a CSS max-width of 1600px');
                }
            } else {
                results.push('❌ Body must contain a single wrapping <div id=\"content\"> that surrounds all content');
            }

            // check centering for nav links, headlines, buttons, and sections
            (function() {
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

                    // check margins auto or symmetric margins
                    var ml = getStyle(el, 'margin-left');
                    var mr = getStyle(el, 'margin-right');
                    if (ml === 'auto' && mr === 'auto') return { ok: true, reason: 'margin-left and margin-right are auto' };
                    var mlpx = pxValue(ml), mrpx = pxValue(mr);
                    if (typeof mlpx === 'number' && typeof mrpx === 'number') {
                        if (Math.abs(mlpx - mrpx) <= 2) return { ok: true, reason: 'symmetric margins (' + mlpx + 'px / ' + mrpx + 'px)' };
                    }

                    return { ok: false, reason: 'no centering CSS found' };
                }

                function checkSet(list, label) {
                    if (!list || list.length === 0) {
                        results.push('ℹ️ No ' + label + ' found.');
                        return;
                    }
                    var notCentered = [];
                    for (var i = 0; i < list.length; i++) {
                        var el = list[i];
                        var res = isCentered(el);
                        if (res.ok) {
                            // report a few positives for visibility (but not every single element)
                            if (i < 3) results.push('✅ ' + label + ' centered: ' + describe(el) + ' (' + res.reason + ')');
                        } else {
                            notCentered.push(describe(el));
                        }
                    }
                    if (notCentered.length === 0) {
                        results.push('✅ All ' + label + ' are centered.');
                    } else {
                        results.push('❌ The following ' + label + ' are NOT centered: ' + notCentered.slice(0,10).join(', ') +
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
            })();

            // check for element with id="background" and verify it has a CSS height
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

            // check background colors for body, header, nav:hover, buttons, divs, and footer
            (function() {
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
                    results.push('✅ body background-color set: ' + bodyBg);
                } else {
                    results.push('❌ body is missing a visible background-color (computed: ' + (bodyBg || 'none') + ')');
                }

                // header
                var headers = iframeDoc.getElementsByTagName('header');
                if (headers.length === 0) {
                    results.push('ℹ️ No <header> element found.');
                } else {
                    for (var hi = 0; hi < headers.length; hi++) {
                        var hb = getStyle(headers[hi], 'background-color');
                        if (hasVisibleBackground(hb)) {
                            results.push('✅ <header' + (headers[hi].id ? '#' + headers[hi].id : '') + '> background-color: ' + hb);
                        } else {
                            results.push('❌ <header' + (headers[hi].id ? '#' + headers[hi].id : '') + '"> is missing a visible background-color (computed: ' + (hb || 'none') + ')');
                        }
                    }
                }

                // footer
                var footers = iframeDoc.getElementsByTagName('footer');
                if (footers.length === 0) {
                    results.push('ℹ️ No <footer> element found.');
                } else {
                    for (var fi = 0; fi < footers.length; fi++) {
                        var fb = getStyle(footers[fi], 'background-color');
                        if (hasVisibleBackground(fb)) {
                            results.push('✅ <footer' + (footers[fi].id ? '#' + footers[fi].id : '') + '> background-color: ' + fb);
                        } else {
                            results.push('❌ <footer' + (footers[fi].id ? '#' + footers[fi].id : '') + '"> is missing a visible background-color (computed: ' + (fb || 'none') + ')');
                        }
                    }
                }

                // nav:hover — check style rules for any nav:hover selector in accessible stylesheets
                (function() {
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
                                    results.push('✅ Found CSS rule for nav:hover: ' + rule.selectorText);
                                    break;
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                        if (foundHoverRule) break;
                    }
                    if (!foundHoverRule) {
                        results.push('❌ Missing a CSS rule that targets nav:hover (no visible nav hover background detected via stylesheet rules).');
                    }
                })();

                // buttons
                (function() {
                    var btns = [];
                    var bEls = iframeDoc.getElementsByTagName('button');
                    for (var b = 0; b < bEls.length; b++) btns.push(bEls[b]);
                    var inputs = iframeDoc.getElementsByTagName('input');
                    for (var ii = 0; ii < inputs.length; ii++) {
                        var t = (inputs[ii].type || '').toLowerCase();
                        if (t === 'button' || t === 'submit' || t === 'reset') btns.push(inputs[ii]);
                    }
                    if (btns.length === 0) {
                        results.push('ℹ️ No buttons or button-like inputs found.');
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
                            results.push('✅ All buttons have a visible background-color.');
                        } else {
                            results.push('❌ The following buttons are missing a visible background-color: ' + missing.slice(0,10).join(', ') + (missing.length > 10 ? ' (and ' + (missing.length - 10) + ' more)' : ''));
                        }
                    }
                })();

                // divs — require at least one prominent div with background or report how many lack one
                (function() {
                    var divs = Array.from(iframeDoc.getElementsByTagName('div'));
                    if (divs.length === 0) {
                        results.push('ℹ️ No <div> elements found.');
                    } else {
                        var withBg = 0, without = 0;
                        for (var di = 0; di < divs.length; di++) {
                            var vb = getStyle(divs[di], 'background-color');
                            if (hasVisibleBackground(vb)) withBg++; else without++;
                        }
                        if (withBg > 0) {
                            results.push('✅ Found ' + withBg + ' <div> element(s) with a visible background-color; ' + without + ' without.');
                        } else {
                            results.push('❌ No <div> elements have a visible background-color (checked ' + divs.length + ' divs).');
                        }
                    }
                })();
            })();

            // check foreground colors for links, headlines, buttons, and paragraphs
            (function() {
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
                        results.push('ℹ️ No ' + label + ' found.');
                        return;
                    }
                    var missing = [];
                    for (var i = 0; i < list.length; i++) {
                        var el = list[i];
                        var col = getStyle(el, 'color');
                        if (hasVisibleForeground(col)) {
                            if (i < 3) results.push('✅ ' + label + ' has visible color: ' + describe(el) + ' (' + col + ')');
                        } else {
                            missing.push(describe(el));
                        }
                    }
                    if (missing.length === 0) {
                        results.push('✅ All ' + label + ' have a visible foreground color.');
                    } else {
                        results.push('❌ The following ' + label + ' are missing a visible foreground color: ' + missing.slice(0,10).join(', ') +
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
            })();

            // check CSS rules and computed styles for .icon and .logo width:80px
            (function(){
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
                        results.push('✅ CSS rule for .' + className + ' sets width: 80px (found in stylesheet).');
                        return;
                    }
                    if (res.foundRule && res.seenValues.length > 0) {
                        results.push('❌ CSS rule(s) for .' + className + ' set width to: ' + res.seenValues.join(', ') + ' (expected 80px).');
                        return;
                    }
                    // fallback to checking computed style on elements with that class inside the iframe
                    var elems = Array.from(iframeDoc.getElementsByClassName(className));
                    if (elems.length === 0) {
                        results.push('❌ No elements with class "' + className + '" were found to verify width:80px.');
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
                        results.push('✅ Computed width for .' + className + ' elements is 80px (' + elems.length + ' element(s) found).');
                    } else {
                        results.push('❌ Computed widths for .' + className + ' elements: ' + Array.from(seenWidths).join(', ') + ' (expected 80px).');
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
                    results.push('✅ Exactly one <img> has class="logo" (' + logoCount + ' found).');
                } else {
                    results.push('❌ Expected 1 <img> with class="logo", found ' + logoCount + '.');
                }
                if (iconCount === 3) {
                    results.push('✅ Exactly three <img> elements have class="icon" (' + iconCount + ' found).');
                } else {
                    results.push('❌ Expected 3 <img> elements with class="icon", found ' + iconCount + '.');
                }
            })();

            (function(){
                var anchors = Array.from(iframeDoc.getElementsByTagName('a'));
                if (anchors.length === 0) {
                    results.push('ℹ️ No <a> elements found to check underlines.');
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
                        var desc = a.tagName.toLowerCase();
                        if (a.id) desc += '#' + a.id;
                        if (a.className) desc += '.' + a.className.replace(/\s+/g, '.');
                        var txt = (a.textContent || '').trim().replace(/\s+/g,' ');
                        if (txt) desc += ' "' + txt.slice(0,30) + (txt.length > 30 ? '…' : '') + '"';
                        underlined.push(desc);
                    }
                }
                if (underlined.length === 0) {
                    results.push('✅ All <a> elements have the default underline removed.');
                } else {
                    results.push('❌ The following <a> elements still have an underline: ' + underlined.slice(0,10).join(', ') + (underlined.length > 10 ? ' (and ' + (underlined.length - 10) + ' more)' : ''));
                }
            })();

            // check that all external links have target="_blank"
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