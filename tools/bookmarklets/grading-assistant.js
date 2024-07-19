javascript:
function addJquery() {
    if (typeof jQuery == 'undefined') {
        var script_jQuery = document.createElement('script');
        script_jQuery.src = 'https://code.jquery.com/jquery-latest.min.js';
        document.body.appendChild(script_jQuery);
    }
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
            li.style.backgroundColor = d;
            x = document.createElement("span");
            x.innerHTML = rgbToHex(d) + " " + d;
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
    var cf = document.getElementById("colors_and_fonts");
    if (cf == null) {
        var fontImports = getFontImportStatements();
        var iframe = document.createElement("iframe");
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
    }
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
    var elements = iframe.contentWindow.document.getElementsByTagName("*");
    for (const cur of elements) {
        bg.add(getStyle(cur, "background-color"));
        fg.add(getStyle(cur, "color"));
        font.add(getStyle(cur, "font-family"));
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
    addList(cf, "background-color", bg, 'color');
    addList(cf, "color", fg, 'color');
    addList(cf, "font-family", font, 'font');
    addList(cf, "links", links, 'link');
    addList(cf, "External Links", elinks, 'element');
    document.body.scrollTop = document.documentElement.scrollTop = 0;
}
addJquery();
createIframe();
setTimeout(() => {
    displayFontsAndColors();
}, 100);
