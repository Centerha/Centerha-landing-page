/** Shared API-backed viewer for Centerha content pages. */
(function () {
  "use strict";

  var FORMATTING_TAGS = new Set(["P", "H2", "H3", "UL", "OL", "LI", "STRONG", "EM", "BR"]);
  var currentTitle = null;

  /** Copy only plain text and formatting in the HTML namespace. */
  function sanitizeHtml(html) {
    var parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
    function copy(node, parent) {
      if (node.nodeType === Node.TEXT_NODE) {
        parent.appendChild(document.createTextNode(node.textContent));
      } else if (node.namespaceURI === "http://www.w3.org/1999/xhtml" && FORMATTING_TAGS.has(node.tagName)) {
        var element = document.createElement(node.tagName);
        node.childNodes.forEach(function (child) { copy(child, element); });
        parent.appendChild(element);
      }
    }
    var fragment = document.createDocumentFragment();
    parsed.body.childNodes.forEach(function (node) { copy(node, fragment); });
    return fragment;
  }

  function setTitle(titleEn, titleAr) {
    currentTitle = { en: titleEn, ar: titleAr };
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
    var lang = window.CenterhaLanguage ? window.CenterhaLanguage.get() : "en";
    document.title = lang === "ar" ? "سنطرها — " + titleAr : "Centerha — " + titleEn;
  }

  function load() {
    var fixedSlug = document.body.dataset.contentSlug;
    var slug = fixedSlug || new URLSearchParams(window.location.search).get("slug");
    var canonical = { "terms-of-use": "/terms", "privacy-policy": "/privacy-policy", support: "/support" };
    if (!fixedSlug && Object.hasOwn(canonical, slug)) {
      window.location.replace(canonical[slug]);
      return;
    }
    var updated = document.getElementById("contentUpdated");
    var pending = document.getElementById("contentPending");
    var errorBox = document.getElementById("contentError");
    var bodyEn = document.getElementById("contentBodyEn");
    var bodyAr = document.getElementById("contentBodyAr");
    errorBox.hidden = true;
    if (pending) pending.hidden = true;

    if (!slug) {
      setTitle("Page not found", "الصفحة غير موجودة");
      return;
    }

    var loadPage = pending
      ? window.CenterhaApi.fetchContentList().then(function (pages) {
          return pages.some(function (page) { return page.slug === slug; })
            ? window.CenterhaApi.fetchContentPage(slug) : null;
        })
      : window.CenterhaApi.fetchContentPage(slug);
    loadPage.then(function (page) {
        if (page === null && pending) {
          pending.hidden = false;
          return;
        }
        if (typeof window.centerhaTrack === "function") {
          window.centerhaTrack("content_page_opened", { slug: page.slug || slug });
        }
        setTitle(page.titleEn, page.titleAr);
        bodyEn.textContent = "";
        bodyAr.textContent = "";
        bodyEn.appendChild(sanitizeHtml(page.contentEn));
        bodyAr.appendChild(sanitizeHtml(page.contentAr));
        if (updated && page.updatedAt) {
          var timestamp = new Date(page.updatedAt);
          if (!Number.isNaN(timestamp.getTime())) {
            updated.querySelectorAll("time").forEach(function (time) {
              time.dateTime = timestamp.toISOString();
              time.textContent = new Intl.DateTimeFormat(time.lang, {
                dateStyle: "long", timeZone: "Asia/Damascus"
              }).format(timestamp);
            });
            updated.hidden = false;
          }
        }
      })
      .catch(function () {
        if (!document.body.dataset.contentSlug) setTitle("Page unavailable", "الصفحة غير متاحة");
        errorBox.hidden = false;
      });
  }

  function init() {
    if (document.body.dataset.contentSlug) {
      var heading = document.getElementById("contentTitle");
      setTitle(heading.querySelector("[data-en]").textContent, heading.querySelector("[data-ar]").textContent);
    }
    document.getElementById("contentRetry").addEventListener("click", load);
    document.addEventListener("centerha:languagechange", function () {
      if (!currentTitle) return;
      var lang = window.CenterhaLanguage ? window.CenterhaLanguage.get() : "en";
      document.title = lang === "ar" ? "سنطرها — " + currentTitle.ar : "Centerha — " + currentTitle.en;
    });
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
