/**
 * Content page viewer (pages/content.html?slug=...).
 *
 * Fetches GET /api/content/:slug (bilingual admin-authored pages such as
 * privacy policy / terms) and renders both languages; the site's html[lang]
 * CSS decides which one is visible.
 *
 * The backend content is admin-authored HTML. It is still sanitized here
 * before insertion: scripts, embeds, event handlers, and non-http(s) URLs
 * are stripped.
 */
(function () {
  "use strict";

  var BLOCKED_TAGS = ["SCRIPT", "IFRAME", "OBJECT", "EMBED", "FORM", "STYLE", "LINK", "META", "BASE"];

  /** Sanitize an HTML string into a safe DocumentFragment. */
  function sanitizeHtml(html) {
    var doc = new DOMParser().parseFromString(String(html || ""), "text/html");

    BLOCKED_TAGS.forEach(function (tag) {
      Array.prototype.slice.call(doc.getElementsByTagName(tag)).forEach(function (node) {
        node.parentNode.removeChild(node);
      });
    });

    Array.prototype.slice.call(doc.body.querySelectorAll("*")).forEach(function (node) {
      Array.prototype.slice.call(node.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        var value = String(attr.value || "");
        if (name.indexOf("on") === 0) {
          node.removeAttribute(attr.name);
        } else if ((name === "href" || name === "src") && /^\s*(javascript|data|vbscript):/i.test(value)) {
          node.removeAttribute(attr.name);
        }
      });
      if (node.tagName === "A") {
        node.setAttribute("rel", "noopener noreferrer");
        node.setAttribute("target", "_blank");
      }
    });

    var frag = document.createDocumentFragment();
    while (doc.body.firstChild) frag.appendChild(doc.body.firstChild);
    return frag;
  }

  function setTitle(titleEn, titleAr) {
    var heading = document.getElementById("contentTitle");
    heading.textContent = "";
    var enSpan = document.createElement("span");
    enSpan.setAttribute("data-en", "");
    enSpan.textContent = titleEn;
    var arSpan = document.createElement("span");
    arSpan.setAttribute("data-ar", "");
    arSpan.textContent = titleAr;
    heading.appendChild(enSpan);
    heading.appendChild(arSpan);
    document.title = "Centerha — " + titleEn;
  }

  function load() {
    var slug = new URLSearchParams(window.location.search).get("slug");
    var errorBox = document.getElementById("contentError");
    var bodyEn = document.getElementById("contentBodyEn");
    var bodyAr = document.getElementById("contentBodyAr");
    errorBox.hidden = true;

    if (!slug) {
      setTitle("Page not found", "الصفحة غير موجودة");
      return;
    }

    window.CenterhaApi.fetchContentPage(slug)
      .then(function (page) {
        if (typeof window.centerhaTrack === "function") {
          window.centerhaTrack("content_page_opened", { slug: page.slug || slug });
        }
        setTitle(page.titleEn, page.titleAr);
        bodyEn.textContent = "";
        bodyAr.textContent = "";
        bodyEn.appendChild(sanitizeHtml(page.contentEn));
        bodyAr.appendChild(sanitizeHtml(page.contentAr));
      })
      .catch(function (error) {
        if (window.console && console.warn) console.warn("Content page unavailable:", error);
        setTitle("Something went wrong", "صار في خطأ");
        errorBox.hidden = false;
      });
  }

  function init() {
    document.getElementById("contentRetry").addEventListener("click", load);
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
